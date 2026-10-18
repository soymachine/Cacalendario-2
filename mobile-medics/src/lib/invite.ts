// Portado de src/components/MedicsPanel.tsx (handleInvite) — mantener sincronizado a mano.
import { supabase } from './supabase';
import type { DoctorInfo } from './doctor';
import type { PatientLink } from './patients';
import type { FoodTrackingConfig } from './food';

export const BETA_PLAN_PATIENT_LIMIT = 100;

// Solo Beta tiene límite de pacientes: el trial de 30 días y Pro son ilimitados,
// y 'free' (Pro cancelado) tiene el panel bloqueado entero (isAccessBlocked).
export function planLimitFor(plan: DoctorInfo['plan']): number | null {
  if (plan === 'beta') return BETA_PLAN_PATIENT_LIMIT;
  return null;
}

export type InviteResult =
  | { success: true; emailSent: boolean; emailError: string | null }
  | { success: false; error: string; limitReached?: boolean };

/** Pauta elegida en el modal de invitación: se guarda en el vínculo pendiente y se aplica al aceptar. */
export interface InviteSettings {
  email: string;
  entryTypeMode: string;
  hiddenFields: string[];
  foodConfig: FoodTrackingConfig;
}

export async function invitePatient(
  { email, entryTypeMode, hiddenFields, foodConfig }: InviteSettings,
  doctor: DoctorInfo,
  currentPatients: PatientLink[],
): Promise<InviteResult> {
  // Archivados fuera: no cuentan para el límite
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

  if (data?.link_id) {
    const { error: cfgError } = await supabase
      .from('patient_links')
      .update({ entry_type_mode: entryTypeMode, hidden_fields: hiddenFields, food_config: foodConfig })
      .eq('id', data.link_id);
    if (cfgError) console.error('[invite] config error:', cfgError);
  }

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
