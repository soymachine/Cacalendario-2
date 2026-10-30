// Simulador funcional de Fluxia: 1 médico + 9 pacientes viven un mes virtual
// contra un Supabase de pruebas, haciendo las mismas llamadas que las apps, y
// al final se comprueba que todo cuadra (checks.ts).
//
//   bash tests/sim/local.sh            # levanta Supabase local y lo ejecuta
//
// Variables: SIM_SUPABASE_URL, SIM_ANON_KEY, SIM_SERVICE_KEY (las imprime
// `supabase status`), SIM_SEED (número o "random"; por defecto 1).
// Se niega a ejecutarse contra producción. El informe se sube a /admin si hay
// SIM_REPORT_URL/KEY/TOKEN (ver report.ts).

import { addDays, DEFAULT_FOOD_CONFIG, enableFoodConfig, entryTimestamp, localDateKey } from '../../src/lib/food.ts';
import { Admin, DoctorAgent, PatientAgent, type SimEnv } from './agents.ts';
import { runChecks, type CheckResult, type SimState } from './checks.ts';
import { buildReport, type DoctorSnapshot, printReport, saveReport, takeSnapshot, type Timings, uploadReport } from './report.ts';
import { DOCTOR, PERSONAS } from './personas.ts';
import { generateScenario, SIM_DAYS, type SimEntry } from './scenario.ts';

const PROD_REF = 'vchzhwvbvnwrrgfrxfor';

function env(): SimEnv {
  const url = process.env.SIM_SUPABASE_URL ?? '';
  const anonKey = process.env.SIM_ANON_KEY ?? '';
  const serviceKey = process.env.SIM_SERVICE_KEY ?? '';
  if (!url || !anonKey || !serviceKey) throw new Error('Faltan SIM_SUPABASE_URL / SIM_ANON_KEY / SIM_SERVICE_KEY');
  if (url.includes(PROD_REF)) throw new Error('El simulador nunca se ejecuta contra producción.');
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url);
  if (!local && process.env.SIM_ALLOW_REMOTE !== '1') {
    throw new Error(`${url} no es local. Para un proyecto de staging, exporta SIM_ALLOW_REMOTE=1.`);
  }
  return { url, anonKey, serviceKey };
}

/** Instante ISO de un día virtual a una hora local. */
const at = (date: string, time: string) => new Date(entryTimestamp(date, time)).toISOString();

async function main() {
  const e = env();
  const seedEnv = process.env.SIM_SEED ?? '1';
  const seed = seedEnv === 'random' ? Math.floor(Math.random() * 2 ** 31) : Number(seedEnv);
  const runId = Date.now().toString(36);
  const now = Date.now();
  const timings: Timings = { started: now };
  const today = localDateKey();
  const scenario = generateScenario({ seed, personas: PERSONAS, today, now });
  const dayKey = (d: number) => addDays(scenario.startDate, d);
  const emailOf = (key: string) => `sim-${runId}-${key}@sim.fluxia.test`;
  const log = (msg: string) => console.log(`  ${msg}`);

  console.log(`\nFluxia · simulación de ${SIM_DAYS} días (${scenario.startDate} → ${today}) · semilla ${seed} · run ${runId}\n`);

  const admin = new Admin(e);
  const doctor = new DoctorAgent(e, emailOf(DOCTOR.key));
  const patients = new Map(PERSONAS.map((p) => [p.key, new PatientAgent(e, emailOf(p.key))]));
  const state: SimState = {
    env: e, scenario, admin, doctor, patients, personas: PERSONAS,
    linkIds: new Map(), photoPaths: new Map(), unlinkedAt: new Map(), errors: [],
  };

  let checks: CheckResult[] = [];
  let snapshot: DoctorSnapshot | null = null;
  let currentDay: number | null = null;

  // Un error en una acción no para la simulación: se apunta y se sigue,
  // para ver todo lo que falla en una sola ejecución.
  const attempt = async (what: string, fn: () => Promise<unknown>) => {
    try { await fn(); } catch (err) {
      state.errors.push({ day: currentDay, what, message: err instanceof Error ? err.message : String(err) });
    }
  };

  // Si algo rompe la simulación entera, se informa igualmente (estado "error").
  let fatal: string | undefined;
  try {
    // ── Día 0: altas ──
    console.log('Día 0 · altas e invitaciones');
    await doctor.signUp(DOCTOR.name, DOCTOR.center, DOCTOR.specialty);
    await doctor.bootstrap(DOCTOR.name, DOCTOR.center, DOCTOR.specialty);
    // El médico se dio de alta el día 0: el trial cuenta desde entonces. Justo
    // 29 días antes de ahora (no a medianoche) para que un cambio de hora en
    // medio del mes no mueva el recuento de días.
    await admin.setColumns('doctors', { id: doctor.userId }, {
      created_at: at(dayKey(0), '00:00'), test_plan_started_at: new Date(now - (SIM_DAYS - 1) * 86400000).toISOString(),
    });
    log(`médico ${doctor.email} (trial desde ${dayKey(0)})`);

    for (const p of PERSONAS) {
      const agent = patients.get(p.key)!;
      await agent.signUp();
      if (p.push) await attempt(`${p.key}: registrar push`, () => agent.registerPush());
      const linkId = await doctor.invite(agent.email);
      state.linkIds.set(p.key, linkId);
      await admin.setColumns('patient_links', { id: linkId }, { invited_at: at(dayKey(0), '09:00') });
    }
    log(`${PERSONAS.length} pacientes dados de alta e invitados`);
    timings.setupDone = Date.now();

    // ── Días 0..29 ──
    for (let day = 0; day < SIM_DAYS; day++) {
      const date = dayKey(day);
      currentDay = day;

      for (const p of PERSONAS) {
        const agent = patients.get(p.key)!;
        const linkId = state.linkIds.get(p.key)!;

        if (p.invite.day === day) {
          await attempt(`${p.key}: responder invitación`, async () => {
            const pending = await agent.pendingInvites();
            const inv = pending.find((i) => i.id === linkId);
            if (!inv) throw new Error(`la invitación no aparece en patient_get_pending_invites (${pending.length} pendientes)`);
            const res = await agent.respondToInvite(inv.id, p.invite.respond === 'accept');
            if (!res.success) throw new Error(res.error ?? 'respuesta sin éxito');
            if (p.invite.respond === 'accept') await admin.setColumns('patient_links', { id: linkId }, { accepted_at: at(date, '10:00') });
          });
        }

        if (p.doctorConfig?.day === day) {
          const c = p.doctorConfig;
          await attempt(`médico: configurar ${p.key}`, () => doctor.savePatientConfig(linkId, {
            ...(c.entryTypeMode ? { entry_type_mode: c.entryTypeMode } : {}),
            ...(c.tags ? { tags: c.tags } : {}),
            ...(c.semaforo ? { semaforo_override: true, semaforo_green_override: c.semaforo.green, semaforo_red_override: c.semaforo.red } : {}),
            ...(c.food ? { food_config: enableFoodConfig({ ...structuredClone(DEFAULT_FOOD_CONFIG), ...c.food }, date) } : {}),
          }));
        }
      }

      // Registros de los pacientes ese día
      const saved = new Map<string, SimEntry[]>();
      for (const a of scenario.days[day]) {
        const agent = patients.get(a.persona)!;
        const photos = state.photoPaths.get(a.persona) ?? new Map<string, string>();
        state.photoPaths.set(a.persona, photos);
        if (a.kind === 'delete') {
          await attempt(`${a.persona}: borrar ${a.entryId}`, () => agent.deleteEntry(a.entryId));
          continue;
        }
        await attempt(`${a.persona}: ${a.kind} ${a.entry.entry_type} ${a.entry.date} ${a.entry.time}`, async () => {
          if (a.kind === 'save' && a.entry.withPhoto) photos.set(a.entry.id, await agent.uploadPhoto(a.entry.id));
          await agent.saveEntry(a.entry, photos.get(a.entry.id) ?? null);
        });
        if (a.kind === 'save') saved.set(a.persona, [...(saved.get(a.persona) ?? []), a.entry]);
      }
      for (const [key, entries] of saved) {
        await attempt(`${key}: fechar registros del día ${day}`, () => admin.backdateEntries(patients.get(key)!.userId, entries));
      }

      // Rutina del médico
      for (const p of PERSONAS.filter((x) => x.archiveDay === day)) {
        const linkId = state.linkIds.get(p.key)!;
        const unlinkedAt = at(date, '12:00');
        await attempt(`médico: archivar ${p.key}`, async () => {
          await doctor.archive(linkId);
          await admin.setColumns('patient_links', { id: linkId }, { unlinked_at: unlinkedAt });
        });
        state.unlinkedAt.set(p.key, unlinkedAt);
      }
      if (day % 7 === 6) await attempt(`médico: revisar pacientes (día ${day})`, () => doctor.loadPatients());

      const n = scenario.days[day].length;
      if (day % 5 === 4 || day === SIM_DAYS - 1) log(`día ${String(day).padStart(2)} (${date}) · ${n} acciones · ${state.errors.length} errores acumulados`);
    }

    currentDay = null;

    // Notas del médico sobre el brote de Javier
    const javierEntry = [...scenario.expected.get('javier')!.values()].find((x) => (x.bristol ?? 0) >= 6);
    await attempt('médico: nota clínica', () => doctor.addClinicalNote(state.linkIds.get('javier')!, 'Brote diarreico; pedir coprocultivo.'));
    if (javierEntry) await attempt('médico: nota en registro', () => doctor.addEntryNote(javierEntry.id, 'Revisar en consulta'));

    timings.simulateDone = Date.now();

    // ── Comprobaciones ──
    snapshot = await takeSnapshot(state);
    console.log('\nComprobaciones');
    checks = await runChecks(state);
    timings.checksDone = Date.now();
  } catch (err) {
    fatal = err instanceof Error ? err.message : String(err);
  }

  const report = buildReport({ state, runId, seed, timings, checks, snapshot, fatal });
  printReport(report);
  saveReport(report);
  const uploaded = await uploadReport(report);
  process.exitCode = report.status === 'pass' ? 0 : report.status === 'fail' ? 1 : 2;
  if (!uploaded && process.env.GITHUB_ACTIONS && !process.exitCode) process.exitCode = 3;
}

main().catch((err) => {
  console.error('\n✘ La simulación no pudo completarse:', err instanceof Error ? err.message : err);
  process.exitCode = 2;
});
