// Informe de una ejecución del simulador: se imprime, se guarda en
// tests/sim/out/report.json y, si hay destino configurado, se sube a
// public.sim_runs para verlo en /admin → Simulaciones.
//
// Destino (opcional): SIM_REPORT_URL, SIM_REPORT_KEY (clave pública del
// proyecto) y SIM_REPORT_TOKEN (ver supabase/migrations/20261101_sim_runs.sql).

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { addDays } from '../../src/lib/food.ts';
import { getSemaforoKey, resolveSemaforoThresholds } from '../../src/lib/semaforo.ts';
import { testPlanDaysLeft } from '../../src/lib/plan.ts';
import {
  SIM_REPORT_VERSION, type SimCheck, type SimCheckStatus, type SimDay, type SimPersona, type SimReport, type SimRunStatus,
} from '../../src/lib/simReport.ts';
import type { DoctorPatientView } from './agents.ts';
import type { SimState } from './checks.ts';
import { SIM_DAYS } from './scenario.ts';

/** Cómo ve el médico a sus pacientes al acabar el mes, antes de las comprobaciones. */
export interface DoctorSnapshot {
  views: DoctorPatientView[];
  visibleEntries: Map<string, number>;
  inactivityPush: Set<string>;
  profile: Record<string, unknown>;
}

export interface Timings {
  started: number;
  setupDone?: number;
  simulateDone?: number;
  checksDone?: number;
}

export async function takeSnapshot(s: SimState): Promise<DoctorSnapshot> {
  const views = await s.doctor.loadPatients();
  const visibleEntries = new Map<string, number>();
  for (const p of s.personas) {
    const v = views.find((x) => x.linkId === s.linkIds.get(p.key));
    if (v?.patientId) visibleEntries.set(p.key, (await s.doctor.patientEntries(v.patientId, (v.link.unlinked_at as string | null) ?? null)).length);
  }
  const needing = await s.admin.rpc<{ patient_id: string }[]>('get_patients_needing_push');
  const ids = new Set(needing.map((r) => r.patient_id));
  const inactivityPush = new Set(s.personas.filter((p) => ids.has(s.patients.get(p.key)!.userId)).map((p) => p.key));
  return { views, visibleEntries, inactivityPush, profile: await s.doctor.profile() };
}

export function buildReport(input: {
  state: SimState;
  runId: string;
  seed: number;
  timings: Timings;
  checks: SimCheck[];
  snapshot: DoctorSnapshot | null;
  fatal?: string;
}): SimReport {
  const { state: s, timings: t, checks, snapshot } = input;
  const finished = Date.now();
  const secs = (a?: number, b?: number) => (a && b ? Math.round((b - a) / 100) / 10 : 0);
  const dateOf = (d: number) => addDays(s.scenario.startDate, d);
  const dayOfDate = (date: string) => Math.round((Date.parse(date) - Date.parse(s.scenario.startDate)) / 86400000);

  const daily: SimDay[] = s.scenario.days.map((actions, day) => {
    const d: SimDay = { day, date: dateOf(day), saves: 0, edits: 0, deletes: 0, resends: 0, photos: 0, poop: 0, urine: 0, food: 0, errors: 0 };
    for (const a of actions) {
      if (a.kind === 'save') {
        d.saves++;
        d[a.entry.entry_type]++;
        if (a.entry.withPhoto) d.photos++;
      } else if (a.kind === 'edit') d.edits++;
      else if (a.kind === 'delete') d.deletes++;
      else d.resends++;
    }
    d.errors = s.errors.filter((e) => e.day === day).length;
    return d;
  });

  const personas: SimPersona[] = s.personas.map((p) => {
    const entries = [...s.scenario.expected.get(p.key)!.values()];
    const actions = s.scenario.days.flat().filter((a) => a.persona === p.key);
    const perDay = Array.from({ length: SIM_DAYS }, () => ({ poop: 0, urine: 0, food: 0, bristolSum: 0 }));
    for (const e of entries) {
      const d = perDay[dayOfDate(e.date)];
      if (!d) continue;
      d[e.entry_type]++;
      if (e.entry_type === 'poop' && e.bristol) d.bristolSum += e.bristol;
    }
    const v = snapshot?.views.find((x) => x.linkId === s.linkIds.get(p.key));
    let semaforo: SimPersona['doctorView']['semaforo'] = null;
    if (v && snapshot && v.status === 'accepted') {
      const th = resolveSemaforoThresholds(Number(snapshot.profile.semaforo_green), Number(snapshot.profile.semaforo_red), {
        enabled: !!v.link.semaforo_override,
        green: v.link.semaforo_green_override as number | null,
        red: v.link.semaforo_red_override as number | null,
      });
      semaforo = getSemaforoKey(v.daysSinceLast, th.green, th.red);
    }
    return {
      key: p.key,
      name: p.name,
      role: p.role,
      invite: p.invite,
      entryTypeMode: p.doctorConfig?.entryTypeMode ?? 'both',
      foodTracking: !!p.doctorConfig?.food,
      archiveDay: p.archiveDay ?? null,
      lastActiveDay: p.lastActiveDay ?? null,
      totals: {
        poop: entries.filter((e) => e.entry_type === 'poop').length,
        urine: entries.filter((e) => e.entry_type === 'urine').length,
        food: entries.filter((e) => e.entry_type === 'food').length,
        photos: s.photoPaths.get(p.key)?.size ?? 0,
        edits: actions.filter((a) => a.kind === 'edit').length,
        deletes: actions.filter((a) => a.kind === 'delete').length,
        resends: actions.filter((a) => a.kind === 'resend').length,
        entries: entries.length,
      },
      activeDays: perDay.filter((d) => d.poop + d.urine + d.food > 0).length,
      daily: perDay.map((d) => ({ poop: d.poop, urine: d.urine, food: d.food, bristol: d.poop ? Math.round((d.bristolSum / d.poop) * 10) / 10 : null })),
      doctorView: {
        status: v?.status ?? 'unknown',
        archived: v?.archived ?? false,
        daysSinceLast: v?.daysSinceLast ?? null,
        semaforo,
        visibleEntries: snapshot?.visibleEntries.get(p.key) ?? null,
      },
      inactivityPush: snapshot?.inactivityPush.has(p.key) ?? false,
    };
  });

  const count = (st: SimCheckStatus) => checks.filter((c) => c.status === st).length;
  const status: SimRunStatus = input.fatal ? 'error' : count('fail') || s.errors.length ? 'fail' : 'pass';
  const git = gitInfo();

  return {
    version: SIM_REPORT_VERSION,
    runId: input.runId,
    status,
    ...(input.fatal ? { fatal: input.fatal } : {}),
    startedAt: new Date(t.started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationS: secs(t.started, finished),
    phases: {
      setupS: secs(t.started, t.setupDone),
      simulateS: secs(t.setupDone, t.simulateDone),
      checksS: secs(t.simulateDone, t.checksDone),
    },
    seed: input.seed,
    simStart: s.scenario.startDate,
    simEnd: dateOf(SIM_DAYS - 1),
    days: SIM_DAYS,
    source: process.env.GITHUB_ACTIONS ? 'ci' : 'local',
    git,
    env: {
      node: process.version,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      supabaseUrl: s.env.url.replace(/\/\/[^/]*@/, '//'),
    },
    doctor: snapshot ? {
      plan: (snapshot.profile.plan as string) ?? null,
      trialDaysLeft: testPlanDaysLeft(snapshot.profile.test_plan_started_at as string | null),
      semaforoGreen: Number(snapshot.profile.semaforo_green),
      semaforoRed: Number(snapshot.profile.semaforo_red),
    } : null,
    summary: {
      checks: { pass: count('pass'), fail: count('fail'), warn: count('warn'), known: count('known'), fixed: count('fixed'), total: checks.length },
      errors: s.errors.length,
      entries: personas.reduce((n, p) => n + p.totals.entries, 0),
      actions: s.scenario.days.reduce((n, d) => n + d.length, 0),
      personas: personas.length,
      failed: checks.filter((c) => c.status === 'fail').map((c) => c.name).slice(0, 10),
    },
    personas,
    daily,
    checks,
    errors: s.errors,
  };
}

function gitInfo(): SimReport['git'] {
  const run = (cmd: string) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null; } catch { return null; } };
  return {
    sha: process.env.GITHUB_SHA ?? run('git rev-parse HEAD'),
    ref: process.env.GITHUB_REF_NAME ?? run('git rev-parse --abbrev-ref HEAD'),
  };
}

export function printReport(r: SimReport): void {
  const icon: Record<SimCheckStatus, string> = { pass: '✔', fail: '✘', warn: '⚠', known: '⚠', fixed: '★' };
  let area = '';
  for (const c of r.checks) {
    if (c.area !== area) { area = c.area; console.log(`\n  ${area}`); }
    console.log(`    ${icon[c.status]} ${c.name}${c.detail && c.status !== 'pass' ? ` — ${c.detail}` : ''}`);
  }
  if (r.errors.length) {
    console.log(`\n  Errores durante la simulación (${r.errors.length})`);
    for (const err of r.errors.slice(0, 30)) console.log(`    ✘ ${err.day !== null ? `día ${err.day} · ` : ''}${err.what}: ${err.message}`);
  }
  if (r.fatal) console.log(`\n  ✘ La simulación no pudo completarse: ${r.fatal}`);
  const c = r.summary.checks;
  console.log(`\n${r.status === 'pass' ? '✔ OK' : '✘ FALLA'} · ${c.pass} ok · ${c.fail} fallos · ${c.warn + c.known} avisos`
    + ` · ${c.fixed} ya corregidos · ${r.summary.errors} errores · ${r.summary.entries} registros · ${r.durationS}s\n`);
}

export function saveReport(r: SimReport): void {
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  writeFileSync(new URL('./out/report.json', import.meta.url), JSON.stringify(r, null, 2));
}

/** Sube el informe a public.sim_runs si hay destino configurado. Nunca rompe la ejecución. */
export async function uploadReport(r: SimReport): Promise<void> {
  const url = process.env.SIM_REPORT_URL;
  const key = process.env.SIM_REPORT_KEY;
  const token = process.env.SIM_REPORT_TOKEN;
  if (!url || !key || !token) {
    console.log('Informe en tests/sim/out/report.json (sin SIM_REPORT_URL/KEY/TOKEN: no se sube a /admin)\n');
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.rpc('sim_ingest_report', { p_token: token, p_report: r });
  if (error) console.error(`No se pudo subir el informe a ${new URL(url).host}: ${error.message}\n`);
  else console.log(`Informe subido a ${new URL(url).host} (/admin → Simulaciones)\n`);
}
