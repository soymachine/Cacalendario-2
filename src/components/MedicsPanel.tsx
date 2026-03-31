import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
}

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string | null;
  center_id: string;
  center_name?: string;
}

interface PatientEntry {
  id: string;
  date: string;
  time: string;
  notes: string;
  bristol: number | null;
  floats: boolean | null;
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

type Section = 'pacientes' | 'invitar';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'pacientes', icon: '\u{1F465}', label: 'Pacientes' },
  { id: 'invitar', icon: '\u{2795}', label: 'Invitar Paciente' },
];

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

  // ── Recover session on mount ──
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('*, centers(name)')
            .eq('id', session.user.id)
            .single();
          if (doctorData) {
            setDoctorInfo({
              id: doctorData.id,
              name: doctorData.name,
              specialty: doctorData.specialty,
              center_id: doctorData.center_id,
              center_name: (doctorData.centers as { name: string } | null)?.name || 'Centro médico',
            });
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
        .select('*, centers(name)')
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
                .select('*, centers(name)')
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

      setDoctorInfo({
        id: doctorData.id,
        name: doctorData.name,
        specialty: doctorData.specialty,
        center_id: doctorData.center_id,
        center_name: (doctorData.centers as { name: string } | null)?.name || 'Centro médico',
      });
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

      return { ...p, display_name, patient_email, lastEntryDate, daysSinceLast };
    }));
    setPatients(enriched);
  };

  useEffect(() => {
    if (!loggedIn || !doctorInfo) return;
    loadPatients();
  }, [loggedIn, doctorInfo]);

  // ── Invite patient ──
  const handleInvite = async (useEmail: boolean) => {
    setError('');
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
        setInviteEmail('');
        loadPatients();
      }
    } catch (err) {
      setError('Error al crear la invitación');
    } finally {
      setLoading(false);
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
      bristol: e.bristol,
      floats: e.floats,
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
    const siteUrl = window.location.origin + '/Cacalendario-2/medics';
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

  const patientLabel = (p: PatientLink) => p.display_name || p.patient_email || 'Paciente';
  const patientInitial = (p: PatientLink) => (p.display_name || p.patient_email || '?')[0].toUpperCase();

  const acceptedPatients = patients.filter(p => p.status === 'accepted');
  const pendingPatients = patients.filter(p => p.status === 'pending');

  // ── Semáforo helper ──
  const getSemaforo = (daysSinceLast: number | null) => {
    if (daysSinceLast === null) return { color: '#aaa', icon: '\u{26AA}' }; // grey - no data
    if (daysSinceLast < 1) return { color: '#27ae60', icon: '\u{1F7E2}' }; // green
    if (daysSinceLast <= 3) return { color: '#f39c12', icon: '\u{1F7E0}' }; // orange
    return { color: '#e74c3c', icon: '\u{1F534}' }; // red
  };

  // ── Initial loading ──
  if (initialLoading) {
    return (
      <div style={{ ...s.loginContainer, flexDirection: 'column' as const }}>
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
      <div style={{ ...s.loginContainer, flexDirection: 'column' as const }}>
        <div style={s.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 40 }}>{'\u{1F3E5}'}</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: '#1a0e0e' }}>Portal Médico</h1>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
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
              <button onClick={handleForgotPassword} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
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
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1a0e0e', marginTop: 12 }}>¡Email enviado!</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada (y spam).
                </p>
              </div>
              <button
                onClick={() => { setForgotMode('off'); setError(''); setPassword(''); }}
                style={{ ...s.btnPrimary, marginTop: 20 }}
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
              <button onClick={handleLogin} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
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
              <button onClick={handleRegisterCheckEmail} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
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
              <div style={{ backgroundColor: '#dd827320', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a0e0e', margin: 0 }}>
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
              <button onClick={handleRegisterCreate} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
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
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1a0e0e', marginTop: 12 }}>¡Revisa tu email!</p>
                <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                  Hemos enviado un enlace de confirmación a <strong>{registerEmail}</strong>.
                  Confirma tu cuenta y después inicia sesión aquí.
                </p>
              </div>
              <button
                onClick={() => { setRegisterMode(false); setEmail(registerEmail); setError(''); }}
                style={{ ...s.btnPrimary, marginTop: 20 }}
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
      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <span style={{ fontSize: 26 }}>{'\u{1F3E5}'}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#dd8273' }}>{doctorInfo?.center_name || 'Centro médico'}</div>
            <div style={{ fontSize: 10, color: '#9a7a76' }}>Dr. {doctorInfo?.name}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.sidebarNav}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#5c3e3a', marginBottom: 4, letterSpacing: 1 }}>MENÚ PRINCIPAL</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSelectedPatient(null); setPatientDetail(null); }}
              style={{
                ...s.navItem,
                backgroundColor: section === item.id ? '#3d1e1a' : 'transparent',
                color: section === item.id ? '#dd8273' : '#9a7a76',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: section === item.id ? 500 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings section */}
        <div style={{ padding: '16px 12px 8px', borderTop: '1px solid #2d1a18' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#5c3e3a', marginBottom: 4, letterSpacing: 1 }}>CONFIGURACIÓN</div>
          <button
            onClick={() => { supabase.auth.signOut(); setLoggedIn(false); setDoctorInfo(null); }}
            style={{ ...s.navItem, color: '#7a5a56' }}
          >
            <span style={{ fontSize: 16 }}>{'\u{1F6AA}'}</span>
            <span style={{ fontSize: 14 }}>Cerrar sesión</span>
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ borderTop: '1px solid #2d1a18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#dd8273', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
            {(doctorInfo?.name || 'D')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Dr. {doctorInfo?.name}</div>
            <div style={{ fontSize: 11, color: '#9a7a76' }}>{doctorInfo?.specialty || 'Médico'}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={s.main}>
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
              {/* Column headers */}
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Paciente</span>
                <span style={{ flex: 1 }}>Estado</span>
                <span style={{ flex: 1 }}>Último registro</span>
                <span style={{ width: 50, textAlign: 'center' }}>Estado</span>
              </div>
              {patients.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No hay pacientes. Invita a tu primer paciente desde la sección "Invitar Paciente".
                </div>
              ) : (
                patients.map((patient, i) => {
                  const isAccepted = patient.status === 'accepted';
                  const semaforo = getSemaforo(patient.daysSinceLast);
                  return (
                    <div key={patient.id} onClick={() => isAccepted && loadPatientDetail(patient)} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < patients.length - 1 ? '1px solid #00000010' : 'none', cursor: isAccepted ? 'pointer' : 'default' }}>
                      {/* Patient name */}
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isAccepted ? '#dd8273' : '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {patientInitial(patient)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                            {patientLabel(patient)}
                          </div>
                          {patient.display_name && patient.patient_email && (
                            <div style={{ fontSize: 11, color: '#999' }}>{patient.patient_email}</div>
                          )}
                        </div>
                      </div>
                      {/* Status badge */}
                      <span style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 12,
                          backgroundColor: isAccepted ? '#2ecc7130' : '#f39c1230',
                          color: isAccepted ? '#27ae60' : '#e67e22',
                        }}>
                          {isAccepted ? '\u{2705} Vinculado' : '\u{23F3} Pendiente'}
                        </span>
                      </span>
                      {/* Last entry */}
                      <div style={{ flex: 1 }}>
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
                          <span style={{ fontSize: 12, color: '#aaa' }}>—</span>
                        )}
                      </div>
                      {/* Semáforo */}
                      <div style={{ width: 50, textAlign: 'center' }}>
                        {isAccepted ? (
                          <span style={{ fontSize: 20 }}>{semaforo.icon}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#aaa' }}>—</span>
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
              title={patientLabel(selectedPatient)}
              subtitle={`${selectedPatient.display_name && selectedPatient.patient_email ? selectedPatient.patient_email + ' · ' : ''}Vinculado ${selectedPatient.accepted_at ? shortDate(selectedPatient.accepted_at) : ''}`}
              actions={
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => exportPatientPDF(selectedPatient, patientDetail, doctorInfo)} style={{ ...s.headerBtn, backgroundColor: '#1a0e0e', color: '#fff' }}>
                    📄 Exportar PDF
                  </button>
                  <button onClick={() => { setSelectedPatient(null); setPatientDetail(null); }} style={s.headerBtn}>
                    ← Volver
                  </button>
                </div>
              }
            />

            {/* Last entry + Semáforo */}
            <div style={{ ...s.card, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>{getSemaforo(patientDetail.daysSinceLast).icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                  {patientDetail.daysSinceLast === null
                    ? 'Sin registros'
                    : patientDetail.daysSinceLast === 0
                      ? 'Último registro: hoy'
                      : `Último registro: hace ${patientDetail.daysSinceLast} día${patientDetail.daysSinceLast !== 1 ? 's' : ''}`}
                </div>
                {patientDetail.lastEntryDate && (
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{shortDate(patientDetail.lastEntryDate)}</div>
                )}
              </div>
            </div>

            {/* Alert for 3+ days */}
            {patientDetail.daysSinceLast !== null && patientDetail.daysSinceLast > 3 && (
              <div style={{ ...s.card, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '2px solid #e74c3c' }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#c0392b', fontSize: 14 }}>Alerta: {patientDetail.daysSinceLast} días sin registrar</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Este paciente lleva varios días sin registrar actividad.</div>
                </div>
              </div>
            )}

            {/* Mini calendar */}
            <div style={s.card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #00000015', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => {
                  if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                  else setCalendarMonth(calendarMonth - 1);
                }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>←</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
                  {new Date(calendarYear, calendarMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => {
                  if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                  else setCalendarMonth(calendarMonth + 1);
                }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>→</button>
              </div>
              <div style={{ padding: 20 }}>
                {/* Weekday headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', padding: 4 }}>{d}</div>
                  ))}
                </div>
                {/* Calendar days */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {(() => {
                    const firstDay = new Date(calendarYear, calendarMonth, 1);
                    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                    // Build entries map for this month
                    const entriesByDate = new Map<string, number>();
                    patientDetail.entries.forEach(e => {
                      const [y, m] = e.date.split('-').map(Number);
                      if (y === calendarYear && m === calendarMonth + 1) {
                        entriesByDate.set(e.date, (entriesByDate.get(e.date) || 0) + 1);
                      }
                    });

                    const cells: React.ReactNode[] = [];
                    // Empty cells before first day
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
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column' as const,
                          backgroundColor: hasEntry ? '#dd8273' : isToday ? '#dd827320' : 'transparent',
                          opacity: isFuture ? 0.3 : 1,
                          border: isToday ? '2px solid #dd8273' : '1px solid #00000010',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: hasEntry ? '#fff' : '#555' }}>{day}</span>
                          {hasEntry && count > 1 && (
                            <span style={{ fontSize: 9, color: '#ffffff99' }}>x{count}</span>
                          )}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#999', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#dd8273' }} /> Con registro</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid #00000020' }} /> Sin registro</div>
                </div>
              </div>
            </div>

            {/* Full entry list */}
            <div style={s.card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Historial de registros ({patientDetail.totalEntries})</span>
              </div>
              {/* Column headers */}
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ width: 110 }}>Fecha</span>
                <span style={{ width: 60 }}>Hora</span>
                <span style={{ width: 80 }}>Bristol</span>
                <span style={{ width: 80 }}>Flota</span>
                <span style={{ flex: 1 }}>Comentarios</span>
              </div>
              {patientDetail.entries.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  Este paciente no tiene registros aún.
                </div>
              ) : (
                patientDetail.entries.map((entry, i) => (
                  <div key={entry.entry_id || i} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i < patientDetail.entries.length - 1 ? '1px solid #00000008' : 'none' }}>
                    <span style={{ width: 110, fontSize: 13, fontWeight: 600, color: '#111' }}>{shortDate(entry.date)}</span>
                    <span style={{ width: 60, fontSize: 13, color: '#555' }}>{entry.time || '—'}</span>
                    <span style={{ width: 80 }}>
                      {entry.bristol != null ? (
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: entry.bristol >= 3 && entry.bristol <= 5 ? '#27ae6020' : entry.bristol < 3 ? '#f39c1220' : '#e74c3c20',
                          color: entry.bristol >= 3 && entry.bristol <= 5 ? '#27ae60' : entry.bristol < 3 ? '#f39c12' : '#e74c3c',
                          fontWeight: 600,
                        }}>
                          Tipo {entry.bristol}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                      )}
                    </span>
                    <span style={{ width: 80 }}>
                      {entry.floats != null ? (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: '#3498db20', color: '#3498db', fontWeight: 600 }}>
                          {entry.floats ? 'Sí' : 'No'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                      )}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: entry.notes ? '#555' : '#ccc', fontStyle: entry.notes ? 'normal' : 'italic' }}>
                      {entry.notes || 'Sin comentarios'}
                    </span>
                  </div>
                ))
              )}
            </div>
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
                        backgroundColor: '#1a0e0e',
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
                      backgroundColor: '#dd8273',
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
                    border: '2px dashed #dd8273',
                  }}>
                    <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>Comparte este código con tu paciente</p>
                    <div style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: '#1a0e0e',
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
                        backgroundColor: '#1a0e0e',
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
      </main>
    </div>
  );
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
  Generado por Cacalendario · ${today} · Este informe es orientativo y no sustituye el diagnóstico médico.
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
function SectionHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
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
    width: '100%', maxWidth: 380, padding: 32, backgroundColor: 'white',
    borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
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
