// Portado de src/components/MedicsPanel.tsx (handleInvite) — mantener sincronizado a mano.
import { supabase } from './supabase';
import type { DoctorInfo } from './doctor';
import type { PatientLink } from './patients';

export const FREE_PLAN_PATIENT_LIMIT = 1;
export const BETA_PLAN_PATIENT_LIMIT = 100;

export function planLimitFor(plan: DoctorInfo['plan']): number | null {
  if (plan === 'free') return FREE_PLAN_PATIENT_LIMIT;
  if (plan === 'beta') return BETA_PLAN_PATIENT_LIMIT;
  return null;
}

export type InviteResult =
  | { success: true; emailSent: boolean; emailError: string | null }
  | { success: false; error: string; limitReached?: boolean };

export async function invitePatient(
  email: string,
  doctor: DoctorInfo,
  currentPatients: PatientLink[],
): Promise<InviteResult> {
  const activePatientsCount = currentPatients.filter((p) => !p.doctor_unlinked).length;
  const limit = planLimitFor(doctor.plan);
  if (limit !== null && activePatientsCount >= limit) {
    return { success: false, error: 'Has alcanzado el límite de pacientes de tu plan.', limitReached: true };
  }

  const { data, error: rpcError } = await supabase.rpc('doctor_invite_patient', {
    p_patient_email: email.trim(),
  });
  if (rpcError) return { success: false, error: rpcError.message };
  if (data?.error) return { success: false, error: data.error };

  let emailSent = false;
  let emailError: string | null = null;
  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke('send-invite-email', {
      body: { patientEmail: email.trim(), doctorName: doctor.name, centerName: doctor.center_name },
    });
    if (fnError) emailError = `No se pudo enviar el email: ${fnError.message}`;
    else if (fnData?.error) emailError = `No se pudo enviar el email: ${fnData.error}`;
    else emailSent = true;
  } catch (e) {
    emailError = `No se pudo enviar el email: ${e instanceof Error ? e.message : 'Error desconocido'}`;
  }

  return { success: true, emailSent, emailError };
}
