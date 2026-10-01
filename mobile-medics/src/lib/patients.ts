// Portado de src/components/MedicsPanel.tsx (loadPatients + practice stats) —
// mantener sincronizado a mano.
import { supabase } from './supabase';
import { normalizeFoodConfig, patientDaysSinceLast } from './food';

export interface PatientLink {
  id: string;
  patient_id: string | null;
  invite_code?: string | null;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  patient_email?: string | null;
  display_name?: string | null;
  lastEntryDate?: string | null;
  daysSinceLast?: number | null;
  semaforo_override?: boolean;
  semaforo_green_override?: number | null;
  semaforo_red_override?: number | null;
  hasPushSub?: boolean | null;
  tags?: string[];
  doctor_unlinked?: boolean;
  unlinked_at?: string | null;
  hidden_fields?: string[];
  entry_type_mode?: string;
  /** Pauta de comidas (patient_links.food_config, ver lib/food.ts). */
  food_config?: unknown;
  push_min_hours?: number;
  push_disabled?: boolean;
  dob?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface PracticeStats {
  thisWeekEntries: number;
  lastWeekEntries: number;
  thisWeekBristol: number | null;
  lastWeekBristol: number | null;
}

export interface BristolAlert {
  patientId: string;
  curr: number;
  prev: number;
}

export async function loadPatients(doctorId: string): Promise<PatientLink[]> {
  const { data, error } = await supabase
    .from('patient_links')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('invited_at', { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all((data || []).map(async (p): Promise<PatientLink> => {
    let display_name: string | null = null;
    let patient_email = p.patient_email;
    let lastEntryDate: string | null = null;
    let daysSinceLast: number | null = null;

    if (p.patient_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, email')
        .eq('id', p.patient_id)
        .single();
      display_name = profile?.display_name || null;
      patient_email = p.patient_email || profile?.email || null;

      // Último registro por módulo (deposición/micción y comida): el semáforo
      // refleja el módulo esperado más retrasado (lib/food.ts).
      const lastDateOf = async (type: 'core' | 'food') => {
        let q = supabase
          .from('entries')
          .select('date')
          .eq('user_id', p.patient_id)
          .order('date', { ascending: false })
          .limit(1);
        q = type === 'food' ? q.eq('entry_type', 'food') : q.neq('entry_type', 'food');
        if (p.doctor_unlinked && p.unlinked_at) q = q.lte('created_at', p.unlinked_at);
        const { data } = await q.maybeSingle();
        return (data?.date as string | undefined) ?? null;
      };
      const [lastCore, lastFood] = await Promise.all([
        lastDateOf('core'),
        normalizeFoodConfig(p.food_config).enabled ? lastDateOf('food') : Promise.resolve(null),
      ]);
      lastEntryDate = [lastCore, lastFood].filter((d): d is string => !!d).sort().pop() ?? null;
      daysSinceLast = patientDaysSinceLast({
        entryTypeMode: p.entry_type_mode, foodConfig: p.food_config, lastCoreDate: lastCore, lastFoodDate: lastFood,
      });
    }

    let hasPushSub: boolean | null = null;
    if (p.patient_id) {
      const { data: pushSub, error: pushErr } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', p.patient_id)
        .maybeSingle();
      if (!pushErr) hasPushSub = !!pushSub;
    }

    return { ...p, display_name, patient_email, lastEntryDate, daysSinceLast, hasPushSub };
  }));
}

/** Practice-wide entry/Bristol stats (last 2 weeks) and per-patient worsening alerts. */
export async function loadPracticeStatsAndAlerts(
  acceptedPatientIds: string[],
): Promise<{ practiceStats: PracticeStats | null; bristolAlerts: BristolAlert[] }> {
  if (acceptedPatientIds.length === 0) return { practiceStats: null, bristolAlerts: [] };

  const d98 = new Date(); d98.setDate(d98.getDate() - 98);
  const d14 = new Date(); d14.setDate(d14.getDate() - 14);
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const s98 = d98.toISOString().split('T')[0];
  const s14 = d14.toISOString().split('T')[0];
  const s7 = d7.toISOString().split('T')[0];

  const { data } = await supabase
    .from('entries')
    .select('date, bristol, entry_type, user_id')
    .in('user_id', acceptedPatientIds)
    .gte('date', s98);
  if (!data) return { practiceStats: null, bristolAlerts: [] };

  const thisWeek = data.filter((e) => e.date >= s7);
  const lastWeek = data.filter((e) => e.date >= s14 && e.date < s7);
  const avgB = (es: typeof data) => {
    const bv = es.filter((e) => e.entry_type === 'poop' && e.bristol != null).map((e) => e.bristol as number);
    return bv.length ? bv.reduce((s, v) => s + v, 0) / bv.length : null;
  };
  const practiceStats: PracticeStats = {
    thisWeekEntries: thisWeek.length,
    lastWeekEntries: lastWeek.length,
    thisWeekBristol: avgB(thisWeek),
    lastWeekBristol: avgB(lastWeek),
  };

  const bristolAlerts: BristolAlert[] = [];
  for (const pid of acceptedPatientIds) {
    const pe = data.filter((e) => e.user_id === pid && e.entry_type === 'poop' && e.bristol != null);
    const cw = pe.filter((e) => e.date >= s7).map((e) => e.bristol as number);
    const lw = pe.filter((e) => e.date >= s14 && e.date < s7).map((e) => e.bristol as number);
    if (cw.length >= 2 && lw.length >= 2) {
      const ca = cw.reduce((s, v) => s + v, 0) / cw.length;
      const pa = lw.reduce((s, v) => s + v, 0) / lw.length;
      if (Math.abs(ca - 4) > Math.abs(pa - 4) + 0.5) bristolAlerts.push({ patientId: pid, curr: ca, prev: pa });
    }
  }
  return { practiceStats, bristolAlerts };
}

export function patientLabel(p: PatientLink): string {
  return p.display_name || p.patient_email || 'Paciente';
}

export function patientInitial(p: PatientLink): string {
  return (p.display_name || p.patient_email || '?')[0].toUpperCase();
}
