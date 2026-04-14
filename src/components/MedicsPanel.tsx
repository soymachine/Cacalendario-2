import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  blood: 'Sangre', aspect: 'Aspecto', odor: 'Olor', pain: 'Dolor',
};

interface PatientLink {
  id: string;
  patient_id: string | null;
  invite_code: string;
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
}

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
  entry_id: string;
  created_at: string;
}

interface PatientDetail {
  entries: PatientEntry[];
  totalEntries: number;
  bristolAvg: number | null;
  lastEntryDate: string | null;
  daysSinceLast: number | null;
}

type Section = 'pacientes' | 'invitar' | 'config';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'pacientes', icon: '\u{1F465}', label: 'Pacientes' },
  { id: 'invitar', icon: '\u{2795}', label: 'Invitar Paciente' },
  { id: 'config', icon: '\u2699\uFE0F', label: 'Configuración' },
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
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e0e0e0 ${pct}%, #e0e0e0 100%)`,
      }}
    />
  );
}

export default function MedicsPanel() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>('pacientes');
  const [patients, setPatients] = useState<PatientLink[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientLink | null>(null);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState<'off' | 'email' | 'sent'>('off');
  const [registerMode, setRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState<'email' | 'password' | 'done'>('email');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [pendingCenterName, setPendingCenterName] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<'estado' | 'nombre'>('estado');
  const [configName, setConfigName] = useState('');
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
  });

  const applyDoctorInfo = (info: DoctorInfo) => {
    setDoctorInfo(info);
    setConfigName(info.name);
    setConfigGreen(info.semaforo_green);
    setConfigRed(info.semaforo_red);

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

    const palette = info.palette || 'terracotta';
    if (palette.startsWith('custom:')) {
      const parts = palette.split(':');
      setCustomColor1('#' + (parts[1] || 'dd8273'));
      setCustomColor2('#' + (parts[2] || '1a0e0e'));
      setConfigPalette('custom');
    } else {
      setConfigPalette(palette);
    }
  };

  // ── Recover session on mount ──
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('*, centers(name, image_url)')
            .eq('id', session.user.id)
            .single();
          if (doctorData) {
            applyDoctorInfo(buildDoctorInfo(doctorData));
            setLoggedIn(true);
          }
        }
      } catch (_) {
        // Session expired or invalid — stay on login
      }
      setInitialLoading(false);
    };
    recoverSession();
  }, []);

  // ── Login ──
  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        setError('No se pudo iniciar sesión');
        setLoading(false);
        return;
      }

      // Check if the user is already a doctor
      let { data: doctorData } = await supabase
        .from('doctors')
        .select('*, centers(name, image_url)')
        .eq('id', data.user.id)
        .single();

      // If not found, check if there's a pending invitation by email
      if (!doctorData) {
        const userEmail = data.user.email?.toLowerCase();
        if (userEmail) {
          const { data: pendingCenter } = await supabase
            .from('centers')
            .select('*')
            .eq('pending_doctor_email', userEmail)
            .limit(1)
            .single();

          if (pendingCenter) {
            const { error: insertErr } = await supabase.from('doctors').insert({
              id: data.user.id,
              center_id: pendingCenter.id,
              name: pendingCenter.pending_doctor_name || userEmail.split('@')[0],
              specialty: pendingCenter.pending_doctor_specialty || null,
            });

            if (!insertErr) {
              await supabase.from('centers').update({
                pending_doctor_email: null,
                pending_doctor_name: null,
                pending_doctor_specialty: null,
              }).eq('id', pendingCenter.id);

              const { data: newDoctor } = await supabase
                .from('doctors')
                .select('*, centers(name, image_url)')
                .eq('id', data.user.id)
                .single();
              doctorData = newDoctor;
            }
          }
        }
      }

      if (!doctorData) {
        setError('No tienes permisos de acceso médico. Pide a tu administrador que te vincule a un centro.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      applyDoctorInfo(buildDoctorInfo(doctorData));
      setLoggedIn(true);
    } catch (err) {
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // ── Load patients ──
  const loadPatients = async () => {
    if (!doctorInfo) return;
    const { data, error: loadError } = await supabase
      .from('patient_links')
      .select('*')
      .eq('doctor_id', doctorInfo.id)
      .order('invited_at', { ascending: false });
    if (loadError) {
      setError(loadError.message);
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
  };

  useEffect(() => {
    if (!loggedIn || !doctorInfo) return;
    loadPatients();
  }, [loggedIn, doctorInfo]);

  // ── Invite patient ──
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleInvite = async (useEmail: boolean) => {
    setError('');
    setEmailSent(false);
    setEmailError('');
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('doctor_create_invite', {
        p_patient_email: useEmail && inviteEmail ? inviteEmail : null,
      });
      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      if (data) {
        setInviteCode(data.invite_code);

        // Send email if email was provided
        if (useEmail && inviteEmail) {
          try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke('send-invite-email', {
              body: {
                patientEmail: inviteEmail,
                inviteCode: data.invite_code,
                doctorName: doctorInfo?.name || '',
                centerName: doctorInfo?.center_name || '',
              },
            });
            if (fnError) {
              console.error('Edge Function error:', fnError);
              setEmailError(`No se pudo enviar el email: ${fnError.message || JSON.stringify(fnError)}`);
            } else if (fnData?.error) {
              console.error('Email service error:', fnData.error, fnData.details);
              setEmailError(`No se pudo enviar el email: ${fnData.error}${fnData.details ? ' — ' + fnData.details : ''}`);
            } else {
              setEmailSent(true);
            }
          } catch (e: any) {
            console.error('Email catch error:', e);
            setEmailError(`No se pudo enviar el email: ${e?.message || 'Error desconocido'}`);
          }
        }

        setInviteEmail('');
        loadPatients();
      }
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
      entry_id: e.entry_id || '',
      created_at: e.created_at,
    }));

    const bristolValues = entryList.filter(e => e.bristol != null).map(e => e.bristol!);
    const bristolAvg = bristolValues.length > 0 ? bristolValues.reduce((a, b) => a + b, 0) / bristolValues.length : null;
    const lastEntryDate = entryList.length > 0 ? entryList[0].date : null;
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

    setPatientDetail({
      entries: entryList,
      totalEntries: entryList.length,
      bristolAvg,
      lastEntryDate,
      daysSinceLast,
    });
    setLoading(false);
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).catch(() => {});
    }
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
    if (resetError) { setError(resetError.message); return; }
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
    if (!pendingCenter) {
      setError('Este email no está asociado a ningún centro. Contacta con tu administrador.');
      return;
    }
    setPendingCenterName(pendingCenter.name);
    setRegisterStep('password');
  };

  const handleRegisterCreate = async () => {
    setError('');
    if (!registerPassword || registerPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: registerEmail.trim().toLowerCase(),
      password: registerPassword,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setRegisterStep('done');
  };

  // ── Save config ──
  const handleSaveConfig = async () => {
    if (!doctorInfo) return;
    setLoading(true);
    const trimmedName = configName.trim() || doctorInfo.name;
    const paletteToSave = configPalette === 'custom'
      ? `custom:${customColor1.replace('#', '')}:${customColor2.replace('#', '')}`
      : configPalette;
    const { error: updateErr } = await supabase
      .from('doctors')
      .update({ name: trimmedName, semaforo_green: configGreen, semaforo_red: configRed, palette: paletteToSave })
      .eq('id', doctorInfo.id);
    setLoading(false);
    if (!updateErr) {
      const updated = { ...doctorInfo, name: trimmedName, semaforo_green: configGreen, semaforo_red: configRed, palette: paletteToSave };
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
      };
      setSelectedPatient(updated);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
      setPatientConfigSaved(true);
      setTimeout(() => setPatientConfigSaved(false), 3000);
    }
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
      <div style={{ ...ts.loginContainer, flexDirection: 'column' as const }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <span style={{ fontSize: 40 }}>{'\u{1F3E5}'}</span>
          <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  // ── Login / Register screen ──
  if (!loggedIn) {
    return (
      <div style={{ ...ts.loginContainer, flexDirection: 'column' as const }}>
        <div style={s.loginCard}>
          <div style={{ marginBottom: 28 }}>
            <img src="/fluxia-logo.png" alt="Fluxia" style={{ width: '100%', maxHeight: 80, objectFit: 'contain', display: 'block', marginBottom: 16 }} />
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
              {forgotMode !== 'off' ? 'Recuperar contraseña' : registerMode ? 'Completar registro' : 'Acceso para profesionales'}
            </p>
          </div>

          {forgotMode === 'email' ? (
            <>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <label style={s.label}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()} style={s.input} />
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button onClick={handleForgotPassword} disabled={loading} style={{ ...ts.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Enviar enlace'}
              </button>
              <button
                onClick={() => { setForgotMode('off'); setError(''); }}
                style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : forgotMode === 'sent' ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 40 }}>✅</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: th.dark, marginTop: 12 }}>¡Email enviado!</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada (y spam).
                </p>
              </div>
              <button
                onClick={() => { setForgotMode('off'); setError(''); setPassword(''); }}
                style={{ ...ts.btnPrimary, marginTop: 20 }}
              >
                Volver al login
              </button>
            </>
          ) : !registerMode ? (
            <>
              <label style={s.label}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} />
              <label style={s.label}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={s.input} />
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button onClick={handleLogin} disabled={loading} style={{ ...ts.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Entrar'}
              </button>
              <button
                onClick={() => { setForgotMode('email'); setError(''); }}
                style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => { setRegisterMode(true); setRegisterStep('email'); setError(''); setRegisterEmail(''); setRegisterPassword(''); }}
                style={{ width: '100%', marginTop: 4, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Completar registro
              </button>
            </>
          ) : registerStep === 'email' ? (
            <>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                Introduce el email con el que tu administrador te ha dado de alta.
              </p>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegisterCheckEmail()}
                placeholder="tu@email.com"
                style={s.input}
              />
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button onClick={handleRegisterCheckEmail} disabled={loading} style={{ ...ts.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Continuar'}
              </button>
              <button
                onClick={() => { setRegisterMode(false); setError(''); }}
                style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : registerStep === 'password' ? (
            <>
              <div style={{ backgroundColor: `${th.primary}20`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: th.dark, margin: 0 }}>
                  {'\u{1F3E5}'} {pendingCenterName}
                </p>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{registerEmail}</p>
              </div>
              <label style={s.label}>Elige una contraseña</label>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegisterCreate()}
                placeholder="Mínimo 6 caracteres"
                style={s.input}
              />
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <button onClick={handleRegisterCreate} disabled={loading} style={{ ...ts.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : 'Finalizar registro'}
              </button>
              <button
                onClick={() => { setRegisterStep('email'); setError(''); }}
                style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Volver
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 40 }}>{'\u{1F4E7}'}</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: th.dark, marginTop: 12 }}>¡Revisa tu email!</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                  Hemos enviado un enlace de confirmación a <strong>{registerEmail}</strong>.
                  Confirma tu cuenta y después inicia sesión aquí.
                </p>
              </div>
              <button
                onClick={() => { setRegisterMode(false); setEmail(registerEmail); setError(''); }}
                style={{ ...ts.btnPrimary, marginTop: 20 }}
              >
                Ir a iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main layout with sidebar ──
  return (
    <div style={s.shell}>
      {/* ── SIDEBAR (desktop) ── */}
      <aside style={{ ...s.sidebar, backgroundColor: th.dark, display: isMobile ? 'none' : 'flex' }}>
        {/* Center image header */}
        <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 10 }}>
          <div style={{ width: '100%', aspectRatio: '16/7', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: th.navActive, border: `1px solid ${th.border}` }}>
            {centerImageUrl ? (
              <img src={centerImageUrl} alt="Centro" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} />
            ) : (
              <span style={{ fontSize: 36 }}>{'\u{1F3E5}'}</span>
            )}
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: th.primary, lineHeight: 1.2 }}>{doctorInfo?.center_name || 'Centro médico'}</div>
            <div style={{ fontSize: 11, color: th.textMuted, marginTop: 2 }}>Dr. {doctorInfo?.name}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.sidebarNav}>
          <div style={{ fontSize: 9, fontWeight: 900, color: th.menuLabel, marginBottom: 4, letterSpacing: 1 }}>MENÚ PRINCIPAL</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSelectedPatient(null); setPatientDetail(null); }}
              style={{
                ...s.navItem,
                backgroundColor: section === item.id ? th.navActive : 'transparent',
                color: section === item.id ? th.primary : th.textMuted,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: section === item.id ? 500 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${th.border}`, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: th.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {(doctorInfo?.name || 'D')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {doctorInfo?.name}</div>
              <div style={{ fontSize: 11, color: th.textMuted }}>{doctorInfo?.specialty || 'Médico'}</div>
            </div>
          </div>
          <button
            onClick={() => { supabase.auth.signOut(); setLoggedIn(false); setDoctorInfo(null); }}
            style={{ ...s.navItem, color: th.logoutColor, width: '100%' }}
          >
            <span style={{ fontSize: 14 }}>{'\u{1F6AA}'}</span>
            <span style={{ fontSize: 13 }}>Cerrar sesión</span>
          </button>
          <div style={{ fontSize: 10, color: '#ffffff', marginTop: 8, paddingLeft: 4 }}>{APP_VERSION}</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ ...s.main, backgroundColor: th.primary, marginLeft: isMobile ? 0 : 260, padding: isMobile ? 16 : 32, paddingBottom: isMobile ? 80 : 32 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Cargando...</div>}

        {/* ── PACIENTES ── */}
        {section === 'pacientes' && !selectedPatient && (
          <>
            <SectionHeader
              title="Mis Pacientes"
              subtitle={`${acceptedPatients.length} pacientes vinculados · ${pendingPatients.length} pendientes`}
              actions={<button onClick={loadPatients} style={s.headerBtn}>{'\u{1F504}'} Actualizar</button>}
            />
            <div style={s.card}>
              {/* Sort controls + Column headers */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', backgroundColor: '#00000008', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>Ordenar por:</span>
                {(['estado', 'nombre'] as const).map(opt => (
                  <button key={opt} onClick={() => setSortBy(opt)} style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    backgroundColor: sortBy === opt ? th.dark : '#00000010',
                    color: sortBy === opt ? '#fff' : '#666',
                  }}>
                    {opt === 'estado' ? 'Estado' : 'Nombre'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const, borderBottom: '1px solid #00000010' }}>
                <span style={{ width: 40 }}></span>
                <span style={{ flex: 2 }}>Paciente</span>
                {!isMobile && <span style={{ flex: 1 }}>Último registro / Código</span>}
                {!isMobile && <span style={{ width: 44, textAlign: 'center' as const }}>🔔</span>}
                <span style={{ width: isMobile ? 90 : 140 }}>Estado</span>
              </div>
              {patients.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No hay pacientes. Invita a tu primer paciente desde la sección "Invitar Paciente".
                </div>
              ) : (
                [...patients].sort((a, b) => {
                  if (sortBy === 'estado') {
                    if (a.status === b.status) return patientLabel(a).localeCompare(patientLabel(b));
                    return a.status === 'accepted' ? -1 : 1;
                  }
                  return patientLabel(a).localeCompare(patientLabel(b));
                }).map((patient, i) => {
                  const isAccepted = patient.status === 'accepted';
                  const pGreen = patient.semaforo_override ? (patient.semaforo_green_override ?? doctorInfo?.semaforo_green ?? 1) : undefined;
                  const pRed = patient.semaforo_override ? (patient.semaforo_red_override ?? doctorInfo?.semaforo_red ?? 3) : undefined;
                  const semaforo = getSemaforo(patient.daysSinceLast, pGreen, pRed);
                  return (
                    <div key={patient.id} onClick={() => isAccepted && loadPatientDetail(patient)} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '12px 16px' : '14px 20px', borderBottom: i < patients.length - 1 ? '1px solid #00000010' : 'none', cursor: isAccepted ? 'pointer' : 'default' }}>
                      {/* Semáforo */}
                      <div style={{ width: 40 }}>
                        {isAccepted ? (
                          <span style={{ fontSize: 18 }}>{semaforo.icon}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#aaa' }}>—</span>
                        )}
                      </div>
                      {/* Patient name */}
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: isAccepted ? th.primary : th.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {patientInitial(patient)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {patientLabel(patient)}
                          </div>
                          {!isMobile && patient.display_name && patient.patient_email && (
                            <div style={{ fontSize: 11, color: '#999' }}>{patient.patient_email}</div>
                          )}
                        </div>
                      </div>
                      {/* Last entry / invite code — hidden on mobile */}
                      {!isMobile && <div style={{ flex: 1 }}>
                        {isAccepted && patient.lastEntryDate ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                              {patient.daysSinceLast === 0 ? 'Hoy' : `hace ${patient.daysSinceLast} día${patient.daysSinceLast !== 1 ? 's' : ''}`}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>{shortDate(patient.lastEntryDate)}</div>
                          </div>
                        ) : isAccepted ? (
                          <span style={{ fontSize: 12, color: '#aaa' }}>Sin registros</span>
                        ) : (
                          <span
                            title="Clic para copiar"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(patient.invite_code); }}
                            style={{ fontSize: 12, fontWeight: 700, color: th.primary, letterSpacing: 1, cursor: 'pointer', padding: '2px 6px', borderRadius: 6, backgroundColor: `${th.primary}15` }}
                          >
                            {patient.invite_code}
                          </span>
                        )}
                      </div>}
                      {/* Push notification status — hidden on mobile */}
                      {!isMobile && <div style={{ width: 44, textAlign: 'center' as const, fontSize: 16 }}>
                        {isAccepted && patient.hasPushSub === true && <span title="Notificaciones activas">🔔</span>}
                        {isAccepted && patient.hasPushSub === false && <span title="Sin notificaciones" style={{ opacity: 0.3 }}>🔕</span>}
                        {isAccepted && patient.hasPushSub === null && <span title="Sin datos" style={{ opacity: 0.2, fontSize: 12 }}>—</span>}
                      </div>}
                      {/* Status badge + actions */}
                      <div style={{ width: isMobile ? 90 : 140, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 12,
                          backgroundColor: isAccepted ? '#2ecc7130' : '#f39c1230',
                          color: isAccepted ? '#27ae60' : '#e67e22',
                        }}>
                          {isAccepted ? (isMobile ? '✅' : '✅ Vinculado') : (isMobile ? '⏳' : '⏳ Pendiente')}
                        </span>
                        {!isAccepted && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRevokeInvite(patient); }}
                            title="Eliminar invitación"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ccc', padding: '2px 4px', borderRadius: 4 }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#e74c3c')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#ccc')}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── PATIENT DETAIL ── */}
        {section === 'pacientes' && selectedPatient && patientDetail && (
          <>
            <SectionHeader
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {patientLabel(selectedPatient)}
                  {selectedPatient.hasPushSub === true && (
                    <span title="Notificaciones activas" style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
                  )}
                  {selectedPatient.hasPushSub === false && (
                    <span title="Sin notificaciones" style={{ fontSize: 18, lineHeight: 1, opacity: 0.35 }}>🔕</span>
                  )}
                </span>
              }
              subtitle={`${selectedPatient.display_name && selectedPatient.patient_email ? selectedPatient.patient_email + ' · ' : ''}Vinculado ${selectedPatient.accepted_at ? shortDate(selectedPatient.accepted_at) : ''}`}
              actions={
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => exportPatientPDF(selectedPatient, patientDetail, doctorInfo)} style={{ ...s.headerBtn, backgroundColor: th.dark, color: '#fff' }}>
                    📄 Exportar PDF
                  </button>
                  <button onClick={() => setPatientConfigOpen(true)} style={{ ...s.headerBtn, backgroundColor: th.navActive, color: '#fff' }}>
                    ⚙️ Configuración
                  </button>
                  <button onClick={() => { setSelectedPatient(null); setPatientDetail(null); }} style={s.headerBtn}>
                    ← Volver
                  </button>
                </div>
              }
            />

            {/* Row 1: Semáforo — all inline */}
            <div style={{ ...s.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 28 }}>{getSemaforo(patientDetail.daysSinceLast, effectiveGreen, effectiveRed).icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                {patientDetail.daysSinceLast === null
                  ? 'Sin registros'
                  : patientDetail.daysSinceLast === 0
                    ? 'Último registro: hoy'
                    : `Hace ${patientDetail.daysSinceLast} día${patientDetail.daysSinceLast !== 1 ? 's' : ''}`}
              </span>
              {patientDetail.lastEntryDate && (
                <span style={{ fontSize: 12, color: '#888' }}>· {shortDate(patientDetail.lastEntryDate)}</span>
              )}
              {patientDetail.daysSinceLast !== null && patientDetail.daysSinceLast > 3 && (
                <span style={{ fontSize: 11, color: '#c0392b', fontWeight: 600, marginLeft: 4 }}>⚠️ Varios días sin registrar</span>
              )}
            </div>

            {/* Row 2: Left column (calendar + semáforo) + Right column (entries) */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' as const : 'row' as const, gap: 16, alignItems: 'flex-start' }}>
              {/* Left column: calendar + semáforo override */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, flex: isMobile ? undefined : '0 0 max(25%, 315px)', width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 315 }}>
              <div style={{ ...s.card }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #00000010', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                    else setCalendarMonth(calendarMonth - 1);
                  }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 10px', color: '#555' }}>←</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' as const }}>
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                    else setCalendarMonth(calendarMonth + 1);
                  }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 10px', color: '#555' }}>→</button>
                </div>
                <div style={{ padding: isMobile ? '10px 12px' : '6px 8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 2, marginBottom: isMobile ? 4 : 2 }}>
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: isMobile ? 11 : 8, fontWeight: 700, color: '#aaa', paddingBottom: 2 }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 4 : 2 }}>
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
                          <div key={dateStr} title={`${dateStr}: ${count} registros`} style={{
                            aspectRatio: '1',
                            borderRadius: isMobile ? 6 : 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: hasEntry ? th.primary : isToday ? `${th.primary}20` : 'transparent',
                            opacity: isFuture ? 0.3 : 1,
                            border: isToday ? `1px solid ${th.primary}` : '1px solid #00000008',
                          }}>
                            <span style={{ fontSize: isMobile ? 12 : 9, fontWeight: 600, color: hasEntry ? '#fff' : '#888' }}>{day}</span>
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
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
                  <div style={{ ...s.card, flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined, boxSizing: 'border-box' as const }}>
                    {/* Header + filter bar */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #00000015' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                          Historial
                          {hasFilter
                            ? ` (${filteredEntries.length} de ${patientDetail.totalEntries})`
                            : ` (${patientDetail.totalEntries})`}
                        </span>
                        {hasFilter && (
                          <button onClick={() => { setEntryFilterFrom(''); setEntryFilterTo(''); setEntryPage(0); }}
                            style={{ fontSize: 11, color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            ✕ Limpiar filtro
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>De</span>
                        <input type="date" value={entryFilterFrom}
                          onChange={(e) => { setEntryFilterFrom(e.target.value); setEntryPage(0); }}
                          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', color: '#333' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>a</span>
                        <input type="date" value={entryFilterTo}
                          onChange={(e) => { setEntryFilterTo(e.target.value); setEntryPage(0); }}
                          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0', color: '#333' }} />
                      </div>
                    </div>

                    {filteredEntries.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                        {hasFilter ? 'No hay registros en ese rango de fechas.' : 'Este paciente no tiene registros aún.'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' as const }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', backgroundColor: '#00000008', borderBottom: '1px solid #00000010' }}>
                          <span style={{ width: 32, fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' as const }}></span>
                          <span style={{ width: 130, fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' as const }}>Fecha / Hora</span>
                          <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' as const }}>Datos</span>
                        </div>
                        {pagedEntries.map((entry, i) => {
                          const isUrine = entry.entry_type === 'urine';
                          const bristolColor = entry.bristol == null ? null : entry.bristol >= 3 && entry.bristol <= 5 ? '#27ae60' : entry.bristol < 3 ? '#f39c12' : '#e74c3c';
                          const chip = (label: string, bg: string, color: string) => (
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, backgroundColor: bg, color, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{label}</span>
                          );
                          return (
                            <div key={entry.entry_id || i} style={{ borderBottom: i < pagedEntries.length - 1 ? '1px solid #00000008' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '10px 16px', gap: 0 }}>
                                {/* Type icon */}
                                <div style={{ width: 32, paddingTop: 2 }}>
                                  <span style={{ fontSize: 16 }}>{isUrine ? '💧' : '💩'}</span>
                                </div>
                                {/* Date / time */}
                                <div style={{ width: 130 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{shortDate(entry.date)}</span>
                                  {entry.time && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>{entry.time}</span>}
                                </div>
                                {/* Type-specific data */}
                                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap' as const, gap: 4, alignItems: 'center' }}>
                                  {isUrine ? (
                                    <>
                                      {entry.urine_type != null && chip(URINE_TYPE_LABEL[entry.urine_type] || entry.urine_type, '#3498db15', '#2980b9')}
                                      {entry.urine_quantity != null && entry.urine_quantity > 0 && chip(`${entry.urine_quantity} ml`, '#9b59b615', '#8e44ad')}
                                      {entry.urine_color && <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', backgroundColor: entry.urine_color, border: '1px solid #00000020', verticalAlign: 'middle' }} />}
                                      {entry.urine_characteristics.length > 0
                                        ? entry.urine_characteristics.map(c => chip(URINE_CHAR_LABEL[c] || c, '#e74c3c12', '#c0392b'))
                                        : null}
                                      {entry.urine_type == null && entry.urine_quantity === 0 && entry.urine_characteristics.length === 0 && <span style={{ color: '#ddd', fontSize: 12 }}>—</span>}
                                    </>
                                  ) : (
                                    <>
                                      {entry.bristol != null && chip(`T${entry.bristol}`, `${bristolColor}20`, bristolColor!)}
                                      {entry.floats != null && chip(FLOATS_LABEL[entry.floats], '#3498db15', '#2980b9')}
                                      {entry.color && <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', backgroundColor: entry.color, border: '1px solid #00000020', verticalAlign: 'middle' }} />}
                                      {entry.quantity != null && chip(`${entry.quantity}`, '#9b59b615', '#8e44ad')}
                                      {entry.duration != null && chip(DURATION_LABEL[entry.duration], '#f39c1215', '#e67e22')}
                                      {entry.symptoms.length > 0
                                        ? entry.symptoms.map(s => chip(SYMPTOM_LABEL[s] || s, '#e74c3c12', '#c0392b'))
                                        : null}
                                      {entry.bristol == null && entry.floats == null && !entry.color && entry.quantity == null && entry.symptoms.length === 0 && <span style={{ color: '#ddd', fontSize: 12 }}>—</span>}
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Notes row — only if present */}
                              {entry.notes && (
                                <div style={{ padding: '0 16px 10px 178px' }}>
                                  <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>{entry.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #00000010', backgroundColor: '#00000005' }}>
                        <button onClick={() => setEntryPage(p => Math.max(0, p - 1))} disabled={entryPage === 0}
                          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #e0e0e0', backgroundColor: '#fff', cursor: entryPage === 0 ? 'default' : 'pointer', fontSize: 13, opacity: entryPage === 0 ? 0.4 : 1 }}>
                          ← Anterior
                        </button>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          Página <strong>{entryPage + 1}</strong> de <strong>{totalPages}</strong>
                          <span style={{ color: '#aaa' }}> · {filteredEntries.length} registros</span>
                        </span>
                        <button onClick={() => setEntryPage(p => Math.min(totalPages - 1, p + 1))} disabled={entryPage === totalPages - 1}
                          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #e0e0e0', backgroundColor: '#fff', cursor: entryPage === totalPages - 1 ? 'default' : 'pointer', fontSize: 13, opacity: entryPage === totalPages - 1 ? 0.4 : 1 }}>
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
              <div
                onClick={() => setPatientConfigOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 200,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: '100%', maxWidth: 420, height: '100%',
                    backgroundColor: '#F5F5F5',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column' as const,
                  }}
                >
                  {/* Modal header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', backgroundColor: th.dark, color: '#fff', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      ⚙️ Configuración — {selectedPatient.display_name || selectedPatient.patient_email}
                    </span>
                    <button
                      onClick={() => setPatientConfigOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal content */}
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

                    {/* Semáforo personalizado */}
                    <div style={{ ...s.card, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: patientSemaforoOverride ? 14 : 0 }}>
                        <Switch
                          checked={patientSemaforoOverride}
                          onChange={setPatientSemaforoOverride}
                          style={{ backgroundColor: patientSemaforoOverride ? th.primary : undefined }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>🚦 Semáforo personalizado</span>
                        {!patientSemaforoOverride && (
                          <span style={{ fontSize: 11, color: '#aaa' }}>usa valores generales</span>
                        )}
                      </div>

                      {patientSemaforoOverride && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ flex: 1, backgroundColor: '#2ecc7115', borderRadius: 8, padding: '6px 8px', borderLeft: '3px solid #27ae60', display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: 12 }}>🟢</span>
                              <span style={{ fontSize: 10, color: '#27ae60', fontWeight: 700 }}>≤ {patientSemaforoGreen}d</span>
                            </div>
                            <SemaforoSlider value={patientSemaforoGreen} min={0} max={Math.max(patientSemaforoRed - 1, 1)} color="#27ae60"
                              onChange={(v) => { setPatientSemaforoGreen(v); if (v >= patientSemaforoRed) setPatientSemaforoRed(v + 1); }} />
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#f39c1215', borderRadius: 8, padding: '6px 8px', borderLeft: '3px solid #f39c12', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: 12 }}>🟠</span>
                              <span style={{ fontSize: 10, color: '#e67e22', fontWeight: 700 }}>{patientSemaforoGreen + 1}–{patientSemaforoRed}d</span>
                            </div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#e74c3c15', borderRadius: 8, padding: '6px 8px', borderLeft: '3px solid #e74c3c', display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: 12 }}>🔴</span>
                              <span style={{ fontSize: 10, color: '#e74c3c', fontWeight: 700 }}>&gt; {patientSemaforoRed}d</span>
                            </div>
                            <SemaforoSlider value={patientSemaforoRed} min={Math.max(patientSemaforoGreen + 1, 1)} max={30} color="#e74c3c"
                              onChange={(v) => { setPatientSemaforoRed(v); if (v <= patientSemaforoGreen) setPatientSemaforoGreen(v - 1); }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Campos del formulario */}
                    <div style={{ ...s.card }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #00000010', fontSize: 13, fontWeight: 700, color: '#111' }}>
                        📋 Campos del formulario
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Tipo de registro permitido</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[
                              { value: 'both', label: 'Ambas opciones' },
                              { value: 'poop_only', label: 'Solo deposición' },
                              { value: 'urine_only', label: 'Solo micción' },
                            ].map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setPatientEntryTypeMode(opt.value)}
                                style={{
                                  flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                  fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                                  backgroundColor: patientEntryTypeMode === opt.value ? th.primary : '#f0f0f0',
                                  color: patientEntryTypeMode === opt.value ? '#fff' : '#555',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.5 }}>
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
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#aaa', letterSpacing: 0.5, textTransform: 'uppercase' as const, padding: i === 0 ? '4px 0 6px' : '12px 0 6px', borderTop: i !== 0 ? '1px solid #00000010' : 'none' }}>
                                  {field.group}
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #00000008' : 'none' }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{field.label}</span>
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
                    <div style={{ ...s.card }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #00000010', fontSize: 13, fontWeight: 700, color: '#111' }}>
                        🔔 Notificaciones push
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                        <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.5 }}>
                          Recordatorio automático cuando el paciente lleva X horas sin registrar.
                        </p>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>
                            Horas sin registrar antes de notificar
                          </label>
                          <input
                            type="number" min={1} max={168} value={patientPushMinHours}
                            onChange={e => setPatientPushMinHours(Number(e.target.value))}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#333', boxSizing: 'border-box' as const }}
                          />
                          <span style={{ fontSize: 11, color: '#aaa' }}>Por defecto: 24h</span>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>
                            Veces al día que se notifica (cada {Math.round(24 / Math.max(1, patientPushFrequency))}h)
                          </label>
                          <input
                            type="number" min={1} max={24} value={patientPushFrequency}
                            onChange={e => setPatientPushFrequency(Number(e.target.value))}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, color: '#333', boxSizing: 'border-box' as const }}
                          />
                          <span style={{ fontSize: 11, color: '#aaa' }}>Por defecto: 2 (cada 12h)</span>
                        </div>
                        <div style={{ borderTop: '1px solid #00000010', paddingTop: 12 }}>
                          <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.5 }}>
                            Envía una notificación ahora para verificar que funciona correctamente.
                          </p>
                          <button
                            onClick={handleSendTestPush}
                            disabled={pushTestStatus === 'sending' || !selectedPatient?.hasPushSub}
                            style={{
                              width: '100%', padding: '8px 14px', fontSize: 12, fontWeight: 700,
                              borderRadius: 8, border: `2px solid ${th.primary}`, cursor: selectedPatient?.hasPushSub ? 'pointer' : 'not-allowed',
                              backgroundColor: 'transparent', color: th.primary, opacity: selectedPatient?.hasPushSub ? 1 : 0.4,
                            }}
                          >
                            {pushTestStatus === 'sending' ? '⏳ Enviando...' : '🔔 Enviar notificación de prueba'}
                          </button>
                          {!selectedPatient?.hasPushSub && (
                            <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>El paciente no tiene notificaciones activadas.</p>
                          )}
                          {pushTestStatus === 'ok' && (
                            <p style={{ fontSize: 12, color: '#27ae60', fontWeight: 600, marginTop: 8 }}>✅ Notificación enviada</p>
                          )}
                          {pushTestStatus === 'error' && (
                            <p style={{ fontSize: 12, color: '#e74c3c', fontWeight: 600, marginTop: 8 }}>❌ {pushTestError}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Single save button for all sections */}
                    <div style={{ paddingBottom: 8 }}>
                      {patientConfigSaved && (
                        <div style={{ fontSize: 13, color: '#27ae60', fontWeight: 600, marginBottom: 8, textAlign: 'center' as const }}>✅ Configuración guardada</div>
                      )}
                      {patientConfigError && (
                        <div style={{ fontSize: 12, color: '#e74c3c', fontWeight: 600, marginBottom: 8 }}>❌ {patientConfigError}</div>
                      )}
                      <button onClick={handleSavePatientConfig} style={{ ...ts.btnPrimary, width: '100%', padding: '13px 0', fontSize: 14, borderRadius: 12 }}>
                        Guardar configuración
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── INVITAR PACIENTE ── */}
        {section === 'invitar' && (
          <>
            <SectionHeader
              title="Invitar Paciente"
              subtitle="Genera un código de vinculación para tu paciente"
            />

            <div style={s.card}>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
                {/* Option 1: By email */}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 12 }}>Opción 1: Por email</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Email del paciente</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="paciente@email.com"
                        style={{ ...s.input, marginBottom: 0 }}
                      />
                    </div>
                    <button
                      onClick={() => handleInvite(true)}
                      disabled={loading || !inviteEmail}
                      style={{
                        ...s.headerBtn,
                        backgroundColor: th.dark,
                        color: '#fff',
                        height: 44,
                        opacity: loading || !inviteEmail ? 0.5 : 1,
                      }}
                    >
                      Enviar invitación
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid #00000010', paddingTop: 0 }} />

                {/* Option 2: Generic code */}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 12 }}>Opción 2: Código genérico</div>
                  <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                    Genera un código que puedes compartir directamente con tu paciente.
                  </p>
                  <button
                    onClick={() => handleInvite(false)}
                    disabled={loading}
                    style={{
                      ...s.headerBtn,
                      backgroundColor: th.primary,
                      color: '#fff',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Generar código
                  </button>
                </div>

                {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}

                {/* Generated code display */}
                {inviteCode && (
                  <div style={{
                    backgroundColor: '#f9f9f9',
                    borderRadius: 16,
                    padding: 32,
                    textAlign: 'center',
                    border: `2px dashed ${th.primary}`,
                  }}>
                    {emailSent && (
                      <div style={{ backgroundColor: '#2ecc7120', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>✅</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#27ae60' }}>Email enviado correctamente</span>
                      </div>
                    )}
                    {emailError && (
                      <div style={{ backgroundColor: '#f39c1220', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <span style={{ fontSize: 12, color: '#e67e22' }}>{emailError}</span>
                      </div>
                    )}
                    <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>
                      {emailSent ? 'Email enviado. También puedes compartir el código:' : 'Comparte este código con tu paciente'}
                    </p>
                    <div style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: th.dark,
                      letterSpacing: 6,
                      fontFamily: 'monospace',
                      marginBottom: 16,
                    }}>
                      {inviteCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      style={{
                        ...s.headerBtn,
                        backgroundColor: th.dark,
                        color: '#fff',
                        padding: '10px 24px',
                      }}
                    >
                      {'\u{1F4CB}'} Copiar código
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div style={s.card}>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 12 }}>{'\u{1F4D6}'} Instrucciones para el paciente</div>
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
                  <p style={{ margin: '0 0 8px' }}>El paciente debe seguir estos pasos:</p>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Abrir la app</li>
                    <li>Ir a <strong>Ajustes</strong></li>
                    <li>Pulsar en <strong>Vincular con mi médico</strong></li>
                    <li>Introducir el código proporcionado</li>
                  </ol>
                  <p style={{ margin: '12px 0 0', color: '#999', fontSize: 13 }}>
                    Una vez vinculado, podrás ver los registros del paciente desde tu panel.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {section === 'config' && (
          <>
            <SectionHeader
              title="Configuración"
              subtitle="Ajusta tu perfil y los parámetros del semáforo"
            />

            {/* ── Config grid layout ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 16,
              maxWidth: 1550,
            }}>

              {/* Col 1 Row 1 — Datos del médico */}
              <div style={{ ...s.card, gridColumn: 1, gridRow: 1 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #00000010' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>👤 Datos del médico</span>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  <div>
                    <label style={s.label}>Nombre</label>
                    <input
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      style={{ ...s.input, marginBottom: 0 }}
                      placeholder="Dr. Nombre Apellido"
                    />
                  </div>
                  <div>
                    <label style={s.label}>Centro médico</label>
                    <input
                      type="text"
                      value={doctorInfo?.center_name || ''}
                      disabled
                      style={{ ...s.input, marginBottom: 0, backgroundColor: '#f5f5f5', color: '#999' }}
                    />
                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Gestionado por el administrador.</p>
                  </div>
                  {configSaved && (
                    <div style={{ backgroundColor: '#2ecc7120', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✅</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#27ae60' }}>Guardado</span>
                    </div>
                  )}
                  <button onClick={handleSaveConfig} disabled={loading}
                    style={{ ...ts.btnPrimary, padding: '9px 20px', opacity: loading ? 0.5 : 1 }}>
                    {loading ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Col 2 Rows 1–2 — Imagen del centro */}
              <div style={{ ...s.card, gridColumn: isMobile ? 1 : 2, gridRow: isMobile ? 'auto' : '1 / span 2' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #00000010' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>🏥 Imagen del centro</span>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column' as const, gap: 14, alignItems: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, border: '2px dashed #ddd', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                    {centerImageUrl ? (
                      <img src={centerImageUrl} alt="Centro" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} />
                    ) : (
                      <span style={{ fontSize: 32 }}>🏥</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#888', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                    Aparecerá en la app de los pacientes vinculados.
                  </p>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...ts.btnPrimary, padding: '9px 18px', cursor: 'pointer', opacity: uploadingImage ? 0.5 : 1 } as React.CSSProperties}>
                    {uploadingImage ? 'Subiendo...' : '📤 Subir imagen'}
                    <input type="file" accept="image/*" disabled={uploadingImage} style={{ display: 'none' }}
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
                  </label>
                  <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>PNG, JPG o WEBP · Máx 2 MB</p>
                </div>
              </div>

              {/* Col 1 Row 2 — Semáforo */}
              <div style={{ ...s.card, gridColumn: 1, gridRow: isMobile ? 'auto' : 2 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #00000010' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>🚦 Semáforo</span>
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, backgroundColor: '#2ecc7115', borderRadius: 8, padding: '8px 10px', borderLeft: '3px solid #27ae60', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 14 }}>🟢</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#27ae60' }}>≤ {configGreen}d</span>
                      </div>
                      <SemaforoSlider value={configGreen} min={0} max={Math.max(configRed - 1, 1)} color="#27ae60"
                        onChange={(val) => { setConfigGreen(val); if (val >= configRed) setConfigRed(val + 1); }} />
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f39c1215', borderRadius: 8, padding: '8px 10px', borderLeft: '3px solid #f39c12', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 14 }}>🟠</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#e67e22' }}>{configGreen + 1}–{configRed}d</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#e74c3c15', borderRadius: 8, padding: '8px 10px', borderLeft: '3px solid #e74c3c', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 14 }}>🔴</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#e74c3c' }}>&gt;{configRed}d</span>
                      </div>
                      <SemaforoSlider value={configRed} min={Math.max(configGreen + 1, 1)} max={30} color="#e74c3c"
                        onChange={(val) => { setConfigRed(val); if (val <= configGreen) setConfigGreen(val - 1); }} />
                    </div>
                  </div>
                  {configSaved && (
                    <div style={{ backgroundColor: '#2ecc7120', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✅</span><span style={{ fontSize: 12, fontWeight: 600, color: '#27ae60' }}>Guardado</span>
                    </div>
                  )}
                  <button onClick={handleSaveConfig} disabled={loading}
                    style={{ ...ts.btnPrimary, padding: '9px 20px', opacity: loading ? 0.5 : 1 }}>
                    {loading ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              {/* Cols 1–2 Row 3 — Paleta de colores */}
              <div style={{ ...s.card, gridColumn: isMobile ? 1 : '1 / span 2', gridRow: isMobile ? 'auto' : 3 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #00000010' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>🎨 Paleta de colores</span>
                </div>
                <div style={{ padding: 18 }}>
                  <p style={{ fontSize: 13, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                    Elige la paleta del portal. El cambio se aplica al instante y se guarda con la configuración.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginBottom: 14 }}>
                    {PALETTES.map(p => {
                      const isActive = configPalette === p.id;
                      return (
                        <button key={p.id} onClick={() => setConfigPalette(p.id)} title={p.name}
                          style={{
                            display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5,
                            padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                            backgroundColor: isActive ? '#00000012' : 'transparent',
                            outline: isActive ? `2px solid ${p.theme.primary}` : '2px solid transparent',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${p.theme.primary} 50%, ${p.theme.secondary} 50%)`,
                            boxShadow: isActive ? `0 0 0 3px ${p.theme.primary}50` : 'none',
                          }} />
                          <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: '#444' }}>{p.name}</span>
                        </button>
                      );
                    })}

                    {/* Custom palette option */}
                    <button onClick={() => setConfigPalette('custom')} title="Personalizable"
                      style={{
                        display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5,
                        padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        backgroundColor: configPalette === 'custom' ? '#00000012' : 'transparent',
                        outline: configPalette === 'custom' ? `2px solid ${customColor1}` : '2px dashed #ccc',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: configPalette === 'custom'
                          ? `linear-gradient(135deg, ${customColor1} 50%, ${customColor2} 50%)`
                          : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
                        boxShadow: configPalette === 'custom' ? `0 0 0 3px ${customColor1}50` : 'none',
                      }} />
                      <span style={{ fontSize: 10, fontWeight: configPalette === 'custom' ? 700 : 400, color: '#444' }}>Personalizable</span>
                    </button>
                  </div>

                  {/* Custom color pickers */}
                  {configPalette === 'custom' && (
                    <div style={{ backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
                            Color primario
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="color" value={customColor1} onChange={e => setCustomColor1(e.target.value)}
                              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #ddd', cursor: 'pointer', padding: 2 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>{customColor1}</span>
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>
                            Color oscuro / fondo
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="color" value={customColor2} onChange={e => setCustomColor2(e.target.value)}
                              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #ddd', cursor: 'pointer', padding: 2 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>{customColor2}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preview strip */}
                      <div style={{ borderRadius: 8, overflow: 'hidden', display: 'flex', height: 36 }}>
                        <div style={{ flex: 1, backgroundColor: customColor1 }} />
                        <div style={{ flex: 1, background: `linear-gradient(90deg, ${customColor1}, ${customColor2})` }} />
                        <div style={{ flex: 1, backgroundColor: customColor2 }} />
                      </div>

                      {/* Extract from image button */}
                      <button
                        onClick={handleExtractColors}
                        disabled={!centerImageUrl || extractingColors}
                        style={{
                          padding: '9px 16px', borderRadius: 8, border: `2px solid ${customColor1}`,
                          backgroundColor: 'transparent', color: customColor1,
                          fontSize: 13, fontWeight: 700, cursor: centerImageUrl ? 'pointer' : 'not-allowed',
                          opacity: !centerImageUrl || extractingColors ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {extractingColors ? '⏳ Analizando...' : '🎨 Colores automáticos desde la imagen'}
                      </button>
                      {!centerImageUrl && (
                        <p style={{ fontSize: 11, color: '#aaa', margin: '-8px 0 0' }}>
                          Sube una imagen del centro para usar esta opción.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Save button always visible in palette section */}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={handleSaveConfig} disabled={loading}
                      style={{ ...ts.btnPrimary, width: 'auto', padding: '9px 24px', opacity: loading ? 0.5 : 1 }}>
                      {loading ? '...' : 'Guardar paleta'}
                    </button>
                    {configSaved && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>✅</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#27ae60' }}>Guardado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            {isMobile && (
              <div style={{ textAlign: 'center', padding: '16px 0 4px', color: '#00000030', fontSize: 11 }}>{APP_VERSION}</div>
            )}
          </>
        )}
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: th.dark, display: 'flex', zIndex: 20, borderTop: `1px solid ${th.border}` }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSelectedPatient(null); setPatientDetail(null); }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0', border: 'none', cursor: 'pointer', background: 'transparent',
                borderTop: section === item.id ? `2px solid ${th.primary}` : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: section === item.id ? th.primary : th.textMuted }}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── IMAGE UPLOAD MODAL ── */}
      {imageModal && (
        <div
          onClick={() => setImageModal(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}
          >
            <button
              onClick={() => setImageModal(null)}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa', lineHeight: 1 }}
            >
              ×
            </button>

            {imageModal.type === 'success' ? (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={imageModal.url}
                    alt="Imagen del centro"
                    style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 12, border: `3px solid ${th.primary}` }}
                  />
                </div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1a0e0e', margin: '0 0 8px' }}>Imagen subida correctamente</p>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>La imagen ya está visible para tus pacientes.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1a0e0e', margin: '0 0 8px' }}>Error al subir la imagen</p>
                <p style={{ fontSize: 13, color: '#e74c3c', margin: '0 0 20px', lineHeight: 1.5 }}>{imageModal.message}</p>
                <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>Asegúrate de que el bucket <strong>center-images</strong> existe y es público en Supabase Storage.</p>
              </>
            )}

            <button
              onClick={() => setImageModal(null)}
              style={{ ...ts.btnPrimary, marginTop: 20, width: 'auto', padding: '10px 32px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
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
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' as const : 'row' as const, justifyContent: 'space-between', alignItems: mobile ? 'flex-start' : 'flex-start', gap: 12, marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: mobile ? 22 : 28, fontWeight: 900, color: '#111', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>{actions}</div>}
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
    backgroundColor: '#dd8273', fontFamily: 'Inter, system-ui, sans-serif',
  },
  loginCard: {
    width: '100%', maxWidth: 380, padding: 24, backgroundColor: 'white',
    borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    margin: '0 16px',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#555',
  },
  input: {
    width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e0e0e0',
    marginBottom: 16, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 24, backgroundColor: '#1a0e0e',
    color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  shell: {
    display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif',
  },
  sidebar: {
    width: 260, backgroundColor: '#1a0e0e', display: 'flex', flexDirection: 'column' as const,
    position: 'fixed' as const, top: 0, left: 0, bottom: 0, zIndex: 10,
    overflowY: 'auto' as const,
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 70,
    borderBottom: '1px solid #2d1a18',
  },
  sidebarNav: {
    padding: '12px 12px 8px', display: 'flex', flexDirection: 'column' as const, gap: 2,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 40,
    borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent',
    textAlign: 'left' as const, width: '100%',
  },
  main: {
    flex: 1, marginLeft: 260, backgroundColor: '#dd8273', padding: 32,
    minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, gap: 24,
  },
  statsRow: {
    display: 'flex', gap: 16,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
  },
  headerBtn: {
    padding: '8px 16px', borderRadius: 999, border: 'none',
    backgroundColor: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#dd8273', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  filterTab: {
    padding: '8px 18px', borderRadius: 999, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};
