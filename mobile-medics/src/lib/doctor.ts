// Portado de src/components/MedicsPanel.tsx (flujo de alta de médico) —
// mantener sincronizado a mano.
import { supabase } from './supabase';

export interface DoctorInfo {
  id: string;
  name: string;
  specialty: string | null;
  center_id: string;
  center_name: string;
  center_image_url: string | null;
  semaforo_green: number;
  semaforo_red: number;
  palette: string;
  plan: 'free' | 'beta' | 'test' | 'pro';
  test_plan_started_at: string | null;
  global_tags: string[];
}

interface RawDoctorRow {
  id: string;
  name: string;
  specialty: string | null;
  center_id: string;
  centers: { name: string; image_url: string | null } | null;
  semaforo_green: number | null;
  semaforo_red: number | null;
  palette: string | null;
  plan: string | null;
  test_plan_started_at: string | null;
  global_tags: string[] | null;
}

function buildDoctorInfo(d: RawDoctorRow): DoctorInfo {
  return {
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    center_id: d.center_id,
    center_name: d.centers?.name || 'Centro médico',
    center_image_url: d.centers?.image_url || null,
    semaforo_green: d.semaforo_green ?? 1,
    semaforo_red: d.semaforo_red ?? 3,
    palette: d.palette || 'terracotta',
    plan: (d.plan as DoctorInfo['plan']) || 'free',
    test_plan_started_at: d.test_plan_started_at || null,
    global_tags: d.global_tags || [],
  };
}

export type DoctorBootstrapResult =
  | { status: 'ready'; doctor: DoctorInfo }
  /** Valid account, profile still being provisioned — do not sign out, let the caller retry. */
  | { status: 'activating'; message: string }
  /** No doctor profile and not eligible for self-service — caller should sign the user out. */
  | { status: 'no_profile'; message: string }
  | { status: 'google_profile_needed'; suggestedName: string };

interface BootstrapUser {
  id: string;
  email?: string | null;
  app_metadata?: { provider?: string } | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Resolves a logged-in Supabase user into a doctor profile, mirroring the
 * three-step bootstrap in MedicsPanel.tsx: existing record → pending admin
 * invite → self-service registration (email/password with is_doctor metadata).
 * Google OAuth first-timers are handed back to the caller for profile
 * completion via completeGoogleDoctorProfile.
 */
export async function bootstrapDoctor(user: BootstrapUser): Promise<DoctorBootstrapResult> {
  const isGoogle = (user.app_metadata?.provider || '') === 'google';
  const userMeta = user.user_metadata || {};

  // 1. Existing doctor record — 8s timeout so a hung query doesn't block forever.
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')), 8000),
  );
  let doctorData = (
    await Promise.race([
      supabase.from('doctors').select('*, centers(name, image_url)').eq('id', user.id).maybeSingle(),
      timeoutPromise,
    ])
  ).data as RawDoctorRow | null;

  // 2. Pending admin invitation (email/password only)
  if (!doctorData && !isGoogle && user.email) {
    const userEmail = user.email.toLowerCase();
    const { data: pendingCenter } = await supabase
      .from('centers').select('*')
      .eq('pending_doctor_email', userEmail).limit(1).single();
    if (pendingCenter) {
      const { error: insertErr } = await supabase.from('doctors').insert({
        id: user.id, center_id: pendingCenter.id,
        name: pendingCenter.pending_doctor_name || userEmail.split('@')[0],
        specialty: pendingCenter.pending_doctor_specialty || null,
      });
      if (!insertErr) {
        await supabase.from('centers').update({
          pending_doctor_email: null, pending_doctor_name: null, pending_doctor_specialty: null,
        }).eq('id', pendingCenter.id);
        const { data: d } = await supabase.from('doctors')
          .select('*, centers(name, image_url)').eq('id', user.id).single();
        doctorData = d as RawDoctorRow | null;
      }
    }
  }

  // 3. Self-service first login (email/password with is_doctor metadata)
  if (!doctorData && !isGoogle && userMeta.is_doctor) {
    const userEmail = user.email?.toLowerCase() || '';
    const name = (userMeta.name as string)?.trim() || userEmail.split('@')[0];
    const centerName = (userMeta.center_name as string)?.trim() || `Consulta de ${name}`;
    const { error: regErr } = await supabase.rpc('doctor_self_register', {
      p_name: name,
      p_center_name: centerName,
      p_specialty: (userMeta.specialty as string)?.trim() || null,
    });
    if (regErr) {
      return { status: 'no_profile', message: `Error al activar tu cuenta: ${regErr.message}` };
    }
    const { data: d, error: selectErr } = await supabase.from('doctors')
      .select('*, centers(name, image_url)').eq('id', user.id).single();
    if (selectErr) {
      return { status: 'activating', message: 'Tu cuenta ha sido activada. Vuelve a intentarlo en unos segundos.' };
    }
    doctorData = d as RawDoctorRow;
  }

  // 4. Still no doctor record
  if (!doctorData) {
    if (isGoogle) {
      const suggestedName = ((userMeta.full_name || userMeta.name || '') as string).trim();
      return { status: 'google_profile_needed', suggestedName };
    }
    if (userMeta.is_doctor) {
      return { status: 'activating', message: 'Tu cuenta está siendo activada. Inicia sesión de nuevo en unos segundos.' };
    }
    // Cuenta válida pero sin perfil médico y sin vía de auto-alta — igual que
    // en MedicsPanel.tsx (web), cerramos sesión para no dejar al usuario
    // atrapado en esta pantalla sin ninguna salida.
    await supabase.auth.signOut();
    return {
      status: 'no_profile',
      message: 'No encontramos un perfil médico para esta cuenta. Pide al administrador que te dé de alta desde /admin.',
    };
  }

  return { status: 'ready', doctor: buildDoctorInfo(doctorData) };
}

/** Creates the center+doctor rows for a first-time Google OAuth sign-in. */
export async function completeGoogleDoctorProfile(
  userId: string,
  name: string,
  centerName: string,
  specialty: string | null,
): Promise<{ doctor: DoctorInfo | null; error: string | null }> {
  const { data: newCenter, error: centerErr } = await supabase
    .from('centers')
    .insert({ name: centerName.trim() })
    .select('id')
    .single();
  if (centerErr || !newCenter) return { doctor: null, error: centerErr?.message || 'Error al crear el centro' };

  const { error: docErr } = await supabase.from('doctors').insert({
    id: userId,
    center_id: newCenter.id,
    name: name.trim(),
    specialty: specialty?.trim() || null,
    // El plan lo fija el trigger `doctors_set_trial_on_insert`: todo registro
    // nuevo entra en el trial de 31 días ('test').
  });
  if (docErr) return { doctor: null, error: docErr.message };

  const { data: doctorData, error: selectErr } = await supabase
    .from('doctors')
    .select('*, centers(name, image_url)')
    .eq('id', userId)
    .single();
  if (selectErr || !doctorData) return { doctor: null, error: selectErr?.message || 'Error al cargar tu perfil' };

  return { doctor: buildDoctorInfo(doctorData as RawDoctorRow), error: null };
}
