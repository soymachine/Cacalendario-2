// Formato del informe del simulador funcional (tests/sim, `npm run sim`).
// Lo escribe tests/sim/report.ts, se guarda en public.sim_runs
// (supabase/migrations/20261101_sim_runs.sql) y lo pinta la sección
// "Simulaciones" de /admin (src/components/admin/SimulationsSection.tsx).
//
// Si cambias la forma, sube SIM_REPORT_VERSION y haz que /admin siga leyendo
// los informes antiguos (se guardan tal cual).

export const SIM_REPORT_VERSION = 1;

export type SimRunStatus = 'pass' | 'fail' | 'error';
export type SimCheckStatus = 'pass' | 'fail' | 'warn' | 'known' | 'fixed';
export type SemaforoKey = 'green' | 'orange' | 'red' | 'gray';

export interface SimCheck {
  area: string;
  name: string;
  status: SimCheckStatus;
  detail?: string;
  ms?: number;
}

export interface SimError {
  /** Día virtual (0..days-1) en que ocurrió; null si fue en el alta o al final. */
  day: number | null;
  what: string;
  message: string;
}

/** Un día del mes virtual (todas las acciones de todos los pacientes). */
export interface SimDay {
  day: number;
  date: string;
  saves: number;
  edits: number;
  deletes: number;
  resends: number;
  photos: number;
  poop: number;
  urine: number;
  food: number;
  errors: number;
}

/** Lo que hizo un paciente un día (registros que quedaron guardados ese día). */
export interface SimPersonaDay {
  poop: number;
  urine: number;
  food: number;
  /** Bristol medio de las deposiciones del día (null si no hubo). */
  bristol: number | null;
}

export interface SimPersona {
  key: string;
  name: string;
  role: string;
  invite: { respond: 'accept' | 'reject'; day: number };
  entryTypeMode: string;
  foodTracking: boolean;
  archiveDay: number | null;
  lastActiveDay: number | null;
  totals: { poop: number; urine: number; food: number; photos: number; edits: number; deletes: number; resends: number; entries: number };
  activeDays: number;
  /** Uno por día del mes virtual. */
  daily: SimPersonaDay[];
  /** Cómo lo ve el médico al terminar el mes (antes de las comprobaciones). */
  doctorView: {
    status: string;
    archived: boolean;
    daysSinceLast: number | null;
    semaforo: SemaforoKey | null;
    visibleEntries: number | null;
  };
  /** Aparece en get_patients_needing_push (aviso de inactividad). */
  inactivityPush: boolean;
}

export interface SimReport {
  version: number;
  runId: string;
  status: SimRunStatus;
  /** Si la simulación no pudo completarse. */
  fatal?: string;
  startedAt: string;
  finishedAt: string;
  durationS: number;
  phases: { setupS: number; simulateS: number; checksS: number };
  seed: number;
  simStart: string;
  simEnd: string;
  days: number;
  source: 'local' | 'ci';
  git: { sha: string | null; ref: string | null };
  env: { node: string; tz: string; supabaseUrl: string };
  doctor: { plan: string | null; trialDaysLeft: number | null; semaforoGreen: number | null; semaforoRed: number | null } | null;
  summary: {
    checks: Record<SimCheckStatus, number> & { total: number };
    errors: number;
    entries: number;
    actions: number;
    personas: number;
    /** Nombres de las comprobaciones que fallaron (para el listado). */
    failed: string[];
  };
  personas: SimPersona[];
  daily: SimDay[];
  checks: SimCheck[];
  errors: SimError[];
}

/** Fila del listado de /admin (admin_list_sim_runs). */
export interface SimRunRow {
  id: string;
  run_id: string;
  created_at: string;
  status: SimRunStatus;
  source: string;
  seed: number | null;
  sim_start: string | null;
  sim_end: string | null;
  duration_s: number | null;
  git_sha: string | null;
  git_ref: string | null;
  summary: Partial<SimReport['summary']>;
}
