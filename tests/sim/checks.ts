// Comprobaciones al final del mes virtual. La referencia es lo que generó el
// escenario (lo que cada paciente apuntó); se compara con lo que devuelve
// Supabase a cada agente con su propia sesión.
//
// Estados: pass · fail (rompe la ejecución) · warn (aviso, no rompe) ·
// known (fallo ya conocido, con tarea abierta: no rompe) · fixed (un fallo
// conocido que ya no ocurre: hay que quitarlo de KNOWN).

import { patientDaysSinceLast } from '../../src/lib/food.ts';
import { isAccessBlocked, testPlanDaysLeft, type DoctorPlan } from '../../src/lib/plan.ts';
import { getSemaforoKey, resolveSemaforoThresholds } from '../../src/lib/semaforo.ts';
import type { SimCheck, SimError } from '../../src/lib/simReport.ts';
import { type Admin, type DoctorAgent, entryRow, PatientAgent, type SimEnv } from './agents.ts';
import type { Persona } from './personas.ts';
import type { Scenario, SimEntry } from './scenario.ts';

export interface SimState {
  env: SimEnv;
  scenario: Scenario;
  admin: Admin;
  doctor: DoctorAgent;
  patients: Map<string, PatientAgent>;
  personas: Persona[];
  linkIds: Map<string, string>;
  /** Fotos subidas: paciente → id de registro → ruta en food-photos. */
  photoPaths: Map<string, Map<string, string>>;
  /** Fecha (ISO) en que el médico archivó a cada paciente. */
  unlinkedAt: Map<string, string>;
  errors: SimError[];
}

export type CheckResult = SimCheck;

/**
 * Fallos de seguridad ya detectados en producción y pendientes de corregir.
 * Mientras sigan ocurriendo se marcan como "conocidos" y no rompen la
 * ejecución diaria; cuando dejen de ocurrir, el informe pide quitarlos de aquí.
 */
const KNOWN: Record<string, string> = {};

type Outcome = { ok: boolean; detail?: string };

export async function runChecks(s: SimState): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const check = async (area: string, name: string, fn: () => Promise<Outcome>, opts: { warnOnly?: boolean; known?: string } = {}) => {
    let out: Outcome;
    const t0 = Date.now();
    try { out = await fn(); } catch (err) { out = { ok: false, detail: err instanceof Error ? err.message : String(err) }; }
    const knownWhy = opts.known ? KNOWN[opts.known] : undefined;
    const status: CheckResult['status'] = out.ok
      ? (knownWhy ? 'fixed' : 'pass')
      : knownWhy ? 'known' : opts.warnOnly ? 'warn' : 'fail';
    const detail = status === 'fixed' ? `ya no ocurre: quita '${opts.known}' de KNOWN en tests/sim/checks.ts`
      : status === 'known' ? `${knownWhy}${out.detail ? ` · ${out.detail}` : ''}`
      // El detalle de cada comprobación describe el fallo: si pasa, no se guarda.
      : status === 'pass' ? undefined : out.detail;
    results.push({ area, name, status, detail, ms: Date.now() - t0 });
  };

  const { doctor, admin, scenario } = s;
  const agent = (k: string) => s.patients.get(k)!;
  const expectedOf = (k: string) => [...scenario.expected.get(k)!.values()];
  const linked = s.personas.filter((p) => p.invite.respond === 'accept');
  const views = await doctor.loadPatients();
  const viewOf = (k: string) => views.find((v) => v.linkId === s.linkIds.get(k));
  const visibleToDoctor = (k: string): SimEntry[] => {
    const cut = s.unlinkedAt.get(k);
    return expectedOf(k).filter((e) => !cut || e.timestamp <= Date.parse(cut));
  };

  // ── 1. Lo que apunta cada paciente llega entero a la nube ──
  for (const p of s.personas) {
    await check('Registros del paciente (PA → Supabase)', `${p.key}: sus registros coinciden con lo que apuntó`, async () => {
      const rows = await agent(p.key).fetchOwnEntries();
      const photos = s.photoPaths.get(p.key) ?? new Map();
      return compareEntries(rows, expectedOf(p.key), (e) => entryRow(agent(p.key).userId, e, photos.get(e.id) ?? null));
    });
  }

  // ── 2. Lo que ve el médico ──
  await check('Panel del médico (MW/MA)', 've a sus 9 pacientes invitados', async () => {
    const missing = s.personas.filter((p) => !viewOf(p.key));
    return { ok: missing.length === 0 && views.length === s.personas.length, detail: `ve ${views.length}; faltan: ${missing.map((p) => p.key).join(', ') || '—'}` };
  });

  for (const p of linked) {
    await check('Panel del médico (MW/MA)', `${p.key}: ve exactamente sus registros${p.archiveDay !== undefined ? ' hasta que lo archivó' : ''}`, async () => {
      const v = viewOf(p.key);
      if (!v?.patientId) return { ok: false, detail: `vínculo sin paciente (estado ${v?.status})` };
      const rows = await doctor.patientEntries(v.patientId, (v.link.unlinked_at as string | null) ?? null);
      const want = new Set(visibleToDoctor(p.key).map((e) => e.id));
      const got = new Set(rows.map((r) => r.entry_id as string));
      return setDiff(want, got);
    });
  }

  for (const p of s.personas.filter((x) => x.invite.respond === 'reject')) {
    await check('Panel del médico (MW/MA)', `${p.key}: rechazó la invitación y el médico no ve ningún registro suyo`, async () => {
      const v = viewOf(p.key);
      const rows = await doctor.patientEntries(agent(p.key).userId, null);
      return { ok: v?.status === 'rejected' && rows.length === 0, detail: `estado ${v?.status}, ${rows.length} registros visibles` };
    });
  }

  for (const p of s.personas.filter((x) => x.archiveDay !== undefined)) {
    await check('Panel del médico (MW/MA)', `${p.key}: tras archivar, la base de datos no deja leer registros posteriores`, async () => {
      const rows = await doctor.patientEntries(agent(p.key).userId, null);
      const after = rows.length - visibleToDoctor(p.key).length;
      return { ok: after <= 0, detail: `el médico puede leer ${after} registros posteriores al archivo` };
    });
  }

  await check('Panel del médico (MW/MA)', 'puede abrir las fotos de comida de sus pacientes', async () => {
    const paths = [...(s.photoPaths.get('laura')?.values() ?? [])];
    if (!paths.length) return { ok: false, detail: 'la simulación no subió ninguna foto' };
    const sample = paths.slice(0, 5);
    const urls = await Promise.all(sample.map((path) => doctor.signedPhotoUrl(path)));
    const bad = sample.filter((_, i) => !urls[i]);
    return { ok: bad.length === 0, detail: `${bad.length}/${sample.length} sin URL firmada` };
  });

  // ── 3. Semáforo ──
  const doctorProfile = await doctor.profile();
  for (const p of linked) {
    await check('Semáforo', `${p.key}: días sin registrar = ${expectedDays(s, p.key, viewOf(p.key)?.link) ?? '—'}`, async () => {
      const v = viewOf(p.key);
      const want = expectedDays(s, p.key, v?.link);
      return { ok: v?.daysSinceLast === want, detail: `el panel calcula ${v?.daysSinceLast}, debería ser ${want}` };
    });
  }
  const semaforoOf = (k: string) => {
    const v = viewOf(k)!;
    const t = resolveSemaforoThresholds(Number(doctorProfile.semaforo_green), Number(doctorProfile.semaforo_red), {
      enabled: !!v.link.semaforo_override, green: v.link.semaforo_green_override as number | null, red: v.link.semaforo_red_override as number | null,
    });
    return getSemaforoKey(v.daysSinceLast, t.green, t.red);
  };
  await check('Semáforo', 'carmen (abandonó el día 9) está en rojo', async () => ({ ok: semaforoOf('carmen') === 'red', detail: semaforoOf('carmen') }));
  await check('Semáforo', 'laura (registra a diario) está en verde', async () => ({ ok: semaforoOf('laura') === 'green', detail: semaforoOf('laura') }));
  await check('Semáforo', 'elena usa sus umbrales propios (3/5)', async () => {
    const l = viewOf('elena')!.link;
    return { ok: l.semaforo_override === true && l.semaforo_green_override === 3 && l.semaforo_red_override === 5, detail: JSON.stringify({ o: l.semaforo_override, g: l.semaforo_green_override, r: l.semaforo_red_override }) };
  });

  // ── 4. Avisos de inactividad (lo que usa check-inactive-patients) ──
  const needing = new Set((await admin.rpc<{ patient_id: string }[]>('get_patients_needing_push')).map((r) => r.patient_id));
  const inPush = (k: string) => needing.has(agent(k).userId);
  await check('Avisos de inactividad', 'carmen (inactiva, con push) recibe aviso', async () => ({ ok: inPush('carmen') }));
  await check('Avisos de inactividad', 'lucia (archivada) no recibe avisos', async () => ({ ok: !inPush('lucia') }));
  await check('Avisos de inactividad', 'andres (rechazó) no recibe avisos', async () => ({ ok: !inPush('andres') }));
  await check('Avisos de inactividad', 'elena (sin push) no aparece', async () => ({ ok: !inPush('elena') }));

  // ── 5. Trial del médico ──
  await check('Trial del médico', 'tras 29 días sigue en prueba con 1 día restante', async () => {
    const d = await doctor.profile();
    const left = testPlanDaysLeft(d.test_plan_started_at as string);
    return { ok: d.plan === 'test' && left === 1 && !isAccessBlocked(d.plan as DoctorPlan, d.test_plan_started_at as string), detail: `plan ${d.plan}, quedan ${left}` };
  });
  await check('Trial del médico', 'el médico no puede pasarse a Pro él mismo', async () => {
    const { error } = await doctor.sb.from('doctors').update({ plan: 'pro' }).eq('id', doctor.userId);
    return { ok: !!error, detail: 'el update se aceptó' };
  });
  await check('Trial del médico', 'al día 30 el acceso queda bloqueado (pantalla de pago)', async () => {
    const started = new Date(Date.now() - 30 * 86400000 - 60000).toISOString();
    await admin.setColumns('doctors', { id: doctor.userId }, { test_plan_started_at: started });
    const d = await doctor.profile();
    return { ok: isAccessBlocked(d.plan as DoctorPlan, d.test_plan_started_at as string), detail: `plan ${d.plan}, quedan ${testPlanDaysLeft(d.test_plan_started_at as string)}` };
  });

  // ── 6. Seguridad entre usuarios (RLS) ──
  const laura = agent('laura');
  const marcos = agent('marcos');
  await check('Seguridad (RLS)', 'un paciente no ve los registros de otro', async () => {
    const { data } = await marcos.sb.from('entries').select('id').eq('user_id', laura.userId);
    return { ok: (data ?? []).length === 0, detail: `ve ${data?.length} registros ajenos` };
  });
  await check('Seguridad (RLS)', 'un paciente no puede escribir registros a nombre de otro', async () => {
    const fake = { ...expectedOf('laura')[0], id: `sim_forged_${Date.now()}` };
    const { error } = await marcos.sb.from('entries').insert(entryRow(laura.userId, fake, null));
    return { ok: !!error, detail: 'el insert se aceptó' };
  });
  await check('Seguridad (RLS)', 'un paciente no ve los vínculos de otros', async () => {
    const { data } = await marcos.sb.from('patient_links').select('id, patient_id');
    const foreign = (data ?? []).filter((l) => l.patient_id !== marcos.userId);
    return { ok: foreign.length === 0, detail: `ve ${foreign.length} vínculos ajenos` };
  });
  await check('Seguridad (RLS)', 'un paciente no puede cambiar su pauta de comidas', async () => {
    const { data } = await laura.sb.from('patient_links').update({ food_config: { version: 1, enabled: false } }).eq('id', s.linkIds.get('laura')!).select('id');
    return { ok: (data ?? []).length === 0, detail: 'el update se aceptó' };
  });
  await check('Seguridad (RLS)', 'un paciente no puede abrir las fotos de otro', async () => {
    const path = [...(s.photoPaths.get('laura')?.values() ?? [])][0];
    if (!path) return { ok: false, detail: 'no hay fotos' };
    const { data, error } = await marcos.sb.storage.from('food-photos').download(path);
    return { ok: !!error && !data, detail: 'la descarga funcionó' };
  });
  await check('Seguridad (RLS)', 'un paciente no ve las notas del médico sobre sus registros', async () => {
    const { data } = await agent('javier').sb.from('entry_doctor_notes').select('id');
    return { ok: (data ?? []).length === 0, detail: `ve ${data?.length} notas` };
  });
  await check('Seguridad (RLS)', 'un paciente no puede tocar la facturación', async () => {
    const { error } = await marcos.sb.rpc('billing_apply_subscription', { p_customer_id: 'cus_sim', p_doctor_id: doctor.userId, p_plan: 'pro' });
    return { ok: !!error, detail: 'la RPC se ejecutó' };
  });
  await check('Seguridad (RLS)', 'un médico no puede vincularse por su cuenta a un paciente que no aceptó', async () => {
    const victim = agent('andres');
    const forged = await doctor.sb.from('patient_links')
      .insert({ doctor_id: doctor.userId, patient_id: victim.userId, status: 'accepted' }).select('id');
    const forgedId = forged.data?.[0]?.id as string | undefined;
    const hijacked = await doctor.sb.from('patient_links')
      .update({ patient_id: victim.userId, status: 'accepted' }).eq('id', s.linkIds.get('andres')!).select('id');
    const { data: leaked } = await doctor.sb.from('entries').select('id').eq('user_id', victim.userId);
    if (forgedId) await admin.sb.from('patient_links').delete().eq('id', forgedId);
    await admin.sb.from('patient_links').update({ patient_id: null, status: 'rejected' }).eq('id', s.linkIds.get('andres')!);
    const how = [forgedId && 'creando un vínculo', (hijacked.data ?? []).length && 'editando la invitación rechazada'].filter(Boolean).join(' y ');
    return { ok: !how && (leaked ?? []).length === 0, detail: `${how || 'sin vínculo'}: lee ${leaked?.length ?? 0} registros de andres` };
  });
  await check('Seguridad (RLS)', 'un médico no puede cambiarse de centro', async () => {
    const { data } = await doctor.sb.from('doctors').update({ center_id: null }).eq('id', doctor.userId).select('id');
    const changed = (data ?? []).length > 0;
    if (changed) await admin.sb.from('doctors').update({ center_id: doctorProfile.center_id }).eq('id', doctor.userId);
    return { ok: !changed, detail: 'el update se aceptó' };
  });
  await check('Seguridad (RLS)', 'un paciente no puede leer el buzón de sugerencias', async () => {
    const { error } = await marcos.sb.from('feedback').insert({ user_email: marcos.email, message: 'Simulación: sugerencia', type: 'suggestion' });
    const { data } = await laura.sb.from('feedback').select('id');
    return { ok: (data ?? []).length === 0 && !error, detail: `lee ${data?.length} sugerencias${error ? `; no puede enviar: ${error.message}` : ''}` };
  });
  await check('Seguridad (RLS)', 'un paciente no puede hacerse premium', async () => {
    const { data } = await marcos.sb.from('user_profiles').update({ tier: 'premium' }).eq('id', marcos.userId).select('tier');
    const changed = data?.[0]?.tier === 'premium';
    if (changed) await admin.sb.from('user_profiles').update({ tier: 'free' }).eq('id', marcos.userId);
    const { error: nameErr } = await marcos.sb.from('user_profiles')
      .upsert({ id: marcos.userId, display_name: 'Marcos', email: marcos.email }, { onConflict: 'id' });
    return { ok: !changed && !nameErr, detail: changed ? 'se puso premium' : `no puede guardar su nombre: ${nameErr?.message}` };
  });
  await check('Seguridad (RLS)', 'un paciente no puede modificar el centro de su médico', async () => {
    const centerId = doctorProfile.center_id as string;
    const before = await admin.sb.from('centers').select('name').eq('id', centerId).single();
    const { data } = await marcos.sb.from('centers').update({ name: 'Hackeado por un paciente' }).eq('id', centerId).select('id');
    const changed = (data ?? []).length > 0;
    if (changed) await admin.sb.from('centers').update({ name: before.data?.name }).eq('id', centerId);
    return { ok: !changed, detail: 'el paciente renombró el centro' };
  });
  await check('Seguridad (RLS)', 'un paciente no puede cambiar las etiquetas ni las notas del médico en su vínculo', async () => {
    const linkId = s.linkIds.get('marcos')!;
    const { data } = await marcos.sb.from('patient_links').update({ tags: ['puesto-por-el-paciente'], doctor_notes: 'x' }).eq('id', linkId).select('id');
    const changed = (data ?? []).length > 0;
    if (changed) await admin.sb.from('patient_links').update({ tags: [], doctor_notes: null }).eq('id', linkId);
    return { ok: !changed, detail: 'el paciente sobrescribió tags y doctor_notes' };
  });

  // ── 7. Flujos legítimos que las restricciones de arriba no deben romper ──
  const legit = 'Flujos legítimos del médico';
  const changedRows = (what: string, res: { data: unknown[] | null; error: { message: string } | null }): Outcome =>
    ({ ok: !res.error && (res.data ?? []).length > 0, detail: res.error ? `${what}: ${res.error.message}` : `${what}: no cambió ninguna fila` });

  await check(legit, 'renombra su centro y cambia su imagen (Configuración)', async () => {
    const res = await doctor.sb.from('centers').update({ name: 'Consulta Simulada (renombrada)', image_url: null })
      .eq('id', doctorProfile.center_id as string).select('id');
    return changedRows('centers update', res);
  });
  await check(legit, 'edita la ficha y los avisos de un paciente', async () => {
    const res = await doctor.sb.from('patient_links')
      .update({ dob: '1980-05-01', height_cm: 170, weight_kg: 68.5, push_min_hours: 48, push_frequency: 1, push_disabled: false, doctor_notes: 'Ficha' })
      .eq('id', s.linkIds.get('marcos')!).select('id');
    return changedRows('patient_links update', res);
  });
  await check(legit, 'reactiva un seguimiento archivado y vuelve a verlo todo', async () => {
    const res = await doctor.sb.from('patient_links').update({ doctor_unlinked: false, unlinked_at: null })
      .eq('id', s.linkIds.get('lucia')!).select('id');
    if (res.error || !(res.data ?? []).length) return changedRows('desarchivar', res);
    const rows = await doctor.patientEntries(agent('lucia').userId, null);
    return { ok: rows.length === expectedOf('lucia').length, detail: `ve ${rows.length} de ${expectedOf('lucia').length}` };
  });
  await check(legit, 'borra una invitación pendiente', async () => {
    const id = await doctor.invite(`sim-pendiente-${Date.now()}@sim.fluxia.test`);
    const res = await doctor.sb.from('patient_links').delete().eq('id', id).select('id');
    return changedRows('patient_links delete', res);
  });
  await check(legit, 'alta con Google: crea su centro y su ficha de médico', async () => {
    const google = new PatientAgent(s.env, `sim-google-${Date.now()}@sim.fluxia.test`);
    await google.signUp();
    const center = await google.sb.from('centers').insert({ name: 'Centro Google' }).select('id').single();
    if (center.error) return { ok: false, detail: `centers insert: ${center.error.message}` };
    const doc = await google.sb.from('doctors').insert({ id: google.userId, center_id: center.data.id, name: 'Dr. Google' }).select('plan');
    return { ok: !doc.error && doc.data?.[0]?.plan === 'test', detail: doc.error?.message ?? `plan ${doc.data?.[0]?.plan}` };
  });
  await check(legit, 'alta por invitación del admin: reclama el centro preparado', async () => {
    const email = `sim-invitado-${Date.now()}@sim.fluxia.test`;
    const pre = await admin.sb.from('centers').insert({ name: 'Centro preparado', pending_doctor_email: email, pending_doctor_name: 'Dr. Invitado' }).select('id').single();
    const invited = new PatientAgent(s.env, email);
    await invited.signUp();
    const found = await invited.sb.from('centers').select('*').eq('pending_doctor_email', email).limit(1).single();
    if (found.error) return { ok: false, detail: `buscar centro: ${found.error.message}` };
    const doc = await invited.sb.from('doctors').insert({ id: invited.userId, center_id: pre.data!.id, name: 'Dr. Invitado' });
    if (doc.error) return { ok: false, detail: `doctors insert: ${doc.error.message}` };
    return changedRows('limpiar pending_doctor_*', await invited.sb.from('centers')
      .update({ pending_doctor_email: null, pending_doctor_name: null, pending_doctor_specialty: null }).eq('id', pre.data!.id).select('id'));
  });

  return results;
}

/** "Días sin registrar" que debería mostrar el panel, calculado desde la referencia. */
function expectedDays(s: SimState, key: string, link: Record<string, unknown> | undefined): number | null {
  if (!link) return null;
  const cut = s.unlinkedAt.get(key);
  const entries = [...s.scenario.expected.get(key)!.values()].filter((e) => !cut || e.timestamp <= Date.parse(cut));
  const last = (pred: (e: SimEntry) => boolean) => entries.filter(pred).map((e) => e.date).sort().pop() ?? null;
  return patientDaysSinceLast({
    entryTypeMode: link.entry_type_mode as string, foodConfig: link.food_config,
    lastCoreDate: last((e) => e.entry_type !== 'food'), lastFoodDate: last((e) => e.entry_type === 'food'),
  });
}

function setDiff(want: Set<string>, got: Set<string>): Outcome {
  const missing = [...want].filter((x) => !got.has(x));
  const extra = [...got].filter((x) => !want.has(x));
  return { ok: !missing.length && !extra.length, detail: `${want.size} esperados · faltan ${missing.length} · sobran ${extra.length}` };
}

/** Compara filas de entries con la referencia, columna a columna. */
function compareEntries(rows: Record<string, unknown>[], expected: SimEntry[], toRow: (e: SimEntry) => Record<string, unknown>): Outcome {
  const ids = rows.map((r) => r.entry_id as string);
  const dupes = ids.length - new Set(ids).size;
  const base = setDiff(new Set(expected.map((e) => e.id)), new Set(ids));
  if (dupes) return { ok: false, detail: `${dupes} registros duplicados · ${base.detail}` };
  if (!base.ok) return base;
  const byId = new Map(rows.map((r) => [r.entry_id as string, r]));
  for (const e of expected) {
    const row = byId.get(e.id)!;
    for (const [col, want] of Object.entries(toRow(e))) {
      if (col === 'user_id') continue;
      const got = col === 'timestamp' ? Number(row[col]) : row[col];
      if (JSON.stringify(got ?? null) !== JSON.stringify(want ?? null)) {
        return { ok: false, detail: `${e.id}.${col}: guardado ${JSON.stringify(got)}, apuntado ${JSON.stringify(want)}` };
      }
    }
  }
  return { ok: true, detail: `${expected.length} registros` };
}
