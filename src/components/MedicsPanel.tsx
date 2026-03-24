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
}

interface DoctorInfo {
  id: string;
  name: string;
  specialty: string | null;
  center_id: string;
  center_name?: string;
}

interface PatientStats {
  totalEntries: number;
  lastEntry: string | null;
  bristolAvg: number | null;
  daysSinceLast: number | null;
}

type Section = 'dashboard' | 'pacientes' | 'invitar';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '\u{1F4CA}', label: 'Dashboard' },
  { id: 'pacientes', icon: '\u{1F465}', label: 'Pacientes' },
  { id: 'invitar', icon: '\u{2795}', label: 'Invitar Paciente' },
];

export default function MedicsPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>('dashboard');
  const [patients, setPatients] = useState<PatientLink[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

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

      // Check if the user is a doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*, centers(name)')
        .eq('id', data.user.id)
        .single();

      if (doctorError || !doctorData) {
        setError('No tienes permisos de acceso médico');
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
    setPatients(data || []);
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

  const acceptedPatients = patients.filter(p => p.status === 'accepted');
  const pendingPatients = patients.filter(p => p.status === 'pending');

  // ── Login screen ──
  if (!loggedIn) {
    return (
      <div style={s.loginContainer}>
        <div style={s.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 40 }}>{'\u{1F3E5}'}</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: '#1a0e0e' }}>Portal Médico</h1>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Acceso para profesionales</p>
          </div>
          <label style={s.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} />
          <label style={s.label}>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={s.input} />
          {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? '...' : 'Entrar'}
          </button>
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
              onClick={() => { setSection(item.id); setSelectedPatient(null); }}
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

        {/* ── DASHBOARD ── */}
        {section === 'dashboard' && (
          <>
            <SectionHeader
              title="Dashboard"
              subtitle={`Bienvenido, Dr. ${doctorInfo?.name || ''}`}
              actions={<button onClick={loadPatients} style={s.headerBtn}>{'\u{1F504}'} Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji={'\u{1F465}'} label="TOTAL PACIENTES" value={String(acceptedPatients.length)} sub={acceptedPatients.length > 0 ? 'pacientes vinculados' : 'Sin pacientes aún'} />
              <StatCard emoji={'\u{23F3}'} label="PENDIENTES" value={String(pendingPatients.length)} sub={pendingPatients.length > 0 ? 'esperando aceptación' : 'Sin pendientes'} />
              <StatCard emoji={'\u{1F4E9}'} label="INVITACIONES ENVIADAS" value={String(patients.length)} sub="total histórico" />
              <StatCard emoji={'\u{1F4C8}'} label="TASA DE ACEPTACIÓN" value={patients.length > 0 ? `${Math.round((acceptedPatients.length / patients.length) * 100)}%` : '—'} sub="de invitaciones" dark />
            </div>

            {/* Recent patients */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{'\u{1F465}'} Pacientes recientes</span>
                <button onClick={() => setSection('pacientes')} style={s.linkBtn}>Ver todos {'\u{2192}'}</button>
              </div>
              {acceptedPatients.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No hay pacientes vinculados aún. Invita a tu primer paciente.
                </div>
              ) : (
                acceptedPatients.slice(0, 5).map((patient, i) => (
                  <div key={patient.id} style={{ padding: '14px 20px', borderBottom: i < Math.min(acceptedPatients.length, 5) - 1 ? '1px solid #00000010' : 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {(patient.patient_email || patient.patient_id || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                        {patient.patient_email || (patient.patient_id ? patient.patient_id.slice(0, 8) + '...' : 'Paciente')}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>Código: {patient.invite_code}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: '#dd827330', color: '#2ecc71' }}>
                      {'\u{2705}'} Vinculado
                    </span>
                    {patient.accepted_at && (
                      <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>{relativeTime(patient.accepted_at)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── PACIENTES ── */}
        {section === 'pacientes' && (
          <>
            <SectionHeader
              title="Mis Pacientes"
              subtitle={`${patients.length} invitaciones totales`}
              actions={<button onClick={loadPatients} style={s.headerBtn}>{'\u{1F504}'} Actualizar</button>}
            />
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Todos los pacientes ({patients.length})</span>
              </div>
              {/* Column headers */}
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Paciente</span>
                <span style={{ flex: 1 }}>Código</span>
                <span style={{ flex: 1 }}>Estado</span>
                <span style={{ flex: 1 }}>Fecha invitación</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Fecha aceptación</span>
              </div>
              {patients.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                  No hay pacientes. Invita a tu primer paciente desde la sección "Invitar Paciente".
                </div>
              ) : (
                patients.map((patient, i) => {
                  const isAccepted = patient.status === 'accepted';
                  return (
                    <div key={patient.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < patients.length - 1 ? '1px solid #00000010' : 'none' }}>
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isAccepted ? '#dd8273' : '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {(patient.patient_email || patient.patient_id || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                            {patient.patient_email || (patient.patient_id ? patient.patient_id.slice(0, 8) + '...' : 'Sin asignar')}
                          </div>
                          {patient.patient_id && !patient.patient_email && (
                            <div style={{ fontSize: 11, color: '#999' }}>ID: {patient.patient_id.slice(0, 12)}...</div>
                          )}
                        </div>
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: '#555', fontFamily: 'monospace' }}>{patient.invite_code}</span>
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
                      <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{shortDate(patient.invited_at)}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#555', textAlign: 'right' }}>
                        {patient.accepted_at ? shortDate(patient.accepted_at) : '—'}
                      </span>
                    </div>
                  );
                })
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
