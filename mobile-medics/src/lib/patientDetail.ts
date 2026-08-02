// Portado de src/components/MedicsPanel.tsx (loadPatientDetail, bitácora,
// notas por entrada, config de paciente, perfil y push) — mantener
// sincronizado a mano.
import { supabase } from './supabase';
import type { PatientLink } from './patients';

export interface PatientEntry {
  id: string;
  date: string;
  time: string;
  notes: string;
  entry_type: 'poop' | 'urine';
  bristol: number | null;
  floats: 'floats' | 'sinks' | 'both' | null;
  color: string | null;
  quantity: number | null;
  duration: 'short' | 'medium' | 'long' | null;
  symptoms: string[];
  urine_type: 'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null;
  urine_quantity: number | null;
  urine_color: string | null;
  urine_characteristics: string[];
  urine_urgency: number | null;
  during_sleep: boolean | null;
  entry_id: string;
  created_at: string;
  doctor_note?: string;
}

export interface PatientDetail {
  entries: PatientEntry[];
  totalEntries: number;
  bristolAvg: number | null;
  lastEntryDate: string | null;
  daysSinceLast: number | null;
}

export interface ClinicalNote {
  id: string;
  note: string;
  created_at: string;
}

export async function loadPatientDetail(patient: PatientLink, doctorId: string): Promise<PatientDetail> {
  if (!patient.patient_id) return { entries: [], totalEntries: 0, bristolAvg: null, lastEntryDate: null, daysSinceLast: null };

  let entriesQuery = supabase
    .from('entries')
    .select('*')
    .eq('user_id', patient.patient_id)
    .order('date', { ascending: false })
    .order('time', { ascending: false });
  if (patient.doctor_unlinked && patient.unlinked_at) {
    entriesQuery = entriesQuery.lte('created_at', patient.unlinked_at);
  }
  const { data: entries } = await entriesQuery;

  const entryList: PatientEntry[] = (entries || []).map((e) => ({
    id: e.id,
    date: e.date,
    time: e.time || '',
    notes: e.notes || '',
    entry_type: e.entry_type ?? 'poop',
    bristol: e.bristol ?? null,
    floats: e.floats === true ? 'floats' : e.floats === false ? 'sinks' : (e.floats ?? null),
    color: e.color ?? null,
    quantity: e.quantity ?? null,
    duration: e.duration ?? null,
    symptoms: e.symptoms ?? [],
    urine_type: e.urine_type ?? null,
    urine_quantity: e.urine_quantity ?? null,
    urine_color: e.urine_color ?? null,
    urine_characteristics: e.urine_characteristics ?? [],
    urine_urgency: e.urine_urgency ?? null,
    during_sleep: e.during_sleep ?? null,
    entry_id: e.entry_id || '',
    created_at: e.created_at,
  }));

  const entryIds = entryList.map((e) => e.entry_id).filter(Boolean);
  const notesMap = new Map<string, string>();
  if (entryIds.length > 0) {
    const { data: dnotes } = await supabase
      .from('entry_doctor_notes')
      .select('entry_id, note')
      .eq('doctor_id', doctorId)
      .in('entry_id', entryIds);
    (dnotes || []).forEach((n) => notesMap.set(n.entry_id, n.note));
  }
  const entryListWithNotes = entryList.map((e) => ({ ...e, doctor_note: notesMap.get(e.entry_id) || '' }));

  const bristolValues = entryListWithNotes.filter((e) => e.bristol != null).map((e) => e.bristol as number);
  const bristolAvg = bristolValues.length > 0 ? bristolValues.reduce((a, b) => a + b, 0) / bristolValues.length : null;
  const lastEntryDate = entryListWithNotes.length > 0 ? entryListWithNotes[0].date : null;
  const daysSinceLast = lastEntryDate ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return { entries: entryListWithNotes, totalEntries: entryList.length, bristolAvg, lastEntryDate, daysSinceLast };
}

export async function loadClinicalNotes(linkId: string): Promise<ClinicalNote[]> {
  const { data, error } = await supabase
    .from('patient_clinical_notes')
    .select('id, note, created_at')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });
  return error ? [] : (data ?? []);
}

export async function addClinicalNote(linkId: string, note: string): Promise<ClinicalNote | null> {
  const { data, error } = await supabase
    .from('patient_clinical_notes')
    .insert({ link_id: linkId, note: note.trim() })
    .select('id, note, created_at')
    .single();
  return error ? null : data;
}

export async function saveEntryNote(doctorId: string, entryId: string, note: string): Promise<void> {
  if (note.trim()) {
    await supabase.from('entry_doctor_notes').upsert(
      { doctor_id: doctorId, entry_id: entryId, note: note.trim() },
      { onConflict: 'doctor_id,entry_id' },
    );
  } else {
    await supabase.from('entry_doctor_notes').delete().eq('doctor_id', doctorId).eq('entry_id', entryId);
  }
}

export interface PatientConfigInput {
  semaforoOverride: boolean;
  semaforoGreen: number;
  semaforoRed: number;
  hiddenFields: string[];
  entryTypeMode: string;
  tags: string[];
}

export async function savePatientConfig(linkId: string, input: PatientConfigInput): Promise<{ error: string | null }> {
  const { error } = await supabase.from('patient_links').update({
    semaforo_override: input.semaforoOverride,
    semaforo_green_override: input.semaforoOverride ? input.semaforoGreen : null,
    semaforo_red_override: input.semaforoOverride ? input.semaforoRed : null,
    hidden_fields: input.hiddenFields,
    entry_type_mode: input.entryTypeMode,
    tags: input.tags,
  }).eq('id', linkId);
  return { error: error?.message ?? null };
}

export async function savePatientTags(linkId: string, tags: string[]): Promise<{ error: string | null }> {
  const { error } = await supabase.from('patient_links').update({ tags }).eq('id', linkId);
  return { error: error?.message ?? null };
}

export async function savePushSettings(
  linkId: string,
  input: { pushMinHours: number; pushDisabled: boolean },
): Promise<{ error: string | null }> {
  const mins = Math.max(24, Math.min(720, input.pushMinHours));
  const { error } = await supabase.from('patient_links').update({
    push_min_hours: mins, push_frequency: 1, push_disabled: input.pushDisabled,
  }).eq('id', linkId);
  return { error: error?.message ?? null };
}

export async function saveProfile(
  linkId: string,
  input: { dob: string; heightCm: string; weightKg: string },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('patient_links').update({
    dob: input.dob || null,
    height_cm: input.heightCm ? parseInt(input.heightCm, 10) : null,
    weight_kg: input.weightKg ? parseFloat(input.weightKg) : null,
  }).eq('id', linkId);
  return { error: error?.message ?? null };
}

export async function sendTestPush(patientId: string): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: {
      patient_id: patientId,
      title: 'Fluxia — Mensaje de prueba',
      body: 'Tu médico ha enviado una notificación de prueba.',
    },
  });
  if (error || !data?.success) return { success: false, error: data?.error || error?.message || 'Error desconocido' };
  return { success: true, error: null };
}
