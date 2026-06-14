import { useState, useEffect } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { supabaseMedics as supabase } from '../lib/supabase';
import { APP_VERSION } from '../lib/version';
import Switch from 'rc-switch';
import 'rc-switch/assets/index.css';
import { PALETTES } from '../lib/palettes';
import type { MedicsTheme } from '../lib/palettes';
import { initSentry } from '../lib/sentry';

// Initialize Sentry once at module load (no-op in dev)
initSentry();

const FLOATS_LABEL: Record<string, string> = { floats: '🫧 Flota', sinks: '⬇️ Hunde', both: '🫧⬇️ Ambos' };
const DURATION_LABEL: Record<string, string> = { short: '< 3 min', medium: '3–5 min', long: '> 5 min' };
const SYMPTOM_LABEL: Record<string, string> = {
  abdominal_pain: 'Dolor abdominal', bloating: 'Hinchazón', heartburn: 'Ardor', cramp: 'Calambre',
  rectal_pain: 'Dolor rectal', blood: 'Sangre', mucus: 'Moco', smelly: 'Maloliente',
  sticky: 'Pegajoso', stringy: 'Filamentoso', undigested: 'No digerido',
};
const URINE_TYPE_LABEL: Record<string, string> = {
  voluntary: 'Voluntaria', involuntary_escape: 'Escape', involuntary_drip: 'Goteo',
};
const URINE_CHAR_LABEL: Record<string, string> = {
  blood: 'Sangre', odor: 'Olor', pain: 'Dolor',
};
const BRISTOL_LABEL: Record<number, string> = {
  1: 'Separados duros', 2: 'Grumoso duro', 3: 'Fisurado',
  4: 'Suave (ideal)', 5: 'Blandos', 6: 'Pastoso', 7: 'Líquido',
};

interface PatientLink {
  id: string;
  patient_id: string | null;
  invite_code?: string | null;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  patient_email?: string;
  display_name?: string | null;
  lastEntryDate?: string | null;
  daysSinceLast?: number | null;
  semaforo_override?: boolean;
  semaforo_green_override?: number | null;
  semaforo_red_override?: number | null;
  hidden_fields?: string[];
  entry_type_mode?: string;
  push_min_hours?: number;
  push_frequency?: number;
  hasPushSub?: boolean | null;
  doctor_notes?: string;
  tags?: string[];
}

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string | null;
  center_id: string;
  center_name?: string;
  center_image_url?: string | null;
  semaforo_green: number;
  semaforo_red: number;
  palette?: string;
  plan: 'free' | 'beta' | 'pro';
  global_tags: string[];
}

// Free tier limit: 1 patient (accepted + pending). Beta: 100. Pro is effectively unlimited.
const FREE_PLAN_PATIENT_LIMIT = 1;
const BETA_PLAN_PATIENT_LIMIT = 100;

interface PatientEntry {
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
  urine_urgency?: number | null;
  during_sleep?: boolean | null;
  entry_id: string;
  created_at: string;
  doctor_note?: string;
}

interface PatientDetail {
  entries: PatientEntry[];
  totalEntries: number;
  bristolAvg: number | null;
  lastEntryDate: string | null;
  daysSinceLast: number | null;
}

type Section = 'inicio' | 'pacientes' | 'invitar' | 'config';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'inicio', icon: '\u{1F3E0}', label: 'Inicio' },
  { id: 'pacientes', icon: '\u{1F465}', label: 'Pacientes' },
  { id: 'invitar', icon: '\u{2795}', label: 'Invitar Paciente' },
  { id: 'config', icon: '\u2699\uFE0F', label: 'Configuración' },
];

const TAG_COLORS: Record<string, string> = {};
const TAG_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16'];
const tagColor = (tag: string) => {
  if (!TAG_COLORS[tag]) {
    let h = 0; for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_PALETTE.length;
    TAG_COLORS[tag] = TAG_PALETTE[h];
  }
  return TAG_COLORS[tag];
};

const ONBOARDING_STEPS = [
  {
    icon: '👋',
    color: '#fff7f0',
    accent: '#dd8273',
    title: '¡Bienvenido a Fluxia!',
    body: 'Este es tu portal médico. Desde aquí gestionarás a tus pacientes y harás un seguimiento en tiempo real de su salud digestiva.',
  },
  {
    icon: '👥',
    color: '#f0f7ff',
    accent: '#3b82f6',
    title: 'Tus pacientes',
    body: 'En la sección «Pacientes» verás todos los pacientes vinculados. El semáforo de cada uno indica cuántos días llevan sin registrar: 🟢 al día · 🟡 varios días · 🔴 inactivo.',
  },
  {
    icon: '✉️',
    color: '#f0fff4',
    accent: '#22c55e',
    title: 'Invita a un paciente',
    body: 'Ve a «Invitar Paciente» e introduce el email de tu paciente. Una vez que se registre en Fluxia, verá un botón para aceptar tu invitación en su apartado de configuración y quedará vinculado a tu cuenta automáticamente.',
  },
  {
    icon: '📊',
    color: '#fdf4ff',
    accent: '#a855f7',
    title: 'Revisa los registros',
    body: 'Pulsa sobre cualquier paciente para ver sus registros detallados: tipo, consistencia, color, síntomas y más. Todo ordenado cronológicamente para facilitar el seguimiento.',
  },
  {
    icon: '⚙️',
    color: '#fffbeb',
    accent: '#f59e0b',
    title: 'Personaliza tu portal',
    body: 'Desde «Configuración» actualiza tu nombre, el nombre de tu consulta, los umbrales del semáforo y el color del panel. ¡Hazlo tuyo!',
  },
];

function SemaforoSlider({ value, min, max, color, onChange }: {
  value: number; min: number; max: number; color: string;
  onChange: (v: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const colorClass = color === '#e74c3c' ? 'semaforo-range-red' : 'semaforo-range-green';
  return (
    <input
      type="range"
      className={`semaforo-range ${colorClass}`}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e0e0e0 ${pct}%, #e0e0e0 100%)`,
      }}
    />
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'Credenciales incorrectas. Revisa tu email y contraseña.';
  if (m.includes('email not confirmed')) return 'Email no confirmado. Revisa tu bandeja de entrada.';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Este email ya está registrado.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('unable to validate email') || m.includes('invalid format')) return 'El formato del email no es válido.';
  if (m.includes('email rate limit') || m.includes('too many requests')) return 'Demasiados intentos. Espera unos minutos.';
  if (m.includes('once every 60 seconds') || m.includes('security purposes')) return 'Por seguridad, solo puedes solicitarlo una vez cada 60 segundos.';
  if (m.includes('signup is disabled') || m.includes('signup_disabled')) return 'El registro está desactivado.';
  if (m.includes('network') || m.includes('fetch')) return 'Error de conexión. Intenta de nuevo.';
  return msg;
}

export default function MedicsPanel() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');
  const [section, setSection] = useState<Section>('inicio');
  const [patients, setPatients] = useState<PatientLink[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientLink | null>(null);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [forgotMode, setForgotMode] = useState<'off' | 'email' | 'sent'>('off');
  const [registerMode, setRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState<'email' | 'details' | 'password' | 'done'>('email');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerCenterName, setRegisterCenterName] = useState('');
  const [registerSpecialty, setRegisterSpecialty] = useState('');
  const [registerIsSelfService, setRegisterIsSelfService] = useState(false);
  const [googleProfileMode, setGoogleProfileMode] = useState(false);
  const [pendingCenterName, setPendingCenterName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<'estado' | 'nombre'>('estado');
  const [configName, setConfigName] = useState('');
  const [configCenterName, setConfigCenterName] = useState('');
  const [configGreen, setConfigGreen] = useState(1);
  const [configRed, setConfigRed] = useState(3);
  const [configSaved, setConfigSaved] = useState(false);
  const [centerImageUrl, setCenterImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModal, setImageModal] = useState<{ type: 'success' | 'error'; url?: string; message?: string } | null>(null);
  const [patientSemaforoOverride, setPatientSemaforoOverride] = useState(false);
  const [patientSemaforoGreen, setPatientSemaforoGreen] = useState(1);
  const [patientSemaforoRed, setPatientSemaforoRed] = useState(3);
  const [patientConfigSaved, setPatientConfigSaved] = useState(false);
  const [patientConfigError, setPatientConfigError] = useState<string | null>(null);
  const [entryPage, setEntryPage] = useState(0);
  const [entryFilterFrom, setEntryFilterFrom] = useState('');
  const [entryFilterTo, setEntryFilterTo] = useState('');
  const [configPalette, setConfigPalette] = useState('terracotta');
  const [customColor1, setCustomColor1] = useState('#dd8273');
  const [customColor2, setCustomColor2] = useState('#1a0e0e');
  const [extractingColors, setExtractingColors] = useState(false);
  const [patientHiddenFields, setPatientHiddenFields] = useState<string[]>([]);
  const [patientEntryTypeMode, setPatientEntryTypeMode] = useState<string>('both');
  const [patientConfigOpen, setPatientConfigOpen] = useState(false);
  const [patientPushMinHours, setPatientPushMinHours] = useState(24);
  const [patientPushFrequency, setPatientPushFrequency] = useState(2);
  const [pushTestStatus, setPushTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [pushTestError, setPushTestError] = useState('');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingSkippable, setOnboardingSkippable] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [bristolHover, setBristolHover] = useState<{ idx: number; b: number; date: string; svgX: number; svgY: number } | null>(null);
  const [noteEditing, setNoteEditing] = useState<{ entryId: string; draft: string } | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [patientTagsDraft, setPatientTagsDraft] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [patientTagsSaving, setPatientTagsSaving] = useState(false);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalTagsSaving, setGlobalTagsSaving] = useState(false);
  const [configTagInput, setConfigTagInput] = useState('');
  const [clearTagsConfirm, setClearTagsConfirm] = useState(false);
  const [semaforoFilter, setSemaforoFilter] = useState<'all' | 'green' | 'orange' | 'red' | 'gray' | 'no7d'>('all');
  const [practiceStats, setPracticeStats] = useState<{ thisWeekEntries: number; lastWeekEntries: number; thisWeekBristol: number | null; lastWeekBristol: number | null } | null>(null);
  const [bristolAlerts, setBristolAlerts] = useState<{ patientId: string; curr: number; prev: number }[]>([]);

  const th: MedicsTheme = configPalette === 'custom'
    ? { primary: customColor1, dark: customColor2, navActive: customColor2, textMuted: '#9a8880', border: '#2d1a1a', menuLabel: '#5c4040', logoutColor: '#7a6060', versionColor: '#3d2a2a' }
    : (PALETTES.find(p => p.id === configPalette) || PALETTES[0]).theme;
  const ts = {
    loginContainer: { ...s.loginContainer, backgroundColor: th.primary },
    btnPrimary: { ...s.btnPrimary, backgroundColor: th.dark },
    linkBtn: { ...s.linkBtn, color: th.primary },
  };

  const ENTRIES_PER_PAGE = 10;
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Helpers for building DoctorInfo ──
  const buildDoctorInfo = (d: any): DoctorInfo => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    center_id: d.center_id,
    center_name: (d.centers as { name: string; image_url?: string } | null)?.name || 'Centro médico',
    center_image_url: (d.centers as { name: string; image_url?: string } | null)?.image_url || null,
    semaforo_green: d.semaforo_green ?? 1,
    semaforo_red: d.semaforo_red ?? 3,
    palette: d.palette || 'terracotta',
    plan: (d.plan as 'free' | 'beta' | 'pro') || 'free',
    global_tags: d.global_tags || [],
  });

  const applyDoctorInfo = (info: DoctorInfo) => {
    setDoctorInfo(info);
    setConfigName(info.name);
    setConfigCenterName(info.center_name);
    setConfigGreen(info.semaforo_green);
    setConfigRed(info.semaforo_red);
    setGlobalTags(info.global_tags || []);

    const imageUrl = info.center_image_url || null;
    setCenterImageUrl(imageUrl);

    // Silent migration: if the stored image is still base64, move it to Storage
    if (imageUrl?.startsWith('data:') && info.center_id) {
      migrateBase64ToStorage(info.center_id, imageUrl).then(newUrl => {
        if (newUrl) {
          setCenterImageUrl(newUrl);
          setDoctorInfo(prev => prev ? { ...prev, center_image_url: newUrl } : prev);
        }
      });
    }

    setCustomColor1('#a84a38');
    setCustomColor2('#141414');
    setConfigPalette('custom');
  };

  // ── Recover session on mount + handle Google OAuth callback ──
  useEffect(() => {
    let mounted = true;

    const tryLoadDoctor = async (user: any) => {
      const isGoogle = (user.app_metadata?.provider || '') === 'google';
      const userMeta = (user.user_metadata || {}) as Record<string, any>;
      console.log('[tryLoadDoctor] uid:', user.id, 'provider:', user.app_metadata?.provider, 'metadata:', userMeta);
      setDebugMsg('Buscando tu perfil médico…');

      // 1. Existing doctor record — with 8 s timeout so a hung query doesn't
      //    freeze the UI forever (e.g. Supabase project paused, RLS misconfigured)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.')), 8000)
      );
      let { data: doctorData } = await Promise.race([
        supabase.from('doctors').select('*, centers(name, image_url)').eq('id', user.id).maybeSingle(),
        timeoutPromise,
      ]);
      console.log('[tryLoadDoctor] step1 doctor:', doctorData);
      if (!mounted) return;

      // 2. Pending admin invitation (email/password only)
      if (!doctorData && !isGoogle) {
        setDebugMsg('Verificando acceso al sistema…');
        const userEmail = user.email?.toLowerCase();
        if (userEmail) {
          const { data: pendingCenter } = await supabase
            .from('centers').select('*')
            .eq('pending_doctor_email', userEmail).limit(1).single();
          if (pendingCenter) {
            const { error: insertErr } = await supabase.from('doctors').insert({
              id: user.id, center_id: pendingCenter.id,
              name: pendingCenter.pending_doctor_name || userEmail.split('@')[0],
              specialty: pendingCenter.pending_doctor_specialty || null,
            });
            if (insertErr) console.error('[tryLoadDoctor] admin-invite doctors INSERT failed:', insertErr);
            if (!insertErr) {
              await supabase.from('centers').update({
                pending_doctor_email: null, pending_doctor_name: null, pending_doctor_specialty: null,
              }).eq('id', pendingCenter.id);
              const { data: d } = await supabase.from('doctors')
                .select('*, centers(name, image_url)').eq('id', user.id).single();
              doctorData = d;
            }
          }
        }
      }
      if (!mounted) return;

      // 3. Self-service first login (email/password with is_doctor metadata)
      // Uses an RPC (SECURITY DEFINER) to create center + doctor atomically,
      // avoiding the RLS chicken-and-egg: centers SELECT policy requires a
      // doctors row that doesn't exist yet at insert time.
      if (!doctorData && !isGoogle) {
        setDebugMsg('Configurando tu cuenta por primera vez…');
        console.log('[tryLoadDoctor] step3 is_doctor:', userMeta.is_doctor, 'center_name:', userMeta.center_name);
        if (userMeta.is_doctor) {
          const userEmail = user.email?.toLowerCase() || '';
          const centerName = (userMeta.center_name as string)?.trim() || `Consulta de ${userMeta.name || userEmail.split('@')[0]}`;
          const { error: regErr } = await supabase.rpc('doctor_self_register', {
            p_name: (userMeta.name as string)?.trim() || userEmail.split('@')[0],
            p_center_name: centerName,
            p_specialty: (userMeta.specialty as string)?.trim() || null,
          });
          if (regErr) {
            console.error('[tryLoadDoctor] doctor_self_register RPC failed:', regErr);
            setDebugMsg('');
            setError(`Error al activar tu cuenta: ${regErr.message}`);
            setLoading(false);
            return; // valid auth account — don't sign out, let them retry
          }
          console.log('[tryLoadDoctor] RPC ok, fetching doctor row…');
          const { data: d, error: selectErr } = await supabase.from('doctors')
            .select('*, centers(name, image_url)').eq('id', user.id).single();
          console.log('[tryLoadDoctor] post-RPC doctor:', d, 'err:', selectErr);
          if (selectErr) {
            // RPC succeeded (doctor+center created) but SELECT failed — don't sign out
            console.error('[tryLoadDoctor] doctors SELECT post-RPC failed:', selectErr);
            setDebugMsg('');
            setError('Tu cuenta ha sido activada. Recarga la página para continuar.');
            setLoading(false);
            return;
          }
          doctorData = d;
        }
      }
      if (!mounted) return;

      // 4. Still no doctor record
      if (!doctorData) {
        if (isGoogle) {
          // Google OAuth new user — show profile completion form
          const md = user.user_metadata || {};
          setRegisterName(((md.full_name || md.name || '') as string).trim());
          setGoogleProfileMode(true);
          setLoading(false);
        } else if (userMeta.is_doctor) {
          // Self-service doctor: account exists but profile couldn't be loaded — don't sign out
          setDebugMsg('');
          setError('Tu cuenta está siendo activada. Inicia sesión de nuevo en unos segundos.');
          setLoading(false);
        } else {
          // Email/password user with no doctor record and not self-service — reject
          setDebugMsg('');
          setError('No encontramos un perfil médico para esta cuenta. Pide al administrador que te dé de alta desde /admin.');
          await supabase.auth.signOut();
          setLoading(false);
        }
        return;
      }

      setDebugMsg('¡Todo listo! Abriendo tu panel…');
      applyDoctorInfo(buildDoctorInfo(doctorData));
      setLoggedIn(true);
      setLoading(false);
    };

    // onAuthStateChange always fires INITIAL_SESSION on mount (with or without
    // a session), so this single handler covers all cases: no session, existing
    // session, and Google OAuth callback (which fires SIGNED_IN after the PKCE
    // code exchange). Relying on getSession() instead caused a hang when the
    // PKCE exchange failed silently, leaving initialLoading=true forever.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      // Unblock the UI immediately — never wait on an async query to remove
      // the loading screen, since a hung query would freeze the page forever.
      setInitialLoading(false);
      if (session?.user) {
        setError(''); // clear any error from a previous (e.g. timed-out) auth event
        // Token refresh and user-update events don't require reloading the doctor
        // profile — the doctor is already in state. Reloading would re-run the
        // 8 s DB timeout, which can fire spuriously right after functions.invoke
        // triggers an internal token refresh, showing a false connection error.
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, '', '/medics');
        }
        try { await tryLoadDoctor(session.user); } catch (e) {
          if (mounted) {
            const msg = e instanceof Error ? e.message : '';
            // Supabase PKCE lock contention during OAuth callback — the token is still
            // valid; retry once with a fresh session instead of showing an error.
            if (msg.includes('Lock broken')) {
              try {
                const { data: { session: fresh } } = await supabase.auth.getSession();
                if (fresh?.user && mounted) await tryLoadDoctor(fresh.user);
              } catch (e2) {
                if (mounted) { setDebugMsg(''); setError('Error al iniciar sesión. Intenta de nuevo.'); setLoading(false); }
              }
              return;
            }
            setDebugMsg('');
            setError(msg || 'Error inesperado. Intenta de nuevo.');
            setLoading(false);
          }
        }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── Login ──
  // Only handles authentication. Doctor loading is done by tryLoadDoctor
  // via onAuthStateChange SIGNED_IN, which avoids a race condition where
  // both handleLogin and onAuthStateChange were loading the doctor in parallel.
  const handleLogin = async () => {
    setError('');
    setDebugMsg('Verificando credenciales…');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setDebugMsg('');
        setError(translateAuthError(authError.message));
        setLoading(false);
      } else {
        setDebugMsg('Credenciales correctas, cargando tu perfil…');
      }
      // On success: onAuthStateChange fires SIGNED_IN → tryLoadDoctor runs →
      // calls setLoading(false) and setLoggedIn(true) when done.
    } catch (e) {
      setDebugMsg('');
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // ── Google OAuth sign-in ──
  const handleGoogleSignIn = async () => {
    setError('');
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/medics' },
    });
    if (oauthErr) setError('Error al conectar con Google: ' + oauthErr.message);
  };

  // ── Complete profile for Google OAuth first-timers ──
  const handleGoogleProfileComplete = async () => {
    if (!registerName.trim()) { setError('Introduce tu nombre'); return; }
    if (!registerCenterName.trim()) { setError('Introduce el nombre de tu consulta o centro'); return; }
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sin sesión activa');
      const { data: newCenter, error: centerErr } = await supabase
        .from('centers')
        .insert({ name: registerCenterName.trim() })
        .select('id')
        .single();
      if (centerErr || !newCenter) throw new Error(centerErr?.message || 'Error al crear el centro');
      const { error: docErr } = await supabase.from('doctors').insert({
        id: user.id,
        center_id: newCenter.id,
        name: registerName.trim(),
        specialty: registerSpecialty.trim() || null,
        plan: 'beta',
      });
      if (docErr) throw new Error(docErr.message);
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*, centers(name, image_url)')
        .eq('id', user.id)
        .single();
      if (doctorData) {
        applyDoctorInfo(buildDoctorInfo(doctorData));
        setGoogleProfileMode(false);
        setLoggedIn(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear tu perfil');
    } finally {
      setLoading(false);
    }
  };

  // ── Load patients ──
  const loadPatients = async () => {
    if (!doctorInfo) return;
    setPatientsLoading(true);
    const { data, error: loadError } = await supabase
      .from('patient_links')
      .select('*')
      .eq('doctor_id', doctorInfo.id)
      .order('invited_at', { ascending: false });
    if (loadError) {
      setError(loadError.message);
      setPatientsLoading(false);
      return;
    }
    // Enrich with display_name, email, and last entry date
    const enriched = await Promise.all((data || []).map(async (p: any) => {
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

        // Fetch last entry
        const { data: lastEntry } = await supabase
          .from('entries')
          .select('date')
          .eq('user_id', p.patient_id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        if (lastEntry) {
          lastEntryDate = lastEntry.date;
          daysSinceLast = Math.floor((Date.now() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24));
        }
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
    setPatients(enriched);
    setPatientsLoading(false);
  };

  useEffect(() => {
    if (!loggedIn || !doctorInfo) return;
    loadPatients();
  }, [loggedIn, doctorInfo]);

  useEffect(() => {
    const accepted = patients.filter(p => p.status === 'accepted' && p.patient_id);
    if (accepted.length === 0) { setPracticeStats(null); setBristolAlerts([]); return; }
    const patientIds = accepted.map(p => p.patient_id as string);
    const d98 = new Date(); d98.setDate(d98.getDate() - 98);
    const d14 = new Date(); d14.setDate(d14.getDate() - 14);
    const d7  = new Date(); d7.setDate(d7.getDate() - 7);
    const s98 = d98.toISOString().split('T')[0];
    const s14 = d14.toISOString().split('T')[0];
    const s7  = d7.toISOString().split('T')[0];
    let cancelled = false;
    supabase.from('entries').select('date, bristol, entry_type, user_id').in('user_id', patientIds).gte('date', s98).then(({ data }) => {
      if (cancelled || !data) return;
      // Practice stats (last 2 weeks)
      const thisWeek = data.filter((e: any) => e.date >= s7);
      const lastWeek = data.filter((e: any) => e.date >= s14 && e.date < s7);
      const avgB = (es: any[]) => { const bv = es.filter(e => e.entry_type === 'poop' && e.bristol != null).map(e => e.bristol as number); return bv.length ? bv.reduce((s: number, v: number) => s + v, 0) / bv.length : null; };
      setPracticeStats({ thisWeekEntries: thisWeek.length, lastWeekEntries: lastWeek.length, thisWeekBristol: avgB(thisWeek), lastWeekBristol: avgB(lastWeek) });
      // Per-patient Bristol worsening alerts
      const alerts: { patientId: string; curr: number; prev: number }[] = [];
      for (const pid of patientIds) {
        const pe = data.filter((e: any) => e.user_id === pid && e.entry_type === 'poop' && e.bristol != null);
        const cw = pe.filter((e: any) => e.date >= s7).map((e: any) => e.bristol as number);
        const lw = pe.filter((e: any) => e.date >= s14 && e.date < s7).map((e: any) => e.bristol as number);
        if (cw.length >= 2 && lw.length >= 2) {
          const ca = cw.reduce((s, v) => s + v, 0) / cw.length;
          const pa = lw.reduce((s, v) => s + v, 0) / lw.length;
          if (Math.abs(ca - 4) > Math.abs(pa - 4) + 0.5) alerts.push({ patientId: pid, curr: ca, prev: pa });
        }
      }
      setBristolAlerts(alerts);
    });
    return () => { cancelled = true; };
  }, [patients]);

  // ── Onboarding: show on first login, persist via localStorage ──
  useEffect(() => {
    if (!loggedIn || !doctorInfo) return;
    const key = `fluxia_onboarding_v1_${doctorInfo.id}`;
    if (!localStorage.getItem(key)) {
      setOnboardingStep(0);
      setOnboardingSkippable(false);
      setOnboardingOpen(true);
    }
  }, [loggedIn, doctorInfo?.id]);

  const finishOnboarding = () => {
    if (doctorInfo) localStorage.setItem(`fluxia_onboarding_v1_${doctorInfo.id}`, '1');
    setOnboardingOpen(false);
  };

  const openGuide = () => {
    setOnboardingStep(0);
    setOnboardingSkippable(true);
    setOnboardingOpen(true);
  };

  // ── Save doctor annotation on a specific entry ──
  const handleSaveEntryNote = async (entryId: string, note: string) => {
    if (!doctorInfo) return;
    if (note.trim()) {
      await supabase.from('entry_doctor_notes').upsert(
        { doctor_id: doctorInfo.id, entry_id: entryId, note: note.trim() },
        { onConflict: 'doctor_id,entry_id' }
      );
    } else {
      await supabase.from('entry_doctor_notes').delete()
        .eq('doctor_id', doctorInfo.id).eq('entry_id', entryId);
    }
    setPatientDetail(prev => prev ? {
      ...prev,
      entries: prev.entries.map(e => e.entry_id === entryId ? { ...e, doctor_note: note.trim() } : e),
    } : prev);
    setNoteEditing(null);
  };

  // ── Save clinical notes for selected patient ──
  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    setNotesSaving(true);
    const { error } = await supabase
      .from('patient_links')
      .update({ doctor_notes: notesDraft })
      .eq('id', selectedPatient.id);
    setNotesSaving(false);
    if (!error) {
      const updated = { ...selectedPatient, doctor_notes: notesDraft };
      setSelectedPatient(updated);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
    }
  };

  // ── Invite patient ──
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleInvite = async () => {
    setError('');
    setEmailSent(false);
    setEmailError('');
    setInviteSuccess(false);
    if (!inviteEmail.trim()) { setError('Introduce el email del paciente'); return; }
    // Free tier: enforce the 1-patient limit (accepted + pending combined)
    if (doctorInfo?.plan === 'beta' && patients.length >= BETA_PLAN_PATIENT_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    if (doctorInfo?.plan === 'free' && patients.length >= FREE_PLAN_PATIENT_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('doctor_invite_patient', {
        p_patient_email: inviteEmail.trim(),
      });
      if (rpcError) {
        setError(translateAuthError(rpcError.message));
        setLoading(false);
        return;
      }
      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Send notification email
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('send-invite-email', {
          body: {
            patientEmail: inviteEmail.trim(),
            doctorName: doctorInfo?.name || '',
            centerName: doctorInfo?.center_name || '',
          },
        });
        if (fnError) {
          setEmailError(`No se pudo enviar el email: ${fnError.message || JSON.stringify(fnError)}`);
        } else if (fnData?.error) {
          setEmailError(`No se pudo enviar el email: ${fnData.error}`);
        } else {
          setEmailSent(true);
        }
      } catch (e: any) {
        setEmailError(`No se pudo enviar el email: ${e?.message || 'Error desconocido'}`);
      }

      setInviteSuccess(true);
      setInviteEmail('');
      loadPatients();
    } catch (err) {
      setError('Error al crear la invitación');
    } finally {
      setLoading(false);
    }
  };

  // ── Revoke pending invitation ──
  const handleRevokeInvite = async (patient: PatientLink) => {
    if (!confirm(`¿Eliminar la invitación de ${patientLabel(patient)}?`)) return;
    const { error: delError } = await supabase
      .from('patient_links')
      .delete()
      .eq('id', patient.id)
      .eq('status', 'pending');
    if (delError) {
      setError(delError.message);
    } else {
      loadPatients();
    }
  };

  // ── Load patient detail ──
  const loadPatientDetail = async (patient: PatientLink) => {
    if (!patient.patient_id) return;
    setSelectedPatient(patient);
    setDetailLoading(true);
    setLoading(true);

    const { data: entries } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', patient.patient_id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    const entryList: PatientEntry[] = (entries || []).map((e: any) => ({
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

    // Load doctor entry notes
    const entryIds = entryList.map(e => e.entry_id).filter(Boolean);
    let notesMap = new Map<string, string>();
    if (entryIds.length > 0 && doctorInfo) {
      const { data: dnotes } = await supabase
        .from('entry_doctor_notes')
        .select('entry_id, note')
        .eq('doctor_id', doctorInfo.id)
        .in('entry_id', entryIds);
      (dnotes || []).forEach((n: any) => notesMap.set(n.entry_id, n.note));
    }
    const entryListWithNotes = entryList.map(e => ({ ...e, doctor_note: notesMap.get(e.entry_id) || '' }));

    const bristolValues = entryListWithNotes.filter(e => e.bristol != null).map(e => e.bristol!);
    const bristolAvg = bristolValues.length > 0 ? bristolValues.reduce((a, b) => a + b, 0) / bristolValues.length : null;
    const lastEntryDate = entryListWithNotes.length > 0 ? entryListWithNotes[0].date : null;
    const daysSinceLast = lastEntryDate ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Reset calendar to current month when opening a patient
    setCalendarMonth(new Date().getMonth());
    setCalendarYear(new Date().getFullYear());

    // Initialize per-patient semáforo override state
    setPatientSemaforoOverride(patient.semaforo_override ?? false);
    setPatientSemaforoGreen(patient.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1);
    setPatientSemaforoRed(patient.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3);
    setPatientHiddenFields(patient.hidden_fields || []);
    setPatientEntryTypeMode(patient.entry_type_mode || 'both');
    setPatientConfigOpen(false);
    setPatientPushMinHours(patient.push_min_hours ?? 24);
    setPatientPushFrequency(patient.push_frequency ?? 2);
    setPatientConfigSaved(false);
    setPatientConfigError(null);
    setPushTestStatus('idle');
    setPushTestError('');
    setEntryPage(0);
    setEntryFilterFrom('');
    setEntryFilterTo('');
    setNotesDraft(patient.doctor_notes || '');
    setBristolHover(null);
    setNoteEditing(null);
    setPatientTagsDraft(patient.tags || []);
    setNewTagInput('');

    setPatientDetail({
      entries: entryListWithNotes,
      totalEntries: entryList.length,
      bristolAvg,
      lastEntryDate,
      daysSinceLast,
    });
    setDetailLoading(false);
    setLoading(false);
  };

  // ── Helpers ──
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const shortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  // ── Forgot password flow ──
  const handleForgotPassword = async () => {
    setError('');
    if (!email.trim()) { setError('Introduce tu email'); return; }
    setLoading(true);
    const siteUrl = window.location.origin + '/medics';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: siteUrl,
    });
    setLoading(false);
    if (resetError) { setError(translateAuthError(resetError.message)); return; }
    setForgotMode('sent');
  };

  // ── Registration flow ──
  const handleRegisterCheckEmail = async () => {
    setError('');
    if (!registerEmail.trim()) { setError('Introduce tu email'); return; }
    setLoading(true);
    const { data: pendingCenter } = await supabase
      .from('centers')
      .select('name')
      .eq('pending_doctor_email', registerEmail.trim().toLowerCase())
      .limit(1)
      .single();
    setLoading(false);
    if (pendingCenter) {
      // Invited flow: skip directly to password
      setPendingCenterName(pendingCenter.name);
      setRegisterIsSelfService(false);
      setRegisterStep('password');
    } else {
      // Self-service flow: collect doctor + center details
      setRegisterIsSelfService(true);
      setRegisterStep('details');
    }
  };

  const handleRegisterFillDetails = () => {
    setError('');
    if (!registerName.trim()) { setError('Introduce tu nombre'); return; }
    if (!registerCenterName.trim()) { setError('Introduce el nombre de tu consulta o centro'); return; }
    setRegisterStep('password');
  };

  const handleRegisterCreate = async () => {
    setError('');
    if (!registerPassword || registerPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const signUpPayload: any = {
      email: registerEmail.trim().toLowerCase(),
      password: registerPassword,
      options: {
        emailRedirectTo: window.location.origin + '/medics',
        ...(registerIsSelfService ? {
          data: {
            is_doctor: true,
            name: registerName.trim(),
            center_name: registerCenterName.trim(),
            specialty: registerSpecialty.trim() || null,
          },
        } : {}),
      },
    };
    const { error: signUpError } = await supabase.auth.signUp(signUpPayload);
    setLoading(false);
    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      return;
    }
    setRegisterStep('done');
  };

  // ── Save config ──
  const handleSaveConfig = async () => {
    if (!doctorInfo) return;
    setLoading(true);
    const trimmedName = configName.trim() || doctorInfo.name;
    const trimmedCenter = configCenterName.trim() || doctorInfo.center_name;
    const paletteToSave = configPalette === 'custom'
      ? `custom:${customColor1.replace('#', '')}:${customColor2.replace('#', '')}`
      : configPalette;
    const [{ error: doctorErr }, { error: centerErr }] = await Promise.all([
      supabase
        .from('doctors')
        .update({ name: trimmedName, semaforo_green: configGreen, semaforo_red: configRed, palette: paletteToSave })
        .eq('id', doctorInfo.id),
      supabase
        .from('centers')
        .update({ name: trimmedCenter })
        .eq('id', doctorInfo.center_id),
    ]);
    setLoading(false);
    if (!doctorErr && !centerErr) {
      const updated = { ...doctorInfo, name: trimmedName, center_name: trimmedCenter, semaforo_green: configGreen, semaforo_red: configRed, palette: paletteToSave };
      setDoctorInfo(updated);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    }
  };

  // ── Extract dominant colors from center image ──
  const handleExtractColors = async () => {
    if (!centerImageUrl || extractingColors) return;
    setExtractingColors(true);
    try {
      const colors = await extractDominantColors(centerImageUrl);
      if (colors[0]) setCustomColor1(colors[0]);
      if (colors[1]) setCustomColor2(colors[1]);
      else if (colors[0]) setCustomColor2(darkenColor(colors[0]));
      setConfigPalette('custom');
    } catch {
      // CORS/canvas error — silently ignore
    } finally {
      setExtractingColors(false);
    }
  };

  // ── Save per-patient semáforo override ──
  // ── Save all patient config in one shot ──
  const handleSavePatientConfig = async () => {
    if (!selectedPatient) return;
    setPatientConfigError(null);
    const freq = Math.max(1, Math.min(24, patientPushFrequency));
    const mins = Math.max(1, Math.min(168, patientPushMinHours));
    const { error } = await supabase
      .from('patient_links')
      .update({
        semaforo_override: patientSemaforoOverride,
        semaforo_green_override: patientSemaforoOverride ? patientSemaforoGreen : null,
        semaforo_red_override: patientSemaforoOverride ? patientSemaforoRed : null,
        hidden_fields: patientHiddenFields,
        entry_type_mode: patientEntryTypeMode,
        push_min_hours: mins,
        push_frequency: freq,
        tags: patientTagsDraft,
      })
      .eq('id', selectedPatient.id);
    if (error) {
      console.error('[medics] savePatientConfig error:', error);
      setPatientConfigError(error.message);
    } else {
      const updated = {
        ...selectedPatient,
        semaforo_override: patientSemaforoOverride,
        semaforo_green_override: patientSemaforoOverride ? patientSemaforoGreen : null,
        semaforo_red_override: patientSemaforoOverride ? patientSemaforoRed : null,
        hidden_fields: patientHiddenFields,
        entry_type_mode: patientEntryTypeMode,
        push_min_hours: mins,
        push_frequency: freq,
        tags: patientTagsDraft,
      };
      setSelectedPatient(updated);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
      setPatientConfigSaved(true);
      setTimeout(() => setPatientConfigSaved(false), 3000);
    }
  };

  // ── Save patient tags (auto-save on every add/remove) ──
  const savePatientTags = async (newTags: string[]) => {
    if (!selectedPatient) return;
    setPatientTagsSaving(true);
    setPatientTagsDraft(newTags);
    const { error } = await supabase.from('patient_links').update({ tags: newTags }).eq('id', selectedPatient.id);
    if (!error) {
      const updated = { ...selectedPatient, tags: newTags };
      setSelectedPatient(updated);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
    }
    setPatientTagsSaving(false);
  };

  // ── Save global tag catalog ──
  const saveGlobalTags = async (newTags: string[]) => {
    if (!doctorInfo) return;
    setGlobalTags(newTags);
    setDoctorInfo(prev => prev ? { ...prev, global_tags: newTags } : prev);
    await supabase.from('doctors').update({ global_tags: newTags }).eq('id', doctorInfo.id);
  };

  // ── Delete global tag + cascade remove from all patients ──
  const deleteGlobalTag = async (tag: string) => {
    if (!doctorInfo) return;
    setGlobalTagsSaving(true);
    const newGlobal = globalTags.filter(t => t !== tag);
    setGlobalTags(newGlobal);
    setDoctorInfo(prev => prev ? { ...prev, global_tags: newGlobal } : prev);
    const affected = patients.filter(p => (p.tags || []).includes(tag));
    await Promise.all([
      supabase.from('doctors').update({ global_tags: newGlobal }).eq('id', doctorInfo.id),
      ...affected.map(p =>
        supabase.from('patient_links').update({ tags: (p.tags || []).filter(t => t !== tag) }).eq('id', p.id)
      ),
    ]);
    setPatients(prev => prev.map(p => ({ ...p, tags: (p.tags || []).filter(t => t !== tag) })));
    if (selectedPatient && (selectedPatient.tags || []).includes(tag)) {
      const newPatTags = (selectedPatient.tags || []).filter(t => t !== tag);
      setSelectedPatient(prev => prev ? { ...prev, tags: newPatTags } : prev);
      setPatientTagsDraft(newPatTags);
    }
    setGlobalTagsSaving(false);
  };

  // ── Send test push notification to patient ──
  const handleSendTestPush = async () => {
    if (!selectedPatient?.patient_id) return;
    setPushTestStatus('sending');
    setPushTestError('');
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        patient_id: selectedPatient.patient_id,
        title: 'Fluxia — Mensaje de prueba',
        body: 'Tu médico ha enviado una notificación de prueba 👋',
      },
    });
    if (error || !data?.success) {
      setPushTestStatus('error');
      setPushTestError(data?.error || error?.message || 'Error desconocido');
      setTimeout(() => setPushTestStatus('idle'), 5000);
    } else {
      setPushTestStatus('ok');
      setTimeout(() => setPushTestStatus('idle'), 4000);
    }
  };

  // ── Upload center image to Supabase Storage ──
  const handleImageUpload = async (file: File) => {
    if (!doctorInfo) return;

    if (file.size > 2 * 1024 * 1024) {
      setImageModal({ type: 'error', message: 'La imagen supera los 2 MB. Elige una más pequeña.' });
      return;
    }

    setUploadingImage(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${doctorInfo.center_id}/logo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('center-images')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadingImage(false);
      setImageModal({ type: 'error', message: uploadErr.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('center-images')
      .getPublicUrl(path);

    // Include cache-buster in the URL saved to DB so reloads always fetch fresh
    const versionedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from('centers')
      .update({ image_url: versionedUrl })
      .eq('id', doctorInfo.center_id);

    if (dbErr) {
      setUploadingImage(false);
      setImageModal({ type: 'error', message: dbErr.message });
      return;
    }

    setCenterImageUrl(versionedUrl);
    setDoctorInfo({ ...doctorInfo, center_image_url: versionedUrl });
    setUploadingImage(false);
    setImageModal({ type: 'success', url: versionedUrl });
  };

  const patientLabel = (p: PatientLink) => p.display_name || p.patient_email || 'Paciente';
  const patientInitial = (p: PatientLink) => (p.display_name || p.patient_email || '?')[0].toUpperCase();

  const acceptedPatients = patients.filter(p => p.status === 'accepted');
  const pendingPatients = patients.filter(p => p.status === 'pending');

  // ── Semáforo helper ──
  const getSemaforo = (daysSinceLast: number | null, overrideGreen?: number, overrideRed?: number) => {
    if (daysSinceLast === null) return { color: '#aaa', icon: '\u{26AA}' };
    const green = overrideGreen ?? doctorInfo?.semaforo_green ?? 1;
    const red = overrideRed ?? doctorInfo?.semaforo_red ?? 3;
    if (daysSinceLast <= green) return { color: '#27ae60', icon: '\u{1F7E2}' };
    if (daysSinceLast <= red) return { color: '#f39c12', icon: '\u{1F7E0}' };
    return { color: '#e74c3c', icon: '\u{1F534}' };
  };

  const getSemaforoKey = (p: PatientLink): 'green' | 'orange' | 'red' | 'gray' => {
    if (p.daysSinceLast === null) return 'gray';
    const pG = p.semaforo_override ? (p.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1) : (doctorInfo?.semaforo_green ?? 1);
    const pR = p.semaforo_override ? (p.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3) : (doctorInfo?.semaforo_red ?? 3);
    if (p.daysSinceLast <= pG) return 'green';
    if (p.daysSinceLast <= pR) return 'orange';
    return 'red';
  };

  // Effective semáforo thresholds for the currently selected patient
  const effectiveGreen = selectedPatient?.semaforo_override
    ? (selectedPatient.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1)
    : (doctorInfo?.semaforo_green ?? 1);
  const effectiveRed = selectedPatient?.semaforo_override
    ? (selectedPatient.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3)
    : (doctorInfo?.semaforo_red ?? 3);

  // ── Initial loading ──
  if (initialLoading) {
    return (
      <div className="medics-loading min-h-screen flex flex-col items-center justify-center bg-fx-surface font-fx">
        <div className="medics-loading__inner text-center text-fx-text">
          <img src="/fluxia-logo.png" alt="Fluxia" className="h-10 object-contain block mx-auto" />
          <p className="mt-3 text-base font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // ── Login / Register screen ──
  if (!loggedIn) {
    const showGoogleBtn = !googleProfileMode && forgotMode === 'off'
      && (!registerMode || registerStep === 'email');

    let cardTitle = 'Inicia sesión en tu cuenta';
    let cardSubtitle = '¡Bienvenido de nuevo! Introduce tus credenciales para continuar.';
    if (googleProfileMode) {
      cardTitle = 'Completa tu perfil médico';
      cardSubtitle = 'Necesitamos algunos datos para configurar tu cuenta en Fluxia.';
    } else if (forgotMode === 'email') {
      cardTitle = 'Recuperar contraseña';
      cardSubtitle = 'Te enviaremos un enlace a tu email para restablecer tu contraseña.';
    } else if (forgotMode === 'sent') {
      cardTitle = '¡Email enviado!';
      cardSubtitle = '';
    } else if (registerMode) {
      if (registerStep === 'email') { cardTitle = 'Crea tu cuenta profesional'; cardSubtitle = 'Comienza gratis. Incluye 1 paciente sin coste.'; }
      else if (registerStep === 'details') { cardTitle = 'Cuéntanos sobre ti'; cardSubtitle = 'Estos datos aparecerán en la app de tus pacientes.'; }
      else if (registerStep === 'password') { cardTitle = 'Elige tu contraseña'; cardSubtitle = registerIsSelfService ? `Consulta: ${registerCenterName}` : `Centro: ${pendingCenterName}`; }
      else { cardTitle = '¡Revisa tu email!'; cardSubtitle = ''; }
    }

    const GoogleG = () => (
      <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );

    const backLink = (label: string, onClick: () => void) => (
      <button onClick={onClick} className="medics-auth__back-link block w-full mt-4 bg-transparent border-none text-fx-text-tertiary text-[13px] cursor-pointer text-center">
        ← {label}
      </button>
    );

    return (
      <div className="medics-auth flex min-h-screen font-sans">

        {/* ── Left branding panel (desktop only) ── */}
        {!isMobile && (
          <div className="medics-auth__branding flex-none max-w-[450px] basis-[35%] bg-[#1a0e0e] flex flex-col items-center justify-center px-[52px] py-12 overflow-hidden">
            <div className="max-w-[380px] w-full">
              <img src="/fluxia-logo.png" alt="Fluxia" className="h-[120px] object-contain object-left block mb-8 relative -left-[30px]" style={{ filter: 'brightness(0) invert(1)' }} />
              <h1 className="text-[42px] font-black text-white leading-[1.2] m-0 mb-5">
                Bienvenido<br />al portal<br />médico.
              </h1>
              <p className="text-base text-white/50 leading-[1.7] m-0">
                Gestiona el seguimiento clínico de tus pacientes desde cualquier dispositivo.
              </p>
            </div>
          </div>
        )}

        {/* ── Right form panel ── */}
        <div className={`medics-auth__form flex-1 flex items-center justify-center bg-fx-surface ${isMobile ? 'px-6 py-12' : 'px-16 py-12'}`}>
          <div className="w-full max-w-[420px]">

            {/* Mobile logo */}
            {isMobile && (
              <div className="flex justify-center mb-9">
                <img src="/fluxia-logo.png" alt="Fluxia" className="h-10 object-contain" />
              </div>
            )}

            <h2 className={`medics-auth__title font-extrabold text-[#1a0e0e] m-0 mb-2 ${isMobile ? 'text-[22px]' : 'text-2xl'} ${(registerMode && registerStep === 'done') ? 'text-center' : 'text-left'}`}>{cardTitle}</h2>
            {cardSubtitle && <p className="medics-auth__subtitle text-sm text-fx-text-tertiary m-0 mb-7 leading-[1.55]">{cardSubtitle}</p>}

            {/* Google button + divider */}
            {showGoogleBtn && (
              <>
                <button onClick={handleGoogleSignIn} className="medics-auth__google-btn w-full px-4 py-[11px] rounded-[10px] border border-fx-border bg-fx-surface flex items-center justify-center gap-2.5 text-[15px] font-semibold cursor-pointer text-fx-text mb-3.5">
                  <GoogleG />
                  Continuar con Google
                </button>
                <div className="medics-auth__divider flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-fx-border-soft" />
                  <span className="text-xs text-fx-text-tertiary font-medium whitespace-nowrap">o con tu email</span>
                  <div className="flex-1 h-px bg-fx-border-soft" />
                </div>
              </>
            )}

            {/* ── Login ── */}
            {!registerMode && !googleProfileMode && forgotMode === 'off' && (<>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" placeholder="tu@email.com" />
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" placeholder="••••••" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleLogin} disabled={loading} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : 'Iniciar sesión'}</button>
              {loading && debugMsg && <p className="text-xs text-fx-text-tertiary mt-3 text-center italic">{debugMsg}</p>}
              <button onClick={() => { setForgotMode('email'); setError(''); }} className="medics-auth__forgot-link block w-full mt-3.5 bg-transparent border-none text-fx-text-tertiary text-[13px] cursor-pointer text-center">
                ¿Olvidaste tu contraseña?
              </button>
            </>)}

            {/* ── Forgot: email ── */}
            {forgotMode === 'email' && (<>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()} className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleForgotPassword} disabled={loading} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : 'Enviar enlace'}</button>
              {backLink('Volver al inicio de sesión', () => { setForgotMode('off'); setError(''); })}
            </>)}

            {/* ── Forgot: sent ── */}
            {forgotMode === 'sent' && (
              <div className="medics-auth__sent text-center">
                <span className="text-5xl">✅</span>
                <p className="text-sm text-fx-text-secondary mt-4 leading-[1.55]">
                  Hemos enviado un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada (y la carpeta de spam).
                </p>
                <button onClick={() => { setForgotMode('off'); setError(''); setPassword(''); }} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx mt-6" style={{ backgroundColor: th.dark }}>
                  Volver al inicio de sesión
                </button>
              </div>
            )}

            {/* ── Register: email ── */}
            {registerMode && registerStep === 'email' && (<>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Email profesional</label>
              <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRegisterCheckEmail()} placeholder="tu@email.com" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleRegisterCheckEmail} disabled={loading} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : 'Continuar'}</button>
            </>)}

            {/* ── Register: details ── */}
            {registerMode && registerStep === 'details' && (<>
              <div className="medics-auth__plan-banner bg-fx-success-50 rounded-[10px] px-3.5 py-2.5 mb-5 border-l-[3px] border-fx-success-500">
                <p className="text-xs font-bold text-fx-success-700 m-0">Plan Free · 1 paciente gratis</p>
                <p className="text-xs text-fx-text-secondary mt-0.5 mb-0 leading-[1.4]">Pasa al plan Pro en cualquier momento para añadir más pacientes.</p>
              </div>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Tu nombre</label>
              <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Dra. Elena Márquez" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Nombre de tu consulta o centro</label>
              <input type="text" value={registerCenterName} onChange={(e) => setRegisterCenterName(e.target.value)} placeholder="Consulta Dr. Márquez" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Especialidad <span className="font-normal text-fx-text-tertiary">(opcional)</span></label>
              <input type="text" value={registerSpecialty} onChange={(e) => setRegisterSpecialty(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRegisterFillDetails()} placeholder="Urología, Gastroenterología..." className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleRegisterFillDetails} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark }}>Continuar</button>
              {backLink('Volver', () => { setRegisterStep('email'); setError(''); })}
            </>)}

            {/* ── Register: password ── */}
            {registerMode && registerStep === 'password' && (<>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Contraseña</label>
              <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRegisterCreate()} placeholder="Mínimo 6 caracteres" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleRegisterCreate} disabled={loading} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : 'Finalizar registro'}</button>
              {backLink('Volver', () => { setRegisterStep(registerIsSelfService ? 'details' : 'email'); setError(''); })}
            </>)}

            {/* ── Register: done ── */}
            {registerMode && registerStep === 'done' && (
              <div className="medics-auth__sent text-center">
                <span className="text-5xl">📧</span>
                <p className="text-sm text-fx-text-secondary mt-4 leading-[1.55]">
                  Hemos enviado un enlace de confirmación a <strong>{registerEmail}</strong>. Confírmalo e inicia sesión aquí.
                </p>
                <button onClick={() => { setRegisterMode(false); setEmail(registerEmail); setError(''); }} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx mt-6" style={{ backgroundColor: th.dark }}>
                  Ir a iniciar sesión
                </button>
              </div>
            )}

            {/* ── Google profile completion ── */}
            {googleProfileMode && (<>
              <div className="medics-auth__plan-banner bg-fx-success-50 rounded-[10px] px-3.5 py-2.5 mb-5 border-l-[3px] border-fx-success-500">
                <p className="text-xs font-bold text-fx-success-700 m-0">Plan Free · 1 paciente gratis</p>
                <p className="text-xs text-fx-text-secondary mt-0.5 mb-0">Pasa al plan Pro en cualquier momento para añadir más pacientes.</p>
              </div>
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Tu nombre</label>
              <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Dra. Elena Márquez" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Nombre de tu consulta o centro</label>
              <input type="text" value={registerCenterName} onChange={(e) => setRegisterCenterName(e.target.value)} placeholder="Consulta Dr. Márquez" className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              <label className="medics-auth__label block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Especialidad <span className="font-normal text-fx-text-tertiary">(opcional)</span></label>
              <input type="text" value={registerSpecialty} onChange={(e) => setRegisterSpecialty(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGoogleProfileComplete()} placeholder="Urología, Gastroenterología..." className="medics-auth__input w-full px-3.5 py-3 rounded-fx-md border border-fx-border mb-4 text-[15px] outline-none box-border bg-fx-surface text-fx-text font-fx" />
              {error && <p className="medics-auth__error text-fx-error-600 text-[13px] mb-4">{error}</p>}
              <button onClick={handleGoogleProfileComplete} disabled={loading} className="medics-auth__submit w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold cursor-pointer font-fx" style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : 'Crear mi cuenta médica'}</button>
              <button onClick={async () => { await supabase.auth.signOut(); setGoogleProfileMode(false); }} className="medics-auth__cancel-link block w-full mt-4 bg-transparent border-none text-fx-text-tertiary text-[13px] cursor-pointer text-center">
                Cancelar y cerrar sesión
              </button>
            </>)}

            {/* ── Login / Register toggle ── */}
            {forgotMode === 'off' && !googleProfileMode && registerStep !== 'done' && (
              <p className="medics-auth__toggle text-center text-[13px] text-fx-text-tertiary mt-8 mb-0">
                {!registerMode ? (
                  <>¿Nuevo en Fluxia?{' '}
                    <button onClick={() => { setRegisterMode(true); setRegisterStep('email'); setError(''); setRegisterEmail(''); setRegisterPassword(''); setRegisterName(''); setRegisterCenterName(''); setRegisterSpecialty(''); setRegisterIsSelfService(false); }}
                      className="bg-transparent border-none text-[#1a0e0e] font-bold cursor-pointer text-[13px] underline">Crear cuenta</button>
                  </>
                ) : (
                  <>¿Ya tienes cuenta?{' '}
                    <button onClick={() => { setRegisterMode(false); setError(''); }}
                      className="bg-transparent border-none text-[#1a0e0e] font-bold cursor-pointer text-[13px] underline">Iniciar sesión</button>
                  </>
                )}
              </p>
            )}

            <p className="medics-auth__version text-center text-xs text-fx-text-tertiary mt-8">{APP_VERSION}</p>
          </div>
        </div>
      </div>
    );
  }


  // ── Main layout with sidebar ──
  return (
    <div className="medics-shell min-h-screen flex flex-col bg-fx-bg font-fx" style={{ '--medics-accent': th.primary, '--medics-accent-soft': th.navActive } as React.CSSProperties}>
      <style>{`@keyframes _mspin { to { transform: rotate(360deg); } }`}</style>

      {/* ── TOP BAR ── */}
      <header className="medics-topbar sticky top-0 z-30 flex items-center gap-2 md:gap-3 h-16 px-4 md:px-6 bg-white/85 backdrop-blur-md border-b border-fx-border-soft">
        {/* Logo / center */}
        <div className="medics-topbar__logo flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="w-10 h-10 rounded-fx-md overflow-hidden flex items-center justify-center bg-white border border-fx-border-soft flex-shrink-0">
            {centerImageUrl ? (
              <img src={centerImageUrl} alt="Centro" crossOrigin="anonymous" className="w-full h-full object-contain" />
            ) : (
              <img src="/fluxia-logo.png" alt="Fluxia" className="w-3/4 object-contain" />
            )}
          </div>
          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold text-fx-text truncate">{doctorInfo?.center_name || 'Centro médico'}</span>
            <span className="text-xs text-fx-text-tertiary truncate">Dr. {doctorInfo?.name}</span>
          </div>
        </div>

        {/* Nav (desktop, centered) */}
        {!isMobile && (
          <nav className="medics-topbar__nav flex-1 flex items-center justify-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setSelectedPatient(null); setPatientDetail(null); }}
                  className="medics-topbar__nav-item flex items-center gap-2 px-4 h-10 rounded-fx-pill text-sm transition-colors"
                  style={active ? { backgroundColor: th.navActive, color: th.primary, fontWeight: 600 } : { color: 'var(--text-secondary)', fontWeight: 400 }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--fx-ink-100)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Account access */}
        <div className="medics-topbar__account relative flex items-center ml-auto flex-shrink-0">
          <button
            onClick={() => setAccountMenuOpen(o => !o)}
            className="medics-topbar__account-btn flex items-center gap-2 pl-2 pr-2 sm:pr-3 h-10 rounded-fx-pill hover:bg-fx-ink-100 transition-colors"
            aria-label="Cuenta"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: th.primary }}>
              {(doctorInfo?.name || 'D')[0].toUpperCase()}
            </div>
            {doctorInfo?.plan === 'pro' && (
              <span className="hidden sm:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-fx-pill bg-fx-warning-500 text-white">PRO</span>
            )}
            {doctorInfo?.plan === 'beta' && (
              <span className="hidden sm:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-fx-pill bg-fx-violet-400 text-white">BETA</span>
            )}
          </button>

          {accountMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAccountMenuOpen(false)} />
              <div className="medics-account-menu absolute right-0 top-full mt-2 w-64 bg-white rounded-fx-lg shadow-fx-lg border border-fx-border-soft p-2 z-40">
                <div className="medics-account-menu__header px-3 py-2 border-b border-fx-border-soft mb-1">
                  <div className="text-sm font-semibold text-fx-text truncate">Dr. {doctorInfo?.name}</div>
                  <div className="text-xs text-fx-text-tertiary truncate">{doctorInfo?.specialty || 'Médico'}</div>
                </div>
                {doctorInfo?.plan === 'free' && (
                  <button
                    onClick={() => { setShowUpgradeModal(true); setAccountMenuOpen(false); }}
                    className="medics-account-menu__upgrade w-full flex items-center gap-2 text-left px-3 py-2 rounded-fx-md text-sm font-semibold text-fx-warning-700 bg-fx-warning-50 hover:bg-fx-warning-100 mb-1"
                  >
                    ⭐ Pasar a Pro
                  </button>
                )}
                <button
                  onClick={() => { setSection('config'); setAccountMenuOpen(false); }}
                  className="medics-account-menu__item w-full flex items-center gap-2 text-left px-3 py-2 rounded-fx-md text-sm text-fx-text-secondary hover:bg-fx-ink-100"
                >
                  ⚙️ Configuración
                </button>
                <button
                  onClick={() => { openGuide(); setAccountMenuOpen(false); }}
                  className="medics-account-menu__item w-full flex items-center gap-2 text-left px-3 py-2 rounded-fx-md text-sm text-fx-text-secondary hover:bg-fx-ink-100"
                >
                  📖 Guía de uso
                </button>
                <button
                  onClick={() => { supabase.auth.signOut(); setLoggedIn(false); setDoctorInfo(null); }}
                  className="medics-account-menu__item w-full flex items-center gap-2 text-left px-3 py-2 rounded-fx-md text-sm text-fx-error-600 hover:bg-fx-error-50"
                >
                  🚪 Cerrar sesión
                </button>
                <div className="medics-account-menu__version px-3 pt-2 text-[10px] text-fx-text-tertiary">{APP_VERSION}</div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="medics-content flex-1 w-full mx-auto px-4 md:px-8 py-6 md:py-8 box-border" style={{ maxWidth: 'var(--medics-max-width)', paddingBottom: isMobile ? 88 : undefined }}>
        {loading && !detailLoading && <div className="text-center py-10 text-fx-text-secondary">Cargando...</div>}

        {/* ── INICIO / DASHBOARD ── */}
        {section === 'inicio' && (() => {
          const accepted = patients.filter(p => p.status === 'accepted');
          const pending = patients.filter(p => p.status === 'pending');
          const semCounts = accepted.reduce((acc, p) => { const k = getSemaforoKey(p); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
          const noDataWeek = accepted.filter(p => p.daysSinceLast === null || p.daysSinceLast >= 7).length;
          const attentionList = [...accepted].sort((a, b) => {
            const order: Record<string, number> = { red: 0, gray: 1, orange: 2, green: 3 };
            const ka = getSemaforoKey(a), kb = getSemaforoKey(b);
            if (ka !== kb) return order[ka] - order[kb];
            const da = a.daysSinceLast ?? 9999, db = b.daysSinceLast ?? 9999;
            return ka === 'green' ? da - db : db - da;
          }).slice(0, 7);
          const tile = (icon: string, value: string | number, label: string, bg: string, color: string, filter?: typeof semaforoFilter) => (
            <div key={label} onClick={filter !== undefined ? () => { setSemaforoFilter(filter); setSection('pacientes'); } : undefined}
              className={`medics-stat-tile flex-1 basis-[130px] rounded-fx-sm p-3.5 flex flex-col gap-1 ${filter !== undefined ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ backgroundColor: bg }}>
              <div className="text-[22px]">{icon}</div>
              <div className="text-[28px] font-black leading-none" style={{ color }}>{value}</div>
              <div className="text-[11px]" style={{ color, opacity: 0.75 }}>{label}{filter !== undefined ? ' ↗' : ''}</div>
            </div>
          );
          return (
            <div className="medics-inicio">
              <SectionHeader
                title={`Hola, Dr. ${doctorInfo?.name?.split(' ')[0] || ''} 👋`}
                subtitle={patientsLoading ? '\u00A0' : `${accepted.length} pacientes activos · ${pending.length} invitaciones pendientes`}
              />
              {patientsLoading ? (
                <div className="medics-inicio__loading flex justify-center items-center p-20">
                  <div className="w-10 h-10 rounded-full border-[3px] border-fx-ink-150" style={{ borderTopColor: th.dark, animation: '_mspin 0.75s linear infinite' }} />
                </div>
              ) : (<>
              {/* Stat tiles */}
              <div className="medics-stats flex gap-3 flex-wrap mb-4">
                {tile('👥', accepted.length, 'Pacientes activos', '#f0f4ff', '#3b82f6')}
                {tile('🟢', semCounts.green || 0, 'Al día', '#f0fdf4', '#16a34a', 'green')}
                {tile('🟠', semCounts.orange || 0, 'Atención', '#fffbeb', '#d97706', 'orange')}
                {tile('🔴', semCounts.red || 0, 'Inactivos', '#fff1f2', '#dc2626', 'red')}
                {tile('📅', noDataWeek, 'Sin reg. 7d', '#faf5ff', '#7c3aed', noDataWeek > 0 ? 'no7d' : undefined)}
                {pending.length > 0 && tile('⏳', pending.length, 'Invit. pendientes', '#f5f3ff', '#7c3aed')}
              </div>
              {/* Semáforo bar */}
              {accepted.length > 0 && (
                <div className="medics-semaforo-card bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft p-3.5 mb-4">
                  <div className="text-xs font-bold text-fx-text-secondary mb-2.5">Estado de la lista</div>
                  <div className="medics-semaforo-bar flex rounded-lg overflow-hidden h-3.5">
                    {(semCounts.green || 0) > 0 && <div style={{ flex: semCounts.green, backgroundColor: '#22c55e' }} title={`${semCounts.green} al día`} />}
                    {(semCounts.orange || 0) > 0 && <div style={{ flex: semCounts.orange, backgroundColor: '#f59e0b' }} title={`${semCounts.orange} atención`} />}
                    {(semCounts.red || 0) > 0 && <div style={{ flex: semCounts.red, backgroundColor: '#ef4444' }} title={`${semCounts.red} inactivos`} />}
                    {(semCounts.gray || 0) > 0 && <div style={{ flex: semCounts.gray, backgroundColor: '#e5e7eb' }} title={`${semCounts.gray} sin datos`} />}
                  </div>
                  <div className="medics-semaforo-legend flex gap-4 mt-2">
                    {[
                      { c: '#16a34a', label: `${semCounts.green || 0} al día` },
                      { c: '#d97706', label: `${semCounts.orange || 0} atención` },
                      { c: '#dc2626', label: `${semCounts.red || 0} inactivos` },
                      { c: '#9ca3af', label: `${semCounts.gray || 0} sin datos` },
                    ].map(({ c, label }) => (
                      <div key={label} className="flex items-center gap-[5px] text-[11px] text-fx-text-secondary">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Practice stats */}
              {practiceStats !== null && accepted.length > 0 && (
                <div className="medics-practice-stats bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft px-5 py-3.5 mb-4 flex gap-8 flex-wrap">
                  <div>
                    <div className="text-[10px] font-bold text-fx-text-tertiary tracking-wide mb-1">📝 REGISTROS ESTA SEMANA</div>
                    <div className="text-[28px] font-black text-fx-text leading-none">{practiceStats.thisWeekEntries}</div>
                    {practiceStats.lastWeekEntries > 0 && (
                      <div className="text-[11px] mt-[3px]" style={{ color: practiceStats.thisWeekEntries >= practiceStats.lastWeekEntries ? '#16a34a' : '#dc2626' }}>
                        {practiceStats.thisWeekEntries >= practiceStats.lastWeekEntries ? '↑' : '↓'} vs {practiceStats.lastWeekEntries} sem. anterior
                      </div>
                    )}
                  </div>
                  {practiceStats.thisWeekBristol !== null && (
                    <div>
                      <div className="text-[10px] font-bold text-fx-text-tertiary tracking-wide mb-1">🔬 BRISTOL MEDIO (7 DÍAS)</div>
                      <div className="flex items-baseline gap-1">
                        <div className="text-[28px] font-black text-fx-text leading-none">{practiceStats.thisWeekBristol.toFixed(1)}</div>
                        <div className="text-xs text-fx-text-tertiary">/ 7</div>
                      </div>
                      {practiceStats.lastWeekBristol !== null && (() => {
                        const curr = practiceStats.thisWeekBristol!;
                        const prev = practiceStats.lastWeekBristol!;
                        const improving = Math.abs(curr - 4) < Math.abs(prev - 4);
                        return (
                          <div className="text-[11px] mt-[3px]" style={{ color: improving ? '#16a34a' : '#dc2626' }}>
                            {improving ? '↑ mejorando' : '↓ empeorando'} vs sem. anterior
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
              {/* Proactive alerts */}
              {(() => {
                const noAct = accepted
                  .filter(p => p.daysSinceLast === null || p.daysSinceLast >= 10)
                  .sort((a, b) => (b.daysSinceLast ?? 999) - (a.daysSinceLast ?? 999))
                  .slice(0, 3)
                  .map(p => ({ p, msg: p.daysSinceLast === null ? 'Nunca ha registrado ninguna entrada' : `Sin registro hace ${p.daysSinceLast} días`, color: '#dc2626' }));
                const bristolItems = bristolAlerts.slice(0, 2).map(a => {
                  const p = accepted.find(pt => pt.patient_id === a.patientId);
                  if (!p) return null;
                  const dir = a.curr > 4 ? 'Bristol alto' : 'Bristol bajo';
                  return { p, msg: `📉 ${dir}: T${a.prev.toFixed(1)}→T${a.curr.toFixed(1)} esta semana`, color: '#d97706' };
                }).filter(Boolean) as { p: PatientLink; msg: string; color: string }[];
                const all = [...noAct, ...bristolItems].slice(0, 5);
                if (all.length === 0) return null;
                return (
                  <div className="medics-alerts bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft mb-4">
                    <div className="px-4 py-2.5 border-b border-fx-border-soft text-[13px] font-bold text-fx-text">🔔 Alertas proactivas</div>
                    {all.map(({ p, msg, color }, i) => (
                      <div key={p.id} onClick={() => { loadPatientDetail(p); setSection('pacientes'); }}
                        className={`medics-alerts__item flex items-center gap-3 px-4 py-2.5 cursor-pointer ${i < all.length - 1 ? 'border-b border-fx-border-soft' : ''}`}>
                        <div className="w-[3px] h-8 rounded flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-fx-text overflow-hidden text-ellipsis whitespace-nowrap">{patientLabel(p)}</div>
                          <div className="text-[11px]" style={{ color }}>{msg}</div>
                        </div>
                        <span className="text-xs text-fx-text-tertiary">›</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {/* Attention list */}
              {attentionList.length > 0 && (
                <div className="medics-attention-list bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                  <div className="px-4 py-2.5 border-b border-fx-border-soft text-[13px] font-bold text-fx-text flex justify-between items-center">
                    <span>⚠️ Requieren atención</span>
                    <button onClick={() => { setSemaforoFilter('all'); setSection('pacientes'); }}
                      className="text-[11px] text-fx-text-tertiary bg-transparent border-none cursor-pointer p-0">Ver todos →</button>
                  </div>
                  {attentionList.map((p, i) => {
                    const pG = p.semaforo_override ? (p.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1) : undefined;
                    const pR = p.semaforo_override ? (p.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3) : undefined;
                    const sem = getSemaforo(p.daysSinceLast, pG, pR);
                    return (
                      <div key={p.id} onClick={() => { loadPatientDetail(p); setSection('pacientes'); }}
                        className={`medics-attention-list__item flex items-center gap-3 px-4 py-[11px] cursor-pointer ${i < attentionList.length - 1 ? 'border-b border-fx-border-soft' : ''}`}>
                        <span className="text-lg">{sem.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-fx-text overflow-hidden text-ellipsis whitespace-nowrap">{patientLabel(p)}</div>
                          <div className="text-[11px] text-fx-text-tertiary">
                            {p.daysSinceLast === null ? 'Sin registros' : p.daysSinceLast === 0 ? 'Hoy' : p.daysSinceLast === 1 ? 'Ayer' : `hace ${p.daysSinceLast} días`}
                            {p.lastEntryDate && p.daysSinceLast !== null && ` · ${shortDate(p.lastEntryDate)}`}
                          </div>
                        </div>
                        {(p.tags || []).map(t => (
                          <span key={t} className="text-[10px] px-[7px] py-0.5 rounded-[20px] font-bold" style={{ backgroundColor: tagColor(t) + '20', color: tagColor(t) }}>{t}</span>
                        ))}
                        <span className="text-xs text-fx-text-tertiary">›</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {accepted.length === 0 && (
                <div className="medics-empty-state bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft p-8 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <div className="text-[15px] font-bold text-fx-text mb-2">Aún no tienes pacientes</div>
                  <div className="text-[13px] text-fx-text-tertiary mb-5">Invita a tu primer paciente para empezar el seguimiento.</div>
                  <button onClick={() => setSection('invitar')} className="w-full px-6 py-2.5 rounded-fx-pill text-white font-semibold text-[15px] border-none cursor-pointer font-fx" style={{ backgroundColor: th.dark }}>
                    + Invitar paciente
                  </button>
                </div>
              )}
              </>)}
            </div>
          );
        })()}

        {/* ── PACIENTES ── */}
        {section === 'pacientes' && !selectedPatient && (
          <div className="medics-pacientes">
            <SectionHeader
              title="Mis Pacientes"
              subtitle={`${acceptedPatients.length} pacientes vinculados · ${pendingPatients.length} pendientes`}
              actions={<button onClick={loadPatients} className="medics-section-header__refresh px-4 py-2 rounded-fx-pill border border-fx-border bg-fx-surface text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 text-fx-text font-fx">{'\u{1F504}'} Actualizar</button>}
            />
            <div className="medics-pacientes__card bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
              {/* Semáforo quick-filter pills */}
              {(() => {
                const acc = patients.filter(p => p.status === 'accepted');
                const sc = acc.reduce((a, p) => { const k = getSemaforoKey(p); a[k] = (a[k] || 0) + 1; return a; }, {} as Record<string, number>);
                const no7d = acc.filter(p => p.daysSinceLast === null || p.daysSinceLast >= 7).length;
                const g = doctorInfo?.semaforo_green ?? 1, r = doctorInfo?.semaforo_red ?? 3;
                const pills: { key: typeof semaforoFilter; icon: string; label: string; desc: string; count: number; color: string }[] = [
                  { key: 'all',    icon: '👥', label: 'Todos',        desc: 'Todos los pacientes vinculados',                                          count: acc.length,     color: '#333' },
                  { key: 'green',  icon: '🟢', label: 'Al día',       desc: `Último registro hace ≤ ${g} día${g === 1 ? '' : 's'}`,                   count: sc.green || 0,  color: '#16a34a' },
                  { key: 'orange', icon: '🟠', label: 'Atención',     desc: `Último registro hace ${g + 1}–${r} días`,                                count: sc.orange || 0, color: '#d97706' },
                  { key: 'red',    icon: '🔴', label: 'Inactivos',    desc: `Sin registrar hace más de ${r} días`,                                    count: sc.red || 0,    color: '#dc2626' },
                  { key: 'gray',   icon: '⚪', label: 'Sin datos',    desc: 'Nunca han registrado ninguna entrada',                                   count: sc.gray || 0,   color: '#9ca3af' },
                  { key: 'no7d',   icon: '📅', label: 'Sin reg. 7d', desc: 'Sin ningún registro en los últimos 7 días (incluye sin datos)',           count: no7d,           color: '#7c3aed' },
                ];
                const activePill = pills.find(p => p.key === semaforoFilter);
                const tooltipContent: React.CSSProperties = {
                  backgroundColor: '#1c1c1e', color: '#fff', borderRadius: 10, padding: '8px 12px',
                  fontSize: 12, lineHeight: 1.45, maxWidth: 230, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  zIndex: 9999,
                };
                return (
                  <div className="medics-pacientes__pills border-b border-fx-border-soft">
                    <RadixTooltip.Provider delayDuration={250} skipDelayDuration={100}>
                      <div className="flex gap-1.5 px-4 py-2.5 flex-wrap">
                        {pills.map(({ key, icon, label, desc, count, color }) => {
                          const active = semaforoFilter === key;
                          return (
                            <RadixTooltip.Root key={key}>
                              <RadixTooltip.Trigger asChild>
                                <button onClick={() => setSemaforoFilter(key)}
                                  className="medics-pacientes__pill flex items-center gap-1 text-[11px] px-2.5 py-[3px] rounded-[20px] cursor-pointer"
                                  style={{
                                    border: active ? `1.5px solid ${color}` : '1.5px solid transparent',
                                    backgroundColor: active ? color + '18' : '#00000008',
                                    color: active ? color : '#666', fontWeight: active ? 700 : 500,
                                  }}>
                                  {icon} {label} <span style={{ opacity: 0.7 }}>{count}</span>
                                </button>
                              </RadixTooltip.Trigger>
                              <RadixTooltip.Portal>
                                <RadixTooltip.Content side="top" sideOffset={6} style={tooltipContent}>
                                  <div style={{ fontWeight: 600, marginBottom: 3 }}>{icon} {label}</div>
                                  <div style={{ opacity: 0.8 }}>{desc}</div>
                                  <RadixTooltip.Arrow style={{ fill: '#1c1c1e' }} />
                                </RadixTooltip.Content>
                              </RadixTooltip.Portal>
                            </RadixTooltip.Root>
                          );
                        })}
                      </div>
                    </RadixTooltip.Provider>
                    {activePill && activePill.key !== 'all' && (
                      <div className="px-4 pb-2 text-[11px] text-fx-text-tertiary italic">
                        {activePill.icon} {activePill.desc}
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Tag filter bar */}
              {globalTags.length > 0 && (
                <div className="medics-pacientes__tag-filters flex gap-1.5 px-4 py-2 flex-wrap border-b border-fx-border-soft bg-fx-surface-2">
                  <span className="text-[10px] font-bold text-fx-text-tertiary self-center mr-0.5">FILTRAR:</span>
                  <button onClick={() => setTagFilter(null)} className="text-[11px] px-2.5 py-0.5 rounded-[20px] border-none cursor-pointer font-semibold" style={{
                    backgroundColor: tagFilter === null ? '#333' : '#00000010',
                    color: tagFilter === null ? '#fff' : '#555',
                  }}>Todos</button>
                  {globalTags.map(t => (
                    <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className="text-[11px] px-2.5 py-0.5 rounded-[20px] border-none cursor-pointer font-semibold" style={{
                      backgroundColor: tagFilter === t ? tagColor(t) : tagColor(t) + '20',
                      color: tagFilter === t ? '#fff' : tagColor(t),
                    }}>{t}</button>
                  ))}
                </div>
              )}
              {/* Sort controls + Search */}
              <div className="medics-pacientes__toolbar flex items-center px-5 py-2.5 bg-fx-surface-2 gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-fx-text-tertiary">Ordenar por:</span>
                {(['estado', 'nombre'] as const).map(opt => (
                  <button key={opt} onClick={() => setSortBy(opt)} className="text-[11px] font-semibold px-2.5 py-[3px] rounded-xl border-none cursor-pointer" style={{
                    backgroundColor: sortBy === opt ? th.dark : '#00000010',
                    color: sortBy === opt ? '#fff' : '#666',
                  }}>
                    {opt === 'estado' ? 'Estado' : 'Nombre'}
                  </button>
                ))}
                <div className="flex-1 min-w-[140px] ml-2">
                  <input
                    type="text"
                    placeholder="🔍 Buscar paciente…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="medics-pacientes__search w-full px-2.5 py-1 rounded-xl border border-fx-border text-xs outline-none box-border bg-fx-surface"
                  />
                </div>
              </div>
              <div className="flex px-4 py-2 text-[11px] font-bold text-fx-text-tertiary uppercase border-b border-fx-border-soft">
                <span className="w-10"></span>
                <span className="flex-[2]">Paciente</span>
                {!isMobile && <span className="flex-1">Último registro / Código</span>}
                {!isMobile && <span className="w-11 text-center">🔔</span>}
                <span style={{ width: isMobile ? 90 : 140 }}>Estado</span>
              </div>
              {patientsLoading ? (
                <div className="p-10 text-center text-fx-text-tertiary text-sm">
                  Cargando pacientes…
                </div>
              ) : patients.length === 0 ? (
                <div className="p-10 text-center text-fx-text-tertiary text-sm">
                  No hay pacientes. Invita a tu primer paciente desde la sección "Invitar Paciente".
                </div>
              ) : (() => {
                const q = searchQuery.trim().toLowerCase();
                const displayed = [...patients]
                  .filter(p => {
                    if (q && !patientLabel(p).toLowerCase().includes(q) && !(p.patient_email || '').toLowerCase().includes(q)) return false;
                    if (tagFilter && !(p.tags || []).includes(tagFilter)) return false;
                    if (semaforoFilter === 'no7d') return p.status === 'accepted' && (p.daysSinceLast === null || p.daysSinceLast >= 7);
                    if (semaforoFilter !== 'all') return p.status === 'accepted' && getSemaforoKey(p) === semaforoFilter;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'estado') {
                      if (a.status === b.status) return patientLabel(a).localeCompare(patientLabel(b));
                      return a.status === 'accepted' ? -1 : 1;
                    }
                    return patientLabel(a).localeCompare(patientLabel(b));
                  });
                if (displayed.length === 0) {
                  const filterLabels: Record<string, string> = { green: 'Al día', orange: 'Atención', red: 'Inactivos', gray: 'Sin datos', no7d: 'Sin reg. 7d' };
                  const what = q ? `"${q}"` : semaforoFilter !== 'all' ? `"${filterLabels[semaforoFilter] || semaforoFilter}"` : null;
                  return (
                    <div className="p-10 text-center text-fx-text-tertiary text-sm">
                      Sin resultados{what ? ` para ${what}` : ''}
                    </div>
                  );
                }
                return displayed.map((patient, i) => {
                  const isAccepted = patient.status === 'accepted';
                  const pGreen = patient.semaforo_override ? (patient.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1) : undefined;
                  const pRed = patient.semaforo_override ? (patient.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3) : undefined;
                  const semaforo = getSemaforo(patient.daysSinceLast, pGreen, pRed);
                  return (
                    <div key={patient.id} onClick={() => isAccepted && loadPatientDetail(patient)}
                      className={`medics-pacientes__row flex items-center ${i < displayed.length - 1 ? 'border-b border-fx-border-soft' : ''} ${isAccepted ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ padding: isMobile ? '12px 16px' : '14px 20px' }}>
                      {/* Semáforo */}
                      <div className="w-10">
                        {isAccepted ? (
                          <span className="text-lg">{semaforo.icon}</span>
                        ) : (
                          <span className="text-xs text-fx-text-tertiary">—</span>
                        )}
                      </div>
                      {/* Patient name */}
                      <div className="flex-[2] flex items-center gap-2 min-w-0">
                        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: isAccepted ? th.primary : th.dark }}>
                          {patientInitial(patient)}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-fx-text overflow-hidden text-ellipsis whitespace-nowrap ${isMobile ? 'text-[13px]' : 'text-sm'}`}>
                            {patientLabel(patient)}
                          </div>
                          {!isMobile && patient.display_name && patient.patient_email && (
                            <div className="text-[11px] text-fx-text-tertiary">{patient.patient_email}</div>
                          )}
                          {(patient.tags || []).length > 0 && (
                            <div className="flex gap-1 mt-[3px] flex-wrap">
                              {(patient.tags || []).map(t => (
                                <span key={t} className="text-[10px] px-1.5 py-px rounded-[20px] font-bold" style={{ backgroundColor: tagColor(t) + '20', color: tagColor(t) }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Last entry / invite code — hidden on mobile */}
                      {!isMobile && <div className="flex-1">
                        {isAccepted && patient.lastEntryDate ? (
                          <div>
                            <div className="text-[13px] font-semibold text-fx-text">
                              {patient.daysSinceLast === 0 ? 'Hoy' : `hace ${patient.daysSinceLast} día${patient.daysSinceLast !== 1 ? 's' : ''}`}
                            </div>
                            <div className="text-[11px] text-fx-text-tertiary">{shortDate(patient.lastEntryDate)}</div>
                          </div>
                        ) : isAccepted ? (
                          <span className="text-xs text-fx-text-tertiary">Sin registros</span>
                        ) : (
                          <span className="text-xs text-fx-text-tertiary italic">
                            Invitación pendiente
                          </span>
                        )}
                      </div>}
                      {/* Push notification status — hidden on mobile */}
                      {!isMobile && <div className="w-11 text-center text-base">
                        {isAccepted && patient.hasPushSub === true && <span title="Notificaciones activas">🔔</span>}
                        {isAccepted && patient.hasPushSub === false && <span title="Sin notificaciones" className="opacity-30">🔕</span>}
                        {isAccepted && patient.hasPushSub === null && <span title="Sin datos" className="opacity-20 text-xs">—</span>}
                      </div>}
                      {/* Status badge + actions */}
                      <div className="flex items-center gap-1.5" style={{ width: isMobile ? 90 : 140 }}>
                        <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-xl" style={{
                          backgroundColor: isAccepted ? '#2ecc7130' : '#f39c1230',
                          color: isAccepted ? '#27ae60' : '#e67e22',
                        }}>
                          {isAccepted ? (isMobile ? '✅' : '✅ Vinculado') : (isMobile ? '⏳' : '⏳ Pendiente')}
                        </span>
                        {!isAccepted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRevokeInvite(patient); }}
                            title="Eliminar invitación"
                            className="medics-pacientes__revoke bg-transparent border-none cursor-pointer text-sm text-fx-ink-300 px-1 py-0.5 rounded"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#e74c3c')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ── PATIENT DETAIL ── */}
        {section === 'pacientes' && selectedPatient && detailLoading && (
          <div className="medics-detail__loading flex justify-center items-center min-h-[300px]">
            <div className="w-11 h-11 rounded-full border-[3px] border-fx-ink-150" style={{ borderTopColor: th.dark, animation: '_mspin 0.75s linear infinite' }} />
          </div>
        )}
        {section === 'pacientes' && selectedPatient && patientDetail && !detailLoading && (
          <div className="medics-patient-detail">
            <SectionHeader
              title={
                <span className="inline-flex items-center gap-2.5">
                  {patientLabel(selectedPatient)}
                  {selectedPatient.hasPushSub === true && (
                    <span title="Notificaciones activas" className="text-lg leading-none">🔔</span>
                  )}
                  {selectedPatient.hasPushSub === false && (
                    <span title="Sin notificaciones" className="text-lg leading-none opacity-35">🔕</span>
                  )}
                </span>
              }
              subtitle={`${selectedPatient.display_name && selectedPatient.patient_email ? selectedPatient.patient_email + ' · ' : ''}Vinculado ${selectedPatient.accepted_at ? shortDate(selectedPatient.accepted_at) : ''}`}
              actions={
                <div className="flex gap-2">
                  <button onClick={() => exportPatientPDF(selectedPatient, patientDetail, doctorInfo)} className="medics-section-header__action px-4 py-2 rounded-fx-pill text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 text-white font-fx border border-fx-border" style={{ backgroundColor: th.dark }}>
                    📄 Exportar PDF
                  </button>
                  <button onClick={() => setPatientConfigOpen(true)} className="medics-section-header__action px-4 py-2 rounded-fx-pill text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 text-white font-fx border border-fx-border" style={{ backgroundColor: th.navActive }}>
                    ⚙️ Configuración
                  </button>
                  <button onClick={() => { setSelectedPatient(null); setPatientDetail(null); }} className="medics-section-header__action px-4 py-2 rounded-fx-pill border border-fx-border bg-fx-surface text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 text-fx-text font-fx">
                    ← Volver
                  </button>
                </div>
              }
            />

            {/* Row 1: Semáforo — all inline */}
            <div className="medics-patient-detail__semaforo bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft px-4 py-3 flex items-center gap-2.5 flex-wrap">
              <span className="text-[28px]">{getSemaforo(patientDetail.daysSinceLast, effectiveGreen, effectiveRed).icon}</span>
              <span className="text-[15px] font-bold text-fx-text">
                {patientDetail.daysSinceLast === null
                  ? 'Sin registros'
                  : patientDetail.daysSinceLast === 0
                    ? 'Último registro: hoy'
                    : `Hace ${patientDetail.daysSinceLast} día${patientDetail.daysSinceLast !== 1 ? 's' : ''}`}
              </span>
              {patientDetail.lastEntryDate && (
                <span className="text-xs text-fx-text-tertiary">· {shortDate(patientDetail.lastEntryDate)}</span>
              )}
              {patientDetail.daysSinceLast !== null && patientDetail.daysSinceLast > 3 && (
                <span className="text-[11px] font-semibold ml-1" style={{ color: '#c0392b' }}>⚠️ Varios días sin registrar</span>
              )}
            </div>

            {/* Tags bar — global catalog, click to assign/unassign, input to create new */}
            <div className="medics-patient-detail__tags bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft px-4 py-2.5">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[11px] font-bold text-fx-text-tertiary whitespace-nowrap">🏷️ ETIQUETAS</span>
                {(patientTagsSaving || globalTagsSaving) && <span className="text-[10px] text-fx-ink-300">Guardando…</span>}
              </div>
              {globalTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {globalTags.map(t => {
                    const assigned = patientTagsDraft.includes(t);
                    return (
                      <button key={t}
                        onClick={() => assigned
                          ? savePatientTags(patientTagsDraft.filter(x => x !== t))
                          : savePatientTags([...patientTagsDraft, t])
                        }
                        title={assigned ? `Quitar "${t}"` : `Asignar "${t}"`}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-[3px] rounded-[20px] cursor-pointer transition-all duration-150"
                        style={{
                          border: assigned ? 'none' : `1px solid ${tagColor(t)}40`,
                          backgroundColor: assigned ? tagColor(t) + '22' : 'transparent',
                          color: assigned ? tagColor(t) : '#bbb',
                          fontWeight: assigned ? 700 : 400,
                        }}>
                        {assigned && <span className="text-[9px] leading-none">✓</span>}
                        {t}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-fx-ink-300 mb-2 italic">
                  Sin etiquetas. Créalas desde Configuración o escribe una nueva abajo.
                </p>
              )}
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const v = newTagInput.trim();
                  if (!v) return;
                  setNewTagInput('');
                  const isNew = !globalTags.includes(v);
                  if (isNew) {
                    const newGlobal = [...globalTags, v];
                    setGlobalTagsSaving(true);
                    setGlobalTags(newGlobal);
                    setDoctorInfo(prev => prev ? { ...prev, global_tags: newGlobal } : prev);
                    await supabase.from('doctors').update({ global_tags: newGlobal }).eq('id', doctorInfo!.id);
                    setGlobalTagsSaving(false);
                  }
                  if (!patientTagsDraft.includes(v)) savePatientTags([...patientTagsDraft, v]);
                }}
                className="flex gap-1.5 items-center">
                <input value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
                  placeholder="Nueva etiqueta global…"
                  className="px-2.5 py-1 rounded-[20px] border border-fx-border text-[11px] outline-none flex-1 min-w-0" />
                <button type="submit"
                  className="px-3 py-1 rounded-[20px] border-none bg-fx-surface-2 text-[11px] text-fx-text-secondary cursor-pointer font-semibold whitespace-nowrap">
                  Crear y asignar
                </button>
              </form>
            </div>

            {/* Row 2: Left column (calendar + stats) + Right column (entries) */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' as const : 'row' as const, gap: 16, alignItems: 'flex-start' }}>
              {/* Left column: calendar + semáforo override */}
              <div className="medics-patient-detail__sidebar flex flex-col gap-4" style={{ flex: isMobile ? undefined : '0 0 max(25%, 315px)', width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 315 }}>
              <div className="medics-patient-detail__calendar bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                <div className="px-4 py-2.5 border-b border-fx-border-soft flex justify-between items-center">
                  <button onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                    else setCalendarMonth(calendarMonth - 1);
                  }} className="bg-transparent border-none text-lg cursor-pointer px-2.5 py-1 text-fx-text-secondary">←</button>
                  <span className="text-[13px] font-bold text-fx-text capitalize">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                    else setCalendarMonth(calendarMonth + 1);
                  }} className="bg-transparent border-none text-lg cursor-pointer px-2.5 py-1 text-fx-text-secondary">→</button>
                </div>
                <div style={{ padding: isMobile ? '10px 12px' : '6px 8px' }}>
                  <div className="grid grid-cols-7" style={{ gap: isMobile ? 4 : 2, marginBottom: isMobile ? 4 : 2 }}>
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} className="text-center font-bold text-fx-text-tertiary pb-0.5" style={{ fontSize: isMobile ? 11 : 8 }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7" style={{ gap: isMobile ? 4 : 2 }}>
                    {(() => {
                      const firstDay = new Date(calendarYear, calendarMonth, 1);
                      const startDay = (firstDay.getDay() + 6) % 7;
                      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                      const entriesByDate = new Map<string, number>();
                      patientDetail.entries.forEach(e => {
                        const [y, m] = e.date.split('-').map(Number);
                        if (y === calendarYear && m === calendarMonth + 1) {
                          entriesByDate.set(e.date, (entriesByDate.get(e.date) || 0) + 1);
                        }
                      });

                      const cells: React.ReactNode[] = [];
                      for (let i = 0; i < startDay; i++) {
                        cells.push(<div key={`empty-${i}`} />);
                      }
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const count = entriesByDate.get(dateStr) || 0;
                        const isToday = dateStr === todayStr;
                        const isFuture = new Date(dateStr) > today;
                        const hasEntry = count > 0;

                        cells.push(
                          <div key={dateStr} title={`${dateStr}: ${count} registros`} className="flex items-center justify-center" style={{
                            aspectRatio: '1',
                            borderRadius: isMobile ? 6 : 4,
                            backgroundColor: hasEntry ? th.primary : isToday ? `${th.primary}20` : 'transparent',
                            opacity: isFuture ? 0.3 : 1,
                            border: isToday ? `1px solid ${th.primary}` : '1px solid #00000008',
                          }}>
                            <span className="font-semibold" style={{ fontSize: isMobile ? 12 : 9, color: hasEntry ? '#fff' : '#888' }}>{day}</span>
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              </div>

              {/* Stats + Charts card */}
              <div className="medics-patient-detail__stats bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                <div className="px-3.5 py-2 border-b border-fx-border-soft text-xs font-bold text-fx-text">
                  📊 Estadísticas
                </div>
                <div className="px-3.5 py-2.5 flex flex-col gap-3">
                  {/* 3 compact stats + trend */}
                  {(() => {
                    const bVals = patientDetail.entries
                      .filter(e => e.entry_type === 'poop' && e.bristol != null)
                      .map(e => e.bristol!).slice(0, 10);
                    let trend: 'up' | 'down' | 'stable' | null = null;
                    if (bVals.length >= 6) {
                      const recentAvg = bVals.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
                      const olderAvg = bVals.slice(5, 10).reduce((a, b) => a + b, 0) / bVals.slice(5).length;
                      const rDist = Math.abs(recentAvg - 4), oDist = Math.abs(olderAvg - 4);
                      trend = rDist < oDist - 0.4 ? 'up' : rDist > oDist + 0.4 ? 'down' : 'stable';
                    }
                    const trendCfg = trend === 'up'
                      ? { label: '📈 Mejorando', bg: '#f0fdf4', color: '#16a34a' }
                      : trend === 'down'
                      ? { label: '📉 Empeorando', bg: '#fff1f2', color: '#dc2626' }
                      : trend === 'stable'
                      ? { label: '➡️ Estable', bg: '#f8fafc', color: '#64748b' }
                      : null;
                    return (
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { label: 'Registros', value: patientDetail.totalEntries },
                          { label: 'Bristol medio', value: patientDetail.bristolAvg != null ? patientDetail.bristolAvg.toFixed(1) : '—' },
                          { label: 'Días sin reg.', value: patientDetail.daysSinceLast ?? '—' },
                        ].map(st => (
                          <div key={st.label} className="flex-1 text-center rounded-lg py-1.5 px-1" style={{ backgroundColor: '#00000005' }}>
                            <div className="text-[17px] font-black text-fx-text leading-none">{st.value}</div>
                            <div className="text-[9px] text-fx-text-tertiary mt-[3px]">{st.label}</div>
                          </div>
                        ))}
                        {trendCfg && (
                          <div className="rounded-lg py-[5px] px-2 text-center" style={{ flexBasis: '100%', backgroundColor: trendCfg.bg }}>
                            <span className="text-[11px] font-bold" style={{ color: trendCfg.color }}>{trendCfg.label}</span>
                            <span className="text-[9px] text-fx-text-tertiary ml-1.5">últimas 10 deposiciones</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Bristol trend chart */}
                  <div>
                    <div className="text-[9px] font-extrabold text-fx-ink-300 tracking-wide mb-1">TENDENCIA BRISTOL (últimas 30 deposiciones)</div>
                    {(() => {
                      const bColor = (b: number) => b >= 3 && b <= 5 ? '#27ae60' : b < 3 ? '#f39c12' : '#e74c3c';
                      const data = patientDetail.entries
                        .filter(e => e.entry_type === 'poop' && e.bristol != null)
                        .slice(0, 30).reverse();
                      if (data.length < 2) return (
                        <div className="text-[11px] text-fx-ink-300 py-2.5 text-center">Sin suficientes datos de Bristol</div>
                      );
                      const W = 360, H = 120;
                      const XL = 24, XR = 52, YT = 10, YB = 8;
                      const CW = W - XL - XR;
                      const CH = H - YT - YB;
                      const xOf = (i: number) => XL + (data.length > 1 ? (i * CW) / (data.length - 1) : CW / 2);
                      const yOf = (b: number) => YT + ((7 - b) / 6) * CH;
                      const pts = data.map((e, i) => ({ x: xOf(i), y: yOf(e.bristol!), b: e.bristol!, date: shortDate(e.date) }));
                      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px] block overflow-visible">
                          {/* Zone backgrounds */}
                          <rect x={XL} y={yOf(7)} width={CW} height={yOf(5) - yOf(7)} fill="#e74c3c08" />
                          <rect x={XL} y={yOf(5)} width={CW} height={yOf(3) - yOf(5)} fill="#2ecc7110" />
                          <rect x={XL} y={yOf(3)} width={CW} height={yOf(1) - yOf(3)} fill="#f39c1208" />
                          {/* Zone boundary lines */}
                          {[3, 5].map(b => (
                            <line key={b} x1={XL} y1={yOf(b)} x2={XL + CW} y2={yOf(b)}
                              stroke="#00000018" strokeWidth={0.6} strokeDasharray="3,2" />
                          ))}
                          {/* Y-axis labels */}
                          {[1, 2, 3, 4, 5, 6, 7].map(b => (
                            <text key={b} x={XL - 3} y={yOf(b) + 3.5}
                              textAnchor="end" fontSize={7}
                              fill={b === 4 ? '#888' : '#ccc'}
                              fontWeight={b === 4 ? 700 : 400}>T{b}</text>
                          ))}
                          {/* Zone labels (right side) */}
                          <text x={XL + CW + 4} y={yOf(6) + 3.5} fontSize={7} fill="#e74c3c99">Suelto</text>
                          <text x={XL + CW + 4} y={yOf(4) + 3.5} fontSize={7} fill="#27ae6099" fontWeight={700}>Normal</text>
                          <text x={XL + CW + 4} y={yOf(1.5) + 3.5} fontSize={7} fill="#f39c1299">Duro</text>
                          {/* Trend line */}
                          <path d={pathD} fill="none" stroke="#33333328" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                          {/* Dots + hit areas */}
                          {pts.map((p, i) => (
                            <g key={i}>
                              {/* Transparent hit area */}
                              <circle cx={p.x} cy={p.y} r={9} fill="transparent" className="cursor-crosshair"
                                onMouseEnter={() => setBristolHover({ idx: i, b: p.b, date: p.date, svgX: p.x, svgY: p.y })}
                                onMouseLeave={() => setBristolHover(null)} />
                              {/* Visible dot */}
                              <circle cx={p.x} cy={p.y}
                                r={bristolHover?.idx === i ? 5 : 3.5}
                                fill={bColor(p.b)}
                                stroke="white" strokeWidth={bristolHover?.idx === i ? 1.5 : 0}
                                className="pointer-events-none" />
                            </g>
                          ))}
                          {/* Tooltip */}
                          {bristolHover && (() => {
                            const tipW = 86, tipH = 36;
                            const tx = bristolHover.svgX + tipW + 14 > W
                              ? bristolHover.svgX - tipW - 6
                              : bristolHover.svgX + 10;
                            const ty = Math.max(YT, Math.min(bristolHover.svgY - tipH / 2, H - YB - tipH));
                            const bc = bColor(bristolHover.b);
                            return (
                              <g className="pointer-events-none">
                                <rect x={tx} y={ty} width={tipW} height={tipH} rx={4}
                                  fill="white" stroke="#e0e0e0" strokeWidth={0.8} />
                                <rect x={tx} y={ty} width={4} height={tipH} rx={2} fill={bc} />
                                <text x={tx + 9} y={ty + 12} fontSize={10} fontWeight={700} fill={bc}>T{bristolHover.b}</text>
                                <text x={tx + 9} y={ty + 23} fontSize={8} fill="#555">{BRISTOL_LABEL[bristolHover.b]}</text>
                                <text x={tx + 9} y={ty + 33} fontSize={7} fill="#aaa">{bristolHover.date}</text>
                              </g>
                            );
                          })()}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* Weekly bars */}
                  <div>
                    <div className="text-[9px] font-extrabold text-fx-ink-300 tracking-wide mb-1">FRECUENCIA SEMANAL (8 semanas)</div>
                    {(() => {
                      const now = new Date();
                      const weeks = Array.from({ length: 8 }, (_, w) => {
                        const end = new Date(now); end.setDate(now.getDate() - w * 7);
                        const start = new Date(end); start.setDate(end.getDate() - 7);
                        return {
                          label: w === 0 ? 'Hoy' : w === 1 ? '-1s' : `-${w}s`,
                          count: patientDetail.entries.filter(en =>
                            en.date >= start.toISOString().slice(0, 10) && en.date < end.toISOString().slice(0, 10)
                          ).length,
                        };
                      }).reverse();
                      const maxC = Math.max(...weeks.map(w => w.count), 1);
                      const W2 = 310, H2 = 69, BW = 28, GAP = 7;
                      const total = weeks.length * (BW + GAP) - GAP;
                      const ox = (W2 - total) / 2;
                      return (
                        <svg viewBox={`0 0 ${W2} ${H2}`} className="w-full h-24 block overflow-visible">
                          {weeks.map((wk, i) => {
                            const bh = Math.max((wk.count / maxC) * (H2 - 18), wk.count > 0 ? 4 : 0);
                            const x = ox + i * (BW + GAP);
                            const y = H2 - 12 - bh;
                            return (
                              <g key={i}>
                                <rect x={x} y={H2 - 12 - (H2 - 18)} width={BW} height={H2 - 18} rx={3} fill="#00000005" />
                                <rect x={x} y={y} width={BW} height={bh} rx={3}
                                  fill={wk.count > 0 ? '#27ae60' : '#e0e0e0'}
                                  opacity={wk.count > 0 ? 0.7 : 0.2} />
                                {wk.count > 0 && (
                                  <text x={x + BW / 2} y={y - 2} textAnchor="middle" fontSize={8} fill="#555" fontWeight={600}>{wk.count}</text>
                                )}
                                <text x={x + BW / 2} y={H2 - 1} textAnchor="middle" fontSize={7} fill="#bbb">{wk.label}</text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* Top symptoms */}
                  {(() => {
                    const symCount: Record<string, number> = {};
                    patientDetail.entries.forEach(e => e.symptoms.forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
                    const top = Object.entries(symCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
                    if (top.length === 0) return null;
                    return (
                      <div>
                        <div className="text-[9px] font-extrabold text-fx-ink-300 tracking-wide mb-1.5">SÍNTOMAS MÁS FRECUENTES</div>
                        <div className="flex gap-1 flex-wrap">
                          {top.map(([sym, count]) => (
                            <span key={sym} className="text-[11px] px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: '#e74c3c0e', color: '#c0392b' }}>
                              {SYMPTOM_LABEL[sym] || sym} <span className="font-normal opacity-55">×{count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Clinical notes card */}
              <div className="medics-patient-detail__notes bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                <div className="px-4 py-2.5 border-b border-fx-border-soft text-[13px] font-bold text-fx-text">
                  📝 Notas clínicas
                </div>
                <div className="px-4 py-3 flex flex-col gap-2">
                  <textarea
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    placeholder="Observaciones, diagnóstico, próxima cita…"
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-[10px] border border-fx-border text-[13px] text-fx-text-secondary resize-y font-sans leading-relaxed box-border outline-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="w-full py-2 rounded-fx-pill text-white text-[13px] font-semibold border-none cursor-pointer font-fx"
                    style={{ backgroundColor: th.dark, opacity: notesSaving ? 0.5 : 1 }}
                  >
                    {notesSaving ? 'Guardando…' : 'Guardar nota'}
                  </button>
                </div>
              </div>

              </div>{/* end left column */}

              {/* Right column: entry list */}
              {(() => {
                const filteredEntries = patientDetail.entries.filter(e => {
                  if (entryFilterFrom && e.date < entryFilterFrom) return false;
                  if (entryFilterTo && e.date > entryFilterTo) return false;
                  return true;
                });
                const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
                const pagedEntries = filteredEntries.slice(entryPage * ENTRIES_PER_PAGE, (entryPage + 1) * ENTRIES_PER_PAGE);
                const hasFilter = entryFilterFrom || entryFilterTo;

                return (
                  <div className="medics-patient-detail__entries bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft flex-1 min-w-0 box-border" style={{ width: isMobile ? '100%' : undefined }}>
                    {/* Header + filter bar */}
                    <div className="px-4 py-3 border-b border-fx-border-soft">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[15px] font-bold text-fx-text">
                          Historial
                          {hasFilter
                            ? ` (${filteredEntries.length} de ${patientDetail.totalEntries})`
                            : ` (${patientDetail.totalEntries})`}
                        </span>
                        {hasFilter && (
                          <button onClick={() => { setEntryFilterFrom(''); setEntryFilterTo(''); setEntryPage(0); }}
                            className="text-[11px] bg-transparent border-none cursor-pointer font-semibold" style={{ color: '#e74c3c' }}>
                            ✕ Limpiar filtro
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-[11px] font-semibold text-fx-text-tertiary">De</span>
                        <input type="date" value={entryFilterFrom}
                          onChange={(e) => { setEntryFilterFrom(e.target.value); setEntryPage(0); }}
                          className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary" />
                        <span className="text-[11px] font-semibold text-fx-text-tertiary">a</span>
                        <input type="date" value={entryFilterTo}
                          onChange={(e) => { setEntryFilterTo(e.target.value); setEntryPage(0); }}
                          className="text-xs px-2 py-1 rounded-md border border-fx-border text-fx-text-secondary" />
                      </div>
                    </div>

                    {filteredEntries.length === 0 ? (
                      <div className="p-10 text-center text-fx-text-tertiary text-sm">
                        {hasFilter ? 'No hay registros en ese rango de fechas.' : 'Este paciente no tiene registros aún.'}
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {/* Header row */}
                        <div className="flex items-center px-4 py-[7px] border-b border-fx-border-soft" style={{ backgroundColor: '#00000008' }}>
                          <span className="w-8 text-[10px] font-bold text-fx-text-tertiary uppercase"></span>
                          <span className="w-[130px] text-[10px] font-bold text-fx-text-tertiary uppercase">Fecha / Hora</span>
                          <span className="flex-1 text-[10px] font-bold text-fx-text-tertiary uppercase">Datos</span>
                        </div>
                        {pagedEntries.map((entry, i) => {
                          const isUrine = entry.entry_type === 'urine';
                          const bristolColor = entry.bristol == null ? null : entry.bristol >= 3 && entry.bristol <= 5 ? '#27ae60' : entry.bristol < 3 ? '#f39c12' : '#e74c3c';
                          const chip = (label: string, bg: string, color: string) => (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap" style={{ backgroundColor: bg, color }}>{label}</span>
                          );
                          return (
                            <div key={entry.entry_id || i} className={i < pagedEntries.length - 1 ? 'border-b border-fx-border-soft' : ''}>
                              <div className="flex items-start px-4 py-2.5 relative">
                                {/* Type icon */}
                                <div className="w-8 pt-0.5">
                                  <span className="text-base">{isUrine ? '💧' : '💩'}</span>
                                </div>
                                {/* Date / time */}
                                <div className="w-[130px]">
                                  <span className="text-[13px] font-bold text-fx-text">{shortDate(entry.date)}</span>
                                  {entry.time && <span className="text-[11px] text-fx-ink-300 ml-1.5">{entry.time}</span>}
                                </div>
                                {/* Type-specific data */}
                                <div className="flex-1 flex flex-wrap gap-1 items-center pr-7">
                                  {isUrine ? (
                                    <>
                                      {entry.urine_type != null && chip(URINE_TYPE_LABEL[entry.urine_type] || entry.urine_type, '#3498db15', '#2980b9')}
                                      {entry.urine_quantity != null && entry.urine_quantity > 0 && chip(`${entry.urine_quantity} ml`, '#9b59b615', '#8e44ad')}
                                      {entry.urine_color && <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ backgroundColor: entry.urine_color, border: '1px solid #00000020' }} />}
                                      {entry.urine_characteristics.length > 0
                                        ? entry.urine_characteristics.map(c => chip(URINE_CHAR_LABEL[c] || c, '#e74c3c12', '#c0392b'))
                                        : null}
                                      {entry.urine_urgency != null && chip(`Urgencia ${entry.urine_urgency}/5`, '#f59e0b18', '#b45309')}
                                      {entry.during_sleep === true && chip('Durante sueño', '#8b5cf618', '#6d28d9')}
                                      {entry.urine_type == null && entry.urine_quantity === 0 && entry.urine_characteristics.length === 0 && entry.urine_urgency == null && <span className="text-xs" style={{ color: '#ddd' }}>—</span>}
                                    </>
                                  ) : (
                                    <>
                                      {entry.bristol != null && chip(`T${entry.bristol}`, `${bristolColor}20`, bristolColor!)}
                                      {entry.floats != null && chip(FLOATS_LABEL[entry.floats], '#3498db15', '#2980b9')}
                                      {entry.color && <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ backgroundColor: entry.color, border: '1px solid #00000020' }} />}
                                      {entry.quantity != null && chip(`${entry.quantity}`, '#9b59b615', '#8e44ad')}
                                      {entry.duration != null && chip(DURATION_LABEL[entry.duration], '#f39c1215', '#e67e22')}
                                      {entry.symptoms.length > 0
                                        ? entry.symptoms.map(s => chip(SYMPTOM_LABEL[s] || s, '#e74c3c12', '#c0392b'))
                                        : null}
                                      {entry.bristol == null && entry.floats == null && !entry.color && entry.quantity == null && entry.symptoms.length === 0 && <span className="text-xs" style={{ color: '#ddd' }}>—</span>}
                                    </>
                                  )}
                                </div>
                                {/* Annotation button — positioned absolute inside the row */}
                                <button
                                  onClick={() => setNoteEditing(ne => ne?.entryId === entry.entry_id ? null : { entryId: entry.entry_id, draft: entry.doctor_note || '' })}
                                  title={entry.doctor_note ? 'Ver / editar anotación' : 'Añadir anotación'}
                                  className="absolute right-2.5 top-2 bg-transparent border-none cursor-pointer text-sm px-1.5 py-0.5 rounded"
                                  style={{ opacity: entry.doctor_note ? 1 : 0.2 }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = entry.doctor_note ? '1' : '0.2')}
                                >📝</button>
                              </div>
                              {/* Patient notes (from patient app) */}
                              {entry.notes && (
                                <div className="pl-[178px] pr-4 pb-1.5">
                                  <p className="text-xs text-fx-text-secondary m-0 leading-snug">{entry.notes}</p>
                                </div>
                              )}
                              {/* Doctor annotation */}
                              {entry.doctor_note && noteEditing?.entryId !== entry.entry_id && (
                                <div className="ml-[178px] mr-4 mb-2 px-2.5 py-1.5 rounded-r-md" style={{ backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b' }}>
                                  <p className="text-xs m-0 leading-snug" style={{ color: '#78350f' }}>🩺 {entry.doctor_note}</p>
                                </div>
                              )}
                              {/* Inline annotation editor */}
                              {noteEditing?.entryId === entry.entry_id && (
                                <div className="ml-[178px] mr-4 mb-2.5 flex flex-col gap-1.5">
                                  <textarea
                                    autoFocus
                                    value={noteEditing.draft}
                                    onChange={e => setNoteEditing({ ...noteEditing, draft: e.target.value })}
                                    placeholder="Anotación médica (ej: inicio de omeprazol, coincide con brote…)"
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-sans resize-none outline-none box-border"
                                    style={{ border: '1px solid #fbbf24', backgroundColor: '#fffbeb' }}
                                  />
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleSaveEntryNote(entry.entry_id, noteEditing.draft)}
                                      className="px-3.5 py-1 rounded-md border-none text-white text-xs font-bold cursor-pointer" style={{ backgroundColor: '#f59e0b' }}>
                                      Guardar
                                    </button>
                                    <button onClick={() => setNoteEditing(null)}
                                      className="px-2.5 py-1 rounded-md border border-fx-border bg-fx-surface text-xs text-fx-text-secondary cursor-pointer">
                                      Cancelar
                                    </button>
                                    {entry.doctor_note && (
                                      <button onClick={() => handleSaveEntryNote(entry.entry_id, '')}
                                        className="px-2.5 py-1 rounded-md border-none text-xs cursor-pointer ml-auto" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-fx-border-soft" style={{ backgroundColor: '#00000005' }}>
                        <button onClick={() => setEntryPage(p => Math.max(0, p - 1))} disabled={entryPage === 0}
                          className="px-3.5 py-[5px] rounded-lg border border-fx-border bg-fx-surface text-[13px]" style={{ cursor: entryPage === 0 ? 'default' : 'pointer', opacity: entryPage === 0 ? 0.4 : 1 }}>
                          ← Anterior
                        </button>
                        <span className="text-xs text-fx-text-secondary">
                          Página <strong>{entryPage + 1}</strong> de <strong>{totalPages}</strong>
                          <span className="text-fx-ink-300"> · {filteredEntries.length} registros</span>
                        </span>
                        <button onClick={() => setEntryPage(p => Math.min(totalPages - 1, p + 1))} disabled={entryPage === totalPages - 1}
                          className="px-3.5 py-[5px] rounded-lg border border-fx-border bg-fx-surface text-[13px]" style={{ cursor: entryPage === totalPages - 1 ? 'default' : 'pointer', opacity: entryPage === totalPages - 1 ? 0.4 : 1 }}>
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Config modal ── */}
            {patientConfigOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setPatientConfigOpen(false)}
                  className="medics-patient-config__backdrop fixed inset-0 z-[200] bg-black/45"
                />
                {/* Panel */}
                <div
                  onClick={e => e.stopPropagation()}
                  className="medics-patient-config fixed top-0 right-0 bottom-0 z-[201] w-full flex flex-col"
                  style={{ maxWidth: 420, backgroundColor: '#F5F5F5', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)' }}
                >
                  {/* Modal header */}
                  <div className="medics-patient-config__header flex items-center justify-between px-5 py-4 text-white flex-shrink-0" style={{ backgroundColor: th.dark }}>
                    <span className="text-base font-bold">
                      ⚙️ Configuración — {selectedPatient.display_name || selectedPatient.patient_email}
                    </span>
                    <button
                      onClick={() => setPatientConfigOpen(false)}
                      className="bg-transparent border-none text-white text-[22px] cursor-pointer leading-none px-1"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal content */}
                  <div className="medics-patient-config__content flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">

                    {/* Semáforo personalizado */}
                    <div className="medics-patient-config__semaforo bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft px-4 py-3.5">
                      <div className="flex items-center gap-2.5" style={{ marginBottom: patientSemaforoOverride ? 14 : 0 }}>
                        <Switch
                          checked={patientSemaforoOverride}
                          onChange={setPatientSemaforoOverride}
                          style={{ backgroundColor: patientSemaforoOverride ? th.primary : undefined }}
                        />
                        <span className="text-[13px] font-semibold text-fx-text-secondary">🚦 Semáforo personalizado</span>
                        {!patientSemaforoOverride && (
                          <span className="text-[11px] text-fx-ink-300">usa valores generales</span>
                        )}
                      </div>

                      {patientSemaforoOverride && (
                        <div className="flex gap-1.5">
                          <div className="flex-1 min-w-0 rounded-lg px-2 py-1.5 flex flex-col gap-1.5" style={{ backgroundColor: '#2ecc7115', borderLeft: '3px solid #27ae60' }}>
                            <div className="flex items-center gap-[3px]">
                              <span className="text-xs">🟢</span>
                              <span className="text-[10px] font-bold" style={{ color: '#27ae60' }}>≤ {patientSemaforoGreen}d</span>
                            </div>
                            <SemaforoSlider value={patientSemaforoGreen} min={0} max={Math.max(patientSemaforoRed - 1, 1)} color="#27ae60"
                              onChange={(v) => { setPatientSemaforoGreen(v); if (v >= patientSemaforoRed) setPatientSemaforoRed(v + 1); }} />
                          </div>
                          <div className="flex-1 min-w-0 rounded-lg px-2 py-1.5 flex flex-col justify-center" style={{ backgroundColor: '#f39c1215', borderLeft: '3px solid #f39c12' }}>
                            <div className="flex items-center gap-[3px]">
                              <span className="text-xs">🟠</span>
                              <span className="text-[10px] font-bold" style={{ color: '#e67e22' }}>{patientSemaforoGreen + 1}–{patientSemaforoRed}d</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 rounded-lg px-2 py-1.5 flex flex-col gap-1.5" style={{ backgroundColor: '#e74c3c15', borderLeft: '3px solid #e74c3c' }}>
                            <div className="flex items-center gap-[3px]">
                              <span className="text-xs">🔴</span>
                              <span className="text-[10px] font-bold" style={{ color: '#e74c3c' }}>&gt; {patientSemaforoRed}d</span>
                            </div>
                            <SemaforoSlider value={patientSemaforoRed} min={Math.max(patientSemaforoGreen + 1, 1)} max={30} color="#e74c3c"
                              onChange={(v) => { setPatientSemaforoRed(v); if (v <= patientSemaforoGreen) setPatientSemaforoGreen(v - 1); }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Campos del formulario */}
                    <div className="medics-patient-config__fields bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                      <div className="px-4 py-2.5 border-b border-fx-border-soft text-[13px] font-bold text-fx-text">
                        📋 Campos del formulario
                      </div>
                      <div className="p-3 px-4 flex flex-col gap-0">
                        <div className="mb-3.5">
                          <div className="text-xs font-bold text-fx-text-secondary mb-2">Tipo de registro permitido</div>
                          <div className="flex gap-1.5">
                            {[
                              { value: 'both', label: 'Ambas opciones' },
                              { value: 'poop_only', label: 'Solo deposición' },
                              { value: 'urine_only', label: 'Solo micción' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setPatientEntryTypeMode(opt.value)}
                                className="flex-1 py-1.5 px-1 rounded-lg border-none cursor-pointer text-[11px] font-bold leading-tight transition-all duration-150"
                                style={{
                                  backgroundColor: patientEntryTypeMode === opt.value ? th.primary : '#f0f0f0',
                                  color: patientEntryTypeMode === opt.value ? '#fff' : '#555',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-fx-ink-400 mb-2.5 leading-relaxed">
                          Campos visibles para este paciente al registrar. La fecha/hora y las notas siempre aparecen.
                        </p>
                        {[
                          { id: 'bristol', label: '🪷 Bristol', group: '💩 Deposición' },
                          { id: 'color', label: '🎨 Color', group: null },
                          { id: 'floats', label: '🫧 Flotación', group: null },
                          { id: 'quantity', label: '⚖️ Cantidad', group: null },
                          { id: 'duration', label: '⏱️ Duración', group: null },
                          { id: 'symptoms', label: '🤒 Síntomas', group: null },
                          { id: 'urine_type', label: 'Tipo de micción', group: '💧 Micción' },
                          { id: 'urine_quantity', label: 'Cantidad (ml)', group: null },
                          { id: 'urine_color', label: 'Color', group: null },
                          { id: 'urine_characteristics', label: 'Características', group: null },
                        ].map((field, i, arr) => {
                          const showGroupHeader = field.group !== null;
                          const isVisible = !patientHiddenFields.includes(field.id);
                          return (
                            <div key={field.id}>
                              {showGroupHeader && (
                                <div className={`text-[10px] font-extrabold text-fx-ink-300 tracking-wide uppercase ${i === 0 ? 'py-1 pb-1.5' : 'pt-3 pb-1.5'} ${i !== 0 ? 'border-t border-fx-border-soft' : ''}`}>
                                  {field.group}
                                </div>
                              )}
                              <div className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-fx-border-soft' : ''}`}>
                                <span className="text-[13px] font-medium text-fx-text">{field.label}</span>
                                <Switch
                                  checked={isVisible}
                                  onChange={(checked) =>
                                    setPatientHiddenFields(prev =>
                                      checked ? prev.filter(id => id !== field.id) : [...prev, field.id]
                                    )
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notificaciones push */}
                    <div className="medics-patient-config__push bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
                      <div className="px-4 py-2.5 border-b border-fx-border-soft text-[13px] font-bold text-fx-text">
                        🔔 Notificaciones push
                      </div>
                      <div className="p-3 px-4 flex flex-col gap-3">
                        <p className="text-xs text-fx-ink-400 leading-relaxed">
                          Recordatorio automático cuando el paciente lleva X horas sin registrar.
                        </p>
                        <div>
                          <label className="text-xs font-bold text-fx-text-secondary block mb-1">
                            Horas sin registrar antes de notificar
                          </label>
                          <input
                            type="number" min={1} max={168} value={patientPushMinHours}
                            onChange={e => setPatientPushMinHours(Number(e.target.value))}
                            className="w-full py-1.5 px-2.5 rounded-lg border border-fx-border text-[13px] text-fx-text box-border"
                          />
                          <span className="text-[11px] text-fx-ink-300">Por defecto: 24h</span>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-fx-text-secondary block mb-1">
                            Veces al día que se notifica (cada {Math.round(24 / Math.max(1, patientPushFrequency))}h)
                          </label>
                          <input
                            type="number" min={1} max={24} value={patientPushFrequency}
                            onChange={e => setPatientPushFrequency(Number(e.target.value))}
                            className="w-full py-1.5 px-2.5 rounded-lg border border-fx-border text-[13px] text-fx-text box-border"
                          />
                          <span className="text-[11px] text-fx-ink-300">Por defecto: 2 (cada 12h)</span>
                        </div>
                        <div className="border-t border-fx-border-soft pt-3">
                          <p className="text-xs text-fx-ink-400 mb-2.5 leading-relaxed">
                            Envía una notificación ahora para verificar que funciona correctamente.
                          </p>
                          <button
                            onClick={handleSendTestPush}
                            disabled={pushTestStatus === 'sending' || !selectedPatient?.hasPushSub}
                            className="w-full py-2 px-3.5 text-xs font-bold rounded-lg bg-transparent"
                            style={{
                              border: `2px solid ${th.primary}`, cursor: selectedPatient?.hasPushSub ? 'pointer' : 'not-allowed',
                              color: th.primary, opacity: selectedPatient?.hasPushSub ? 1 : 0.4,
                            }}
                          >
                            {pushTestStatus === 'sending' ? '⏳ Enviando...' : '🔔 Enviar notificación de prueba'}
                          </button>
                          {!selectedPatient?.hasPushSub && (
                            <p className="text-[11px] text-fx-ink-300 mt-1.5">El paciente no tiene notificaciones activadas.</p>
                          )}
                          {pushTestStatus === 'ok' && (
                            <p className="text-xs text-fx-success-500 font-semibold mt-2">✅ Notificación enviada</p>
                          )}
                          {pushTestStatus === 'error' && (
                            <p className="text-xs text-fx-error-500 font-semibold mt-2">❌ {pushTestError}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Single save button for all sections */}
                    <div className="medics-patient-config__save pb-2">
                      {patientConfigSaved && (
                        <div className="text-[13px] text-fx-success-500 font-semibold mb-2 text-center">✅ Configuración guardada</div>
                      )}
                      {patientConfigError && (
                        <div className="text-xs text-fx-error-500 font-semibold mb-2">❌ {patientConfigError}</div>
                      )}
                      <button onClick={handleSavePatientConfig} className="w-full py-3.5 text-sm rounded-fx-md" style={{ ...ts.btnPrimary }}>
                        Guardar configuración
                      </button>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── INVITAR PACIENTE ── */}
        {section === 'invitar' && (
          <div className="medics-invitar">
            <SectionHeader
              title="Invitar Paciente"
              subtitle="Envía una invitación por email a tu paciente"
            />

            {/* Plan banner */}
            {(doctorInfo?.plan === 'free' || doctorInfo?.plan === 'beta') && (
              <div className="medics-invitar__plan-banner bg-fx-warning-50 border border-fx-warning-300 rounded-fx-md py-3.5 px-4.5 mb-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{doctorInfo?.plan === 'beta' ? '🧪' : '⭐'}</span>
                  <div>
                    <div className="text-[13px] font-bold text-fx-warning-700">
                      {doctorInfo?.plan === 'beta'
                        ? `Plan Beta · ${patients.length}/${BETA_PLAN_PATIENT_LIMIT} pacientes`
                        : `Plan Free · ${patients.length}/${FREE_PLAN_PATIENT_LIMIT} paciente${FREE_PLAN_PATIENT_LIMIT === 1 ? '' : 's'}`}
                    </div>
                    <div className="text-xs text-fx-warning-600">
                      {doctorInfo?.plan === 'beta'
                        ? (patients.length >= BETA_PLAN_PATIENT_LIMIT ? 'Has alcanzado el límite beta.' : 'Acceso beta · hasta 100 pacientes.')
                        : (patients.length >= FREE_PLAN_PATIENT_LIMIT ? 'Has alcanzado el límite gratuito. Pasa a Pro para añadir más pacientes.' : 'El primer paciente es gratis. Después, pasa al plan Pro.')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="py-2 px-4 rounded-fx-pill border-none text-white text-[13px] font-semibold cursor-pointer"
                  style={{ backgroundColor: th.dark }}
                >
                  Pasar a Pro
                </button>
              </div>
            )}

            <div className="medics-invitar__form bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft">
              <div className="p-6 flex flex-col gap-4">
                {(() => {
                  const atLimit = doctorInfo?.plan === 'free' && patients.length >= FREE_PLAN_PATIENT_LIMIT;
                  return (
                    <div>
                      <label className="block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Email del paciente</label>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => !atLimit && setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                            placeholder={atLimit ? 'Límite de pacientes alcanzado' : 'paciente@email.com'}
                            disabled={atLimit}
                            className="w-full py-3 px-3.5 rounded-fx-md border border-fx-border text-[15px] outline-none box-border bg-fx-surface text-fx-text font-sans"
                            style={{ opacity: atLimit ? 0.45 : 1, cursor: atLimit ? 'not-allowed' : 'text' }}
                          />
                        </div>
                        <button
                          onClick={handleInvite}
                          disabled={loading || !inviteEmail.trim() || atLimit}
                          className="py-2 px-4 rounded-fx-pill border-none text-[13px] font-semibold h-11 flex items-center gap-1.5 font-sans text-white"
                          style={{
                            backgroundColor: th.dark,
                            opacity: loading || !inviteEmail.trim() || atLimit ? 0.45 : 1,
                            cursor: atLimit ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Enviar invitación
                        </button>
                      </div>
                      {atLimit && (
                        <p className="text-xs text-fx-warning-600 mt-2 flex items-center gap-1.5">
                          <span>⚠️</span> Límite del plan Free alcanzado.{' '}
                          <button onClick={() => setShowUpgradeModal(true)} className="bg-transparent border-none font-bold text-xs cursor-pointer underline p-0" style={{ color: th.dark }}>
                            Pasa a Pro
                          </button>{' '}
                          para añadir más pacientes.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {error && <p className="text-fx-error-600 text-[13px] m-0">{error}</p>}

                {inviteSuccess && (
                  <div className="bg-fx-success-50 rounded-[10px] py-3 px-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✅</span>
                      <span className="text-[13px] font-bold text-fx-success-500">Invitación enviada</span>
                    </div>
                    {emailSent && (
                      <p className="text-xs text-fx-text-secondary m-0">El paciente recibirá un email con las instrucciones.</p>
                    )}
                    {emailError && (
                      <p className="text-xs text-fx-warning-600 m-0">⚠️ {emailError}</p>
                    )}
                    <p className="text-xs text-fx-ink-400 m-0">
                      El paciente verá la invitación en su cuenta al iniciar sesión.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="medics-invitar__instructions bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft mt-4">
              <div className="p-6">
                <div className="text-base font-bold text-fx-text mb-3">{'\u{1F4D6}'} Instrucciones para el paciente</div>
                <div className="text-sm text-fx-text-secondary leading-loose">
                  <p className="m-0 mb-2">El paciente debe seguir estos pasos:</p>
                  <ol className="m-0 pl-5">
                    <li>Abrir la app en <strong>fluxia-health.com/user</strong></li>
                    <li>Iniciar sesión con el email al que le enviaste la invitación</li>
                    <li>Ir a <strong>Configuración</strong> y aceptar la invitación del médico</li>
                  </ol>
                  <p className="mt-3 mb-0 text-fx-ink-400 text-[13px]">
                    Una vez aceptada, podrás ver los registros del paciente desde tu panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {section === 'config' && (
          <div className="medics-config">
            <SectionHeader
              title="Configuración"
              subtitle="Ajusta tu perfil y los parámetros del semáforo"
            />

            {/* ── Config grid layout ── */}
            <div className="medics-config__grid grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1550px]">

              {/* Col 1 Row 1 — Datos del médico */}
              <div className="medics-config__doctor-info bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft md:col-start-1 md:row-start-1">
                <div className="py-3.5 px-4.5 border-b border-fx-border-soft">
                  <span className="text-[15px] font-bold text-fx-text">👤 Datos del médico</span>
                </div>
                <div className="p-4.5 flex flex-col gap-3.5">
                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Nombre</label>
                    <input
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      className="w-full py-3 px-3.5 rounded-fx-md border border-fx-border text-[15px] outline-none box-border bg-fx-surface text-fx-text font-sans"
                      placeholder="Dr. Nombre Apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5 text-fx-text-secondary">Centro médico</label>
                    <input
                      type="text"
                      value={configCenterName}
                      onChange={(e) => setConfigCenterName(e.target.value)}
                      className="w-full py-3 px-3.5 rounded-fx-md border border-fx-border text-[15px] outline-none box-border bg-fx-surface text-fx-text font-sans"
                      placeholder="Nombre del centro o consulta"
                    />
                  </div>
                  {configSaved && (
                    <div className="bg-fx-success-100 rounded-lg py-2 px-3 flex items-center gap-2">
                      <span>✅</span>
                      <span className="text-xs font-semibold text-fx-success-500">Guardado</span>
                    </div>
                  )}
                  <button onClick={handleSaveConfig} disabled={loading}
                    className="w-full py-2.5 px-5 rounded-fx-pill text-white border-none text-[15px] font-semibold font-sans cursor-pointer"
                    style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>
                    {loading ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Col 2 Rows 1–2 — Imagen del centro */}
              <div className="medics-config__center-image bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft md:col-start-2 md:row-start-1 md:row-span-2">
                <div className="py-3.5 px-4.5 border-b border-fx-border-soft">
                  <span className="text-[15px] font-bold text-fx-text">🏥 Imagen del centro</span>
                </div>
                <div className="p-4.5 flex flex-col gap-3.5 items-center">
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed border-fx-border overflow-hidden flex items-center justify-center bg-fx-ink-50">
                    {centerImageUrl ? (
                      <img src={centerImageUrl} alt="Centro" crossOrigin="anonymous" className="w-full h-full object-scale-down" />
                    ) : (
                      <span className="text-[32px]">🏥</span>
                    )}
                  </div>
                  <p className="text-xs text-fx-ink-400 m-0 text-center leading-relaxed">
                    Aparecerá en la app de los pacientes vinculados.
                  </p>
                  <label
                    className="w-full inline-flex items-center gap-2 py-2.5 px-4.5 rounded-fx-pill text-white text-[15px] font-semibold font-sans cursor-pointer"
                    style={{ backgroundColor: th.dark, opacity: uploadingImage ? 0.5 : 1 }}
                  >
                    {uploadingImage ? 'Subiendo...' : '📤 Subir imagen'}
                    <input type="file" accept="image/*" disabled={uploadingImage} className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
                  </label>
                  <p className="text-[11px] text-fx-ink-300 m-0">PNG, JPG o WEBP · Máx 2 MB</p>
                </div>
              </div>

              {/* Col 1 Row 2 — Semáforo */}
              <div className="medics-config__semaforo bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft md:col-start-1 md:row-start-2">
                <div className="py-3.5 px-4.5 border-b border-fx-border-soft">
                  <span className="text-[15px] font-bold text-fx-text">🚦 Semáforo</span>
                </div>
                <div className="p-4.5 flex flex-col gap-4">
                  <p className="text-[13px] text-fx-text-secondary m-0 leading-snug">
                    Define cuántos días sin registro se consideran normales (🟢), en vigilancia (🟠) o en alerta (🔴).
                    Este umbral se aplica a todos tus pacientes como valor por defecto; puedes personalizarlo individualmente
                    en la ficha de cada paciente.
                  </p>
                  <div className="flex gap-1.5">
                    <div className="flex-1 min-w-0 rounded-lg py-2 px-2.5 flex flex-col gap-1.5" style={{ backgroundColor: '#2ecc7115', borderLeft: '3px solid #27ae60' }}>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🟢</span>
                        <span className="text-[11px] font-bold" style={{ color: '#27ae60' }}>≤ {configGreen}d</span>
                      </div>
                      <SemaforoSlider value={configGreen} min={0} max={Math.max(configRed - 1, 1)} color="#27ae60"
                        onChange={(val) => { setConfigGreen(val); if (val >= configRed) setConfigRed(val + 1); }} />
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg py-2 px-2.5 flex flex-col justify-center" style={{ backgroundColor: '#f39c1215', borderLeft: '3px solid #f39c12' }}>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🟠</span>
                        <span className="text-[11px] font-bold" style={{ color: '#e67e22' }}>{configGreen + 1}–{configRed}d</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 rounded-lg py-2 px-2.5 flex flex-col gap-1.5" style={{ backgroundColor: '#e74c3c15', borderLeft: '3px solid #e74c3c' }}>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🔴</span>
                        <span className="text-[11px] font-bold" style={{ color: '#e74c3c' }}>&gt;{configRed}d</span>
                      </div>
                      <SemaforoSlider value={configRed} min={Math.max(configGreen + 1, 1)} max={30} color="#e74c3c"
                        onChange={(val) => { setConfigRed(val); if (val <= configGreen) setConfigGreen(val - 1); }} />
                    </div>
                  </div>
                  {configSaved && (
                    <div className="bg-fx-success-100 rounded-lg py-2 px-3 flex items-center gap-2">
                      <span>✅</span><span className="text-xs font-semibold text-fx-success-500">Guardado</span>
                    </div>
                  )}
                  <button onClick={handleSaveConfig} disabled={loading}
                    className="w-full py-2.5 px-5 rounded-fx-pill text-white border-none text-[15px] font-semibold font-sans cursor-pointer"
                    style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>
                    {loading ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Cols 1–2 Row 3 — Etiquetas globales */}
              <div className="medics-config__tags bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft md:col-span-2 md:row-start-3">
                <div className="py-3.5 px-4.5 border-b border-fx-border-soft">
                  <span className="text-[15px] font-bold text-fx-text">🏷️ Etiquetas globales</span>
                </div>
                <div className="p-4.5 flex flex-col gap-3.5">
                  <p className="text-[13px] text-fx-text-secondary m-0 leading-snug">
                    Define las etiquetas de tu consulta. Desde la ficha de cada paciente puedes asignar una o varias.
                    Eliminar una etiqueta la borra también de todos los pacientes.
                  </p>
                  <div className="flex flex-wrap gap-2 min-h-8">
                    {globalTags.length === 0 ? (
                      <span className="text-[13px] text-fx-ink-300 italic self-center">Sin etiquetas todavía</span>
                    ) : globalTags.map(t => (
                      <span key={t} className="inline-flex items-center gap-[5px] text-[13px] py-1 px-3 rounded-full font-bold" style={{ backgroundColor: tagColor(t) + '22', color: tagColor(t) }}>
                        {t}
                        <button
                          onClick={() => deleteGlobalTag(t)}
                          title={`Eliminar "${t}"`}
                          className="bg-transparent border-none cursor-pointer pl-0.5 text-sm leading-none opacity-50"
                          style={{ color: tagColor(t) }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      const v = configTagInput.trim();
                      if (!v || globalTags.includes(v)) { setConfigTagInput(''); return; }
                      setConfigTagInput('');
                      await saveGlobalTags([...globalTags, v]);
                    }}
                    className="flex gap-2 items-center">
                    <input
                      value={configTagInput}
                      onChange={e => setConfigTagInput(e.target.value)}
                      placeholder="Nueva etiqueta…"
                      className="flex-1 min-w-0 py-2 px-3 rounded-lg border border-fx-border text-[13px] outline-none"
                    />
                    <button type="submit"
                      className="flex-shrink-0 py-2 px-4 text-[13px] rounded-lg text-white border-none font-semibold font-sans cursor-pointer"
                      style={{ backgroundColor: th.dark }}>
                      Añadir
                    </button>
                  </form>
                  {globalTagsSaving && <span className="text-[11px] text-fx-ink-300">Guardando…</span>}
                  {patients.some(p => (p.tags || []).length > 0) && (
                    <div className="border-t border-fx-border-soft pt-3 flex items-center gap-2.5">
                      {clearTagsConfirm ? (
                        <>
                          <span className="text-xs text-fx-error-600 font-semibold">¿Seguro? Esto borrará todas las etiquetas de todos los pacientes.</span>
                          <button
                            onClick={async () => {
                              setClearTagsConfirm(false);
                              setGlobalTagsSaving(true);
                              const affected = patients.filter(p => (p.tags || []).length > 0);
                              await Promise.all([
                                supabase.from('doctors').update({ global_tags: [] }).eq('id', doctorInfo!.id),
                                ...affected.map(p => supabase.from('patient_links').update({ tags: [] }).eq('id', p.id)),
                              ]);
                              setGlobalTags([]);
                              setDoctorInfo(prev => prev ? { ...prev, global_tags: [] } : prev);
                              setPatients(prev => prev.map(p => ({ ...p, tags: [] })));
                              if (selectedPatient) {
                                setSelectedPatient(prev => prev ? { ...prev, tags: [] } : prev);
                                setPatientTagsDraft([]);
                              }
                              setGlobalTagsSaving(false);
                            }}
                            className="py-1.5 px-3 rounded-md border-none bg-fx-error-500 text-white text-xs font-bold cursor-pointer">
                            Sí, borrar todo
                          </button>
                          <button onClick={() => setClearTagsConfirm(false)}
                            className="py-1.5 px-3 rounded-md border border-fx-border bg-fx-surface text-xs text-fx-text-secondary cursor-pointer">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setClearTagsConfirm(true)}
                          className="text-[11px] text-fx-error-600 bg-transparent border-none cursor-pointer p-0 underline opacity-70">
                          Limpiar todas las etiquetas de pacientes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cols 1–2 Row 4 — Paleta de colores (temporalmente deshabilitada) */}
              {false && <div className="medics-config__palette bg-fx-surface rounded-fx-xl shadow-fx-sm border border-fx-border-soft md:col-span-2 md:row-start-4">
                <div className="py-3.5 px-4.5 border-b border-fx-border-soft">
                  <span className="text-[15px] font-bold text-fx-text">🎨 Paleta de colores</span>
                </div>
                <div className="p-4.5">
                  <p className="text-[13px] text-fx-text-secondary mb-3.5 leading-relaxed">
                    Elige la paleta del portal. El cambio se aplica al instante y se guarda con la configuración.
                  </p>
                  <div className="flex flex-wrap gap-2.5 mb-3.5">
                    {PALETTES.map(p => {
                      const isActive = configPalette === p.id;
                      return (
                        <button key={p.id} onClick={() => setConfigPalette(p.id)} title={p.name}
                          className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl border-none cursor-pointer transition-all duration-150"
                          style={{
                            backgroundColor: isActive ? '#00000012' : 'transparent',
                            outline: isActive ? `2px solid ${p.theme.primary}` : '2px solid transparent',
                          }}>
                          <div className="w-8 h-8 rounded-full" style={{
                            background: `linear-gradient(135deg, ${p.theme.primary} 50%, ${p.theme.secondary} 50%)`,
                            boxShadow: isActive ? `0 0 0 3px ${p.theme.primary}50` : 'none',
                          }} />
                          <span className="text-[10px] text-fx-text-secondary" style={{ fontWeight: isActive ? 700 : 400 }}>{p.name}</span>
                        </button>
                      );
                    })}

                    {/* Custom palette option */}
                    <button onClick={() => setConfigPalette('custom')} title="Personalizable"
                      className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl border-none cursor-pointer transition-all duration-150"
                      style={{
                        backgroundColor: configPalette === 'custom' ? '#00000012' : 'transparent',
                        outline: configPalette === 'custom' ? `2px solid ${customColor1}` : '2px dashed #ccc',
                      }}>
                      <div className="w-8 h-8 rounded-full" style={{
                        background: configPalette === 'custom'
                          ? `linear-gradient(135deg, ${customColor1} 50%, ${customColor2} 50%)`
                          : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
                        boxShadow: configPalette === 'custom' ? `0 0 0 3px ${customColor1}50` : 'none',
                      }} />
                      <span className="text-[10px] text-fx-text-secondary" style={{ fontWeight: configPalette === 'custom' ? 700 : 400 }}>Personalizable</span>
                    </button>
                  </div>

                  {/* Custom color pickers */}
                  {configPalette === 'custom' && (
                    <div className="bg-fx-surface-2 rounded-xl p-4 flex flex-col gap-3.5">
                      <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs font-bold text-fx-text-secondary block mb-1.5">
                            Color primario
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input type="color" value={customColor1} onChange={e => setCustomColor1(e.target.value)}
                              className="w-11 h-11 rounded-lg border-2 border-fx-border cursor-pointer p-0.5" />
                            <span className="text-[13px] font-semibold text-fx-text font-mono">{customColor1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs font-bold text-fx-text-secondary block mb-1.5">
                            Color oscuro / fondo
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input type="color" value={customColor2} onChange={e => setCustomColor2(e.target.value)}
                              className="w-11 h-11 rounded-lg border-2 border-fx-border cursor-pointer p-0.5" />
                            <span className="text-[13px] font-semibold text-fx-text font-mono">{customColor2}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preview strip */}
                      <div className="rounded-lg overflow-hidden flex h-9">
                        <div className="flex-1" style={{ backgroundColor: customColor1 }} />
                        <div className="flex-1" style={{ background: `linear-gradient(90deg, ${customColor1}, ${customColor2})` }} />
                        <div className="flex-1" style={{ backgroundColor: customColor2 }} />
                      </div>

                      {/* Extract from image button */}
                      <button
                        onClick={handleExtractColors}
                        disabled={!centerImageUrl || extractingColors}
                        className="py-2.5 px-4 rounded-lg bg-transparent text-[13px] font-bold transition-all duration-150"
                        style={{
                          border: `2px solid ${customColor1}`, color: customColor1,
                          cursor: centerImageUrl ? 'pointer' : 'not-allowed',
                          opacity: !centerImageUrl || extractingColors ? 0.5 : 1,
                        }}
                      >
                        {extractingColors ? '⏳ Analizando...' : '🎨 Colores automáticos desde la imagen'}
                      </button>
                      {!centerImageUrl && (
                        <p className="text-[11px] text-fx-ink-300 -mt-2 mb-0">
                          Sube una imagen del centro para usar esta opción.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Save button always visible in palette section */}
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={handleSaveConfig} disabled={loading}
                      className="py-2.5 px-6 rounded-fx-pill text-white border-none text-[15px] font-semibold font-sans cursor-pointer"
                      style={{ backgroundColor: th.dark, opacity: loading ? 0.5 : 1 }}>
                      {loading ? '...' : 'Guardar paleta'}
                    </button>
                    {configSaved && (
                      <div className="flex items-center gap-1.5">
                        <span>✅</span>
                        <span className="text-xs font-semibold text-fx-success-500">Guardado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>}

            </div>
            {isMobile && (
              <div className="text-center py-4 pb-1 text-[11px] text-fx-ink-300/30">{APP_VERSION}</div>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      {isMobile && (
        <nav className="medics-bottomnav fixed bottom-0 left-0 right-0 flex z-20 bg-white/90 backdrop-blur-md border-t border-fx-border-soft">
          {NAV_ITEMS.map(item => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setSelectedPatient(null); setPatientDetail(null); }}
                className="medics-bottomnav__item flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 border-t-2"
                style={{ borderTopColor: active ? th.primary : 'transparent', color: active ? th.primary : 'var(--text-tertiary)' }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── IMAGE UPLOAD MODAL ── */}
      {imageModal && (
        <div
          onClick={() => setImageModal(null)}
          className="medics-image-modal fixed inset-0 bg-black/55 flex items-center justify-center z-[1000] p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-fx-lg p-8 max-w-[420px] w-full text-center shadow-fx-xl relative"
          >
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-3.5 right-4 bg-transparent border-none text-xl cursor-pointer text-fx-ink-300 leading-none"
            >
              ×
            </button>

            {imageModal.type === 'success' ? (
              <>
                <div className="mb-4 flex justify-center">
                  <img
                    src={imageModal.url}
                    alt="Imagen del centro"
                    className="w-[140px] h-[140px] object-cover rounded-xl"
                    style={{ border: `3px solid ${th.primary}` }}
                  />
                </div>
                <div className="text-[28px] mb-2">✅</div>
                <p className="text-[17px] font-bold text-fx-text m-0 mb-2">Imagen subida correctamente</p>
                <p className="text-[13px] text-fx-ink-400 m-0">La imagen ya está visible para tus pacientes.</p>
              </>
            ) : (
              <>
                <div className="text-[40px] mb-3">❌</div>
                <p className="text-[17px] font-bold text-fx-text m-0 mb-2">Error al subir la imagen</p>
                <p className="text-[13px] text-fx-error-500 m-0 mb-5 leading-relaxed">{imageModal.message}</p>
                <p className="text-xs text-fx-ink-300 m-0">Asegúrate de que el bucket <strong>center-images</strong> existe y es público en Supabase Storage.</p>
              </>
            )}

            <button
              onClick={() => setImageModal(null)}
              className="mt-5 py-2.5 px-8 rounded-fx-pill text-white border-none text-[15px] font-semibold font-sans cursor-pointer"
              style={{ backgroundColor: th.dark }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── UPGRADE TO PRO MODAL ── */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
          className="medics-upgrade-modal fixed inset-0 bg-black/55 flex items-center justify-center z-[1000] p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-fx-lg p-8 max-w-[480px] w-full shadow-fx-xl relative"
          >
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-3.5 right-4 bg-transparent border-none text-xl cursor-pointer text-fx-ink-300 leading-none"
            >
              ×
            </button>
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-[22px] font-extrabold text-fx-text m-0 mb-2">Pasa al plan Pro</h2>
            <p className="text-sm text-fx-text-secondary m-0 mb-5 leading-relaxed">
              Has alcanzado el límite del plan gratuito ({FREE_PLAN_PATIENT_LIMIT} paciente). Con Pro podrás añadir pacientes ilimitados,
              acceder a alertas avanzadas y exportar informes PDF firmados.
            </p>
            <ul className="list-none p-0 m-0 mb-6 flex flex-col gap-2">
              <li className="text-[13.5px] text-fx-text flex gap-2"><span className="text-fx-success-500">✓</span> Hasta 200 pacientes en seguimiento</li>
              <li className="text-[13.5px] text-fx-text flex gap-2"><span className="text-fx-success-500">✓</span> Dashboard con alertas y cohortes</li>
              <li className="text-[13.5px] text-fx-text flex gap-2"><span className="text-fx-success-500">✓</span> Informes PDF firmados</li>
              <li className="text-[13.5px] text-fx-text flex gap-2"><span className="text-fx-success-500">✓</span> Soporte prioritario en 24h</li>
            </ul>
            <div className="bg-fx-surface-2 rounded-xl p-4 mb-5 text-center">
              <div className="text-[32px] font-extrabold text-fx-text">49 €<span className="text-[13px] font-medium text-fx-ink-400">/mes</span></div>
              <div className="text-xs text-fx-ink-400 mt-0.5">Facturación mensual · Cancela cuando quieras</div>
            </div>
            <button
              onClick={() => { alert('Pronto: integración con Stripe para activar el plan Pro.'); }}
              className="w-full py-3.5 rounded-fx-pill text-white border-none text-[15px] font-semibold font-sans cursor-pointer"
              style={{ backgroundColor: th.dark }}
            >
              Activar plan Pro
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full mt-2.5 bg-transparent border-none text-fx-ink-400 text-[13px] cursor-pointer"
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      )}

      {/* ── ONBOARDING MODAL ── */}
      {onboardingOpen && (() => {
        const step = ONBOARDING_STEPS[onboardingStep];
        const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;
        const progress = ((onboardingStep + 1) / ONBOARDING_STEPS.length) * 100;
        return (
          <div
            onClick={onboardingSkippable ? finishOnboarding : undefined}
            className="medics-onboarding fixed inset-0 bg-black/65 z-[2000] flex items-center justify-center p-6"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-[620px] max-h-[90vh] overflow-hidden shadow-fx-xl flex flex-col relative"
            >
              {/* Close button — only when skippable */}
              {onboardingSkippable && (
                <button
                  onClick={finishOnboarding}
                  className="absolute top-4 right-4.5 bg-transparent border-none text-[22px] cursor-pointer text-fx-ink-300 leading-none z-[1]"
                >×</button>
              )}

              {/* Progress bar */}
              <div className="h-1 bg-fx-surface-2">
                <div className="h-full transition-[width] duration-300 ease-in-out" style={{ width: `${progress}%`, backgroundColor: step.accent }} />
              </div>

              {/* Content */}
              <div className="px-12 pt-10 pb-8 flex-1 overflow-auto" style={{ backgroundColor: step.color }}>
                <div className="text-center">
                  <div className="text-7xl leading-none mb-6">{step.icon}</div>
                  <h2 className="text-[26px] font-black text-fx-text m-0 mb-3.5 leading-tight">{step.title}</h2>
                  <p className="text-base text-fx-text-secondary leading-relaxed mx-auto my-0 max-w-[460px]">{step.body}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-12 pt-5 pb-7 bg-white flex flex-col items-center gap-5">
                {/* Dots */}
                <div className="flex gap-2">
                  {ONBOARDING_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setOnboardingStep(i)}
                      className="h-2 rounded border-none cursor-pointer p-0 transition-all duration-200 ease-in-out"
                      style={{
                        width: i === onboardingStep ? 22 : 8,
                        backgroundColor: i === onboardingStep ? step.accent : '#ddd',
                      }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 w-full max-w-[380px]">
                  {onboardingStep > 0 && (
                    <button
                      onClick={() => setOnboardingStep(s => s - 1)}
                      className="flex-1 py-3 rounded-xl border-[1.5px] border-fx-border bg-white text-[15px] font-semibold cursor-pointer text-fx-text-secondary"
                    >
                      ← Anterior
                    </button>
                  )}
                  <button
                    onClick={isLast ? finishOnboarding : () => setOnboardingStep(s => s + 1)}
                    className="flex-1 py-3 rounded-xl border-none text-white text-[15px] font-bold cursor-pointer"
                    style={{ backgroundColor: step.accent }}
                  >
                    {isLast ? '¡Empezar!' : 'Siguiente →'}
                  </button>
                </div>

                {/* Step counter */}
                <p className="text-xs text-fx-ink-300 m-0">{onboardingStep + 1} de {ONBOARDING_STEPS.length}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Storage migration utilities ──

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function mimeToExt(mime: string): string {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[mime] || 'jpg';
}

async function migrateBase64ToStorage(centerId: string, base64Url: string): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(base64Url);
    const path = `${centerId}/logo.${mimeToExt(blob.type)}`;
    const { error } = await supabase.storage
      .from('center-images')
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('center-images').getPublicUrl(path);
    const versionedUrl = `${publicUrl}?t=${Date.now()}`;
    await supabase.from('centers').update({ image_url: versionedUrl }).eq('id', centerId);
    return versionedUrl;
  } catch {
    return null;
  }
}

// ── Color utilities ──

function extractDominantColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 120, H = 120;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);
        const step = 32; // quantize each channel → 8 buckets
        const counts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // skip transparent
          const r = Math.round(data[i] / step) * step;
          const g = Math.round(data[i + 1] / step) * step;
          const b = Math.round(data[i + 2] / step) * step;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 20 || lum > 235) continue; // skip near-black / near-white
          const key = `${r},${g},${b}`;
          counts[key] = (counts[key] || 0) + 1;
        }
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        // Pick top 2, ensuring they're visually distinct (min distance 60)
        const chosen: string[] = [];
        for (const [key] of sorted) {
          if (chosen.length >= 2) break;
          const [r, g, b] = key.split(',').map(Number);
          const isDup = chosen.some(c => {
            const [cr, cg, cb] = c.split(',').map(Number);
            return Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb) < 60;
          });
          if (!isDup) chosen.push(key);
        }
        resolve(chosen.map(key => {
          const [r, g, b] = key.split(',').map(Number);
          return '#' + [r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
        }));
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function darkenColor(hex: string, amount = 0.5): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' + [Math.round(r * (1 - amount)), Math.round(g * (1 - amount)), Math.round(b * (1 - amount))]
    .map(v => Math.max(0, v).toString(16).padStart(2, '0')).join('');
}

// ── Helpers ──
function getBristolLabel(avg: number): string {
  if (avg < 3) return 'Estreñimiento';
  if (avg <= 5) return 'Normal';
  return 'Diarrea';
}

function getActiveDays(entries: PatientEntry[]): number {
  const uniqueDays = new Set(entries.map(e => e.date));
  return uniqueDays.size;
}

function exportPatientPDF(patient: PatientLink, detail: PatientDetail, doctor: DoctorInfo | null) {
  const bristolCounts = [1, 2, 3, 4, 5, 6, 7].map(t => detail.entries.filter(e => e.bristol === t).length);
  const floatsYes = detail.entries.filter(e => e.floats === true).length;
  const floatsNo = detail.entries.filter(e => e.floats === false).length;
  const activeDays = getActiveDays(detail.entries);
  const frequency = activeDays > 0 ? (detail.totalEntries / activeDays).toFixed(2) : '0';

  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const patientName = patient.display_name || patient.patient_email || 'Paciente';

  // Build entries table rows
  const entryRows = detail.entries.slice(0, 50).map(e => {
    const bristol = e.bristol != null ? `Tipo ${e.bristol}` : '-';
    const floats = e.floats === true ? 'Sí' : e.floats === false ? 'No' : '-';
    const notes = (e.notes || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<tr><td>${e.date}</td><td>${e.time || '-'}</td><td>${bristol}</td><td>${floats}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${notes}</td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe - ${patientName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a0e0e; padding: 40px; font-size: 12px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; color: #dd8273; border-bottom: 2px solid #dd8273; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
  .header-left h1 { color: #1a0e0e; }
  .header-right { text-align: right; color: #888; font-size: 11px; }
  .stats { display: flex; gap: 12px; margin: 16px 0; }
  .stat { flex: 1; background: #f9f5f4; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: 900; color: #1a0e0e; }
  .stat-label { font-size: 10px; color: #888; text-transform: uppercase; margin-top: 4px; }
  .alert { background: #fff3cd; border-left: 4px solid #f39c12; padding: 8px 12px; margin: 8px 0; font-size: 12px; border-radius: 4px; }
  .alert-red { background: #fde8e8; border-left-color: #e74c3c; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f5f0ef; text-align: left; padding: 6px 8px; font-weight: 700; color: #555; font-size: 10px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>💩 Informe de Seguimiento Intestinal</h1>
    <p style="color:#888;margin-top:4px">Paciente: <strong>${patientName}</strong></p>
  </div>
  <div class="header-right">
    <p><strong>${doctor?.center_name || 'Centro médico'}</strong></p>
    <p>Dr. ${doctor?.name || ''} · ${doctor?.specialty || 'Medicina general'}</p>
    <p>Fecha: ${today}</p>
  </div>
</div>

<h2>Resumen</h2>
<div class="stats">
  <div class="stat"><div class="stat-value">${detail.totalEntries}</div><div class="stat-label">Registros totales</div></div>
  <div class="stat"><div class="stat-value">${detail.bristolAvg ? detail.bristolAvg.toFixed(1) : '—'}</div><div class="stat-label">Bristol medio</div></div>
  <div class="stat"><div class="stat-value">${activeDays}</div><div class="stat-label">Días con actividad</div></div>
  <div class="stat"><div class="stat-value">${frequency}</div><div class="stat-label">Registros/día</div></div>
</div>

${detail.daysSinceLast !== null && detail.daysSinceLast >= 3 ? `<div class="alert alert-red">⚠️ El paciente lleva <strong>${detail.daysSinceLast} días</strong> sin registrar actividad.</div>` : ''}
${detail.bristolAvg !== null && (detail.bristolAvg < 3 || detail.bristolAvg > 5) ? `<div class="alert">🔬 Bristol medio fuera de rango normal (3-5): <strong>${detail.bristolAvg.toFixed(1)}</strong> — ${getBristolLabel(detail.bristolAvg)}</div>` : ''}

<h2>Distribución Escala de Bristol</h2>
<table>
  <tr>
    ${[1, 2, 3, 4, 5, 6, 7].map(t => `<th style="text-align:center">Tipo ${t}</th>`).join('')}
  </tr>
  <tr>
    ${bristolCounts.map((c, i) => `<td style="text-align:center;font-weight:700;color:${i < 2 ? '#f39c12' : i < 5 ? '#27ae60' : '#e74c3c'}">${c}</td>`).join('')}
  </tr>
</table>
<p style="font-size:10px;color:#999;margin-top:4px">Tipos 1-2: Estreñimiento · Tipos 3-5: Normal · Tipos 6-7: Diarrea</p>

<h2>Flotabilidad</h2>
<p>Flota: <strong>${floatsYes}</strong> registros · Hunde: <strong>${floatsNo}</strong> registros · Sin datos: <strong>${detail.totalEntries - floatsYes - floatsNo}</strong></p>

<h2>Historial de Registros (últimos 50)</h2>
<table>
  <tr><th>Fecha</th><th>Hora</th><th>Bristol</th><th>Flota</th><th>Notas</th></tr>
  ${entryRows}
</table>

<div class="footer">
  Generado por Fluxia · ${today} · Este informe es orientativo y no sustituye el diagnóstico médico.
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ── Section Header ──
function SectionHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="medics-section-header flex flex-col md:flex-row md:items-start justify-between gap-3 mb-5">
      <div className="medics-section-header__text">
        <h1 className="text-[22px] md:text-[28px] font-extrabold text-fx-text m-0 tracking-tight">{title}</h1>
        <p className="text-sm text-fx-text-secondary mt-1 mb-0">{subtitle}</p>
      </div>
      {actions && <div className="medics-section-header__actions flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── Stat Card ──
function StatCard({ emoji, label, value, sub, dark }: {
  emoji: string; label: string; value: string; sub?: string; dark?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: dark ? '#000' : '#fff',
      borderRadius: 16,
      padding: 20,
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: dark ? '#ffffff66' : '#00000066', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <span style={{ fontSize: 32, fontWeight: 900, color: dark ? '#fff' : '#000' }}>{value}</span>
      {sub && <span style={{ fontSize: 13, color: dark ? '#ffffff66' : '#00000066' }}>{sub}</span>}
    </div>
  );
}

// ── Styles ──
const s: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#dd8273', fontFamily: 'var(--font-sans)',
  },
  loginCard: {
    width: '100%', maxWidth: 380, padding: 24, backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
    margin: '0 16px',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
    marginBottom: 16, fontSize: 15, outline: 'none', boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-surface)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 'var(--radius-pill)', backgroundColor: '#1a0e0e',
    color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  card: {
    backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-soft)',
  },
  headerBtn: {
    padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)',
    backgroundColor: 'var(--color-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#dd8273', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
};
