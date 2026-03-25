import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FeedbackItem {
  id: string;
  user_email: string;
  message: string;
  type: string | null;
  created_at: string;
}

const FEEDBACK_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  bug: { emoji: '🐛', label: 'Error', color: '#e74c3c' },
  suggestion: { emoji: '💡', label: 'Sugerencia', color: '#f39c12' },
  question: { emoji: '❓', label: 'Pregunta', color: '#3498db' },
  other: { emoji: '💬', label: 'Otro', color: '#95a5a6' },
};

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Center {
  id: string;
  name: string;
  specialty: string | null;
  address: string | null;
  phone: string | null;
  subscription_status: string;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  totalFeedback: number;
  unreadFeedback: number;
  totalEntries: number;
  entriesToday: number;
  entriesWeek: number;
  activeUsersWeek: number;
}

const ADMIN_EMAILS = ['soymachine@gmail.com', 'ericbarbercot@icloud.com'];

type Section = 'dashboard' | 'usuarios' | 'centros' | 'estadisticas' | 'registros' | 'reportes';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'usuarios', icon: '👥', label: 'Usuarios' },
  { id: 'centros', icon: '🏥', label: 'Centros' },
  { id: 'estadisticas', icon: '📈', label: 'Estadísticas' },
  { id: 'registros', icon: '📋', label: 'Registros' },
  { id: 'reportes', icon: '🚩', label: 'Reportes' },
];

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>('dashboard');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [showCreateCenter, setShowCreateCenter] = useState(false);
  const [newCenter, setNewCenter] = useState({ name: '', specialty: '', address: '', phone: '', doctorEmail: '', doctorName: '', doctorSpecialty: '' });

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (!data.user?.email || !ADMIN_EMAILS.includes(data.user.email)) {
      setError('No tienes permisos de administrador');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setAdminEmail(data.user.email);
    setLoggedIn(true);
    setLoading(false);
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadDashboard();
  }, [loggedIn]);

  const loadDashboard = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadFeedback(), loadCenters()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: adminData, error: rpcError } = await supabase.rpc('admin_get_stats');
    const { data: allFeedback } = await supabase.from('feedback').select('id, created_at');
    const totalFeedback = allFeedback?.length || 0;
    const unreadFeedback = allFeedback?.filter(f => new Date(f.created_at) >= new Date(weekAgo)).length || 0;

    if (rpcError || !adminData) {
      setStats({
        totalUsers: 0, newUsersToday: 0, newUsersWeek: 0,
        totalFeedback, unreadFeedback,
        totalEntries: 0, entriesToday: 0, entriesWeek: 0, activeUsersWeek: 0,
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const usersFromRpc: { id: string; email: string; created_at: string; last_activity: string }[] = adminData.users || [];
    const newUsersWeek = usersFromRpc.filter(u => new Date(u.created_at) >= new Date(weekAgo)).length;
    const newUsersToday = usersFromRpc.filter(u => u.created_at?.startsWith(todayStr)).length;

    setStats({
      totalUsers: adminData.total_users || 0,
      newUsersToday,
      newUsersWeek,
      totalFeedback,
      unreadFeedback,
      totalEntries: adminData.total_entries || 0,
      entriesToday: adminData.entries_today || 0,
      entriesWeek: adminData.entries_week || 0,
      activeUsersWeek: adminData.active_users_week || 0,
    });

    setUsers(usersFromRpc.map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_activity,
    })));
  };

  // Note: Centers query requires RLS policy "Admins can read all centers" or disabling RLS on centers table.
  // TODO: Add an RPC or proper RLS policy for admin access to centers.
  const loadCenters = async () => {
    const { data, error } = await supabase.from('centers').select('*').order('created_at', { ascending: false });
    console.log('loadCenters result:', { data, error });
    setCenters(data || []);
  };

  const handleCreateCenter = async () => {
    setError('');
    console.log('Creating center:', newCenter);

    // 1. Create the center
    const { data: centerData, error: centerError } = await supabase
      .from('centers')
      .insert({
        name: newCenter.name,
        specialty: newCenter.specialty || null,
        address: newCenter.address || null,
        phone: newCenter.phone || null,
      })
      .select()
      .single();

    if (centerError) {
      console.error('Center creation error:', centerError);
      setError('Error al crear centro: ' + centerError.message);
      return;
    }
    console.log('Center created:', centerData);

    // 2. Save pending doctor info on the center (doctor will self-register later)
    if (newCenter.doctorEmail) {
      await supabase.from('centers').update({
        pending_doctor_email: newCenter.doctorEmail.trim().toLowerCase(),
        pending_doctor_name: newCenter.doctorName || null,
        pending_doctor_specialty: newCenter.doctorSpecialty || null,
      }).eq('id', centerData.id);
    }

    loadCenters();
    setShowCreateCenter(false);
    setNewCenter({ name: '', specialty: '', address: '', phone: '', doctorEmail: '', doctorName: '', doctorSpecialty: '' });
  };

  const handleDeleteCenter = async (id: string) => {
    if (!confirm('¿Eliminar este centro? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase.from('centers').delete().eq('id', id);
    if (error) {
      setError('Error al eliminar: ' + error.message);
    } else {
      setCenters(centers.filter((c) => c.id !== id));
    }
  };

  const loadFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setFeedback(data || []);
  };

  const handleDeleteFeedback = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    setFeedback(feedback.filter((f) => f.id !== id));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const shortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
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

  // ── Login screen ──
  if (!loggedIn) {
    return (
      <div style={s.loginContainer}>
        <div style={s.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 40 }}>💩</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: '#1a0e0e' }}>cagómetro</h1>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Panel de administración</p>
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
        <p style={{ color: '#fff', fontSize: 12, marginTop: 24, textAlign: 'center', opacity: 0.5 }}>v0.5</p>
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
          <span style={{ fontSize: 26 }}>💩</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#dd8273' }}>cagómetro</div>
            <div style={{ fontSize: 10, color: '#9a7a76' }}>Panel admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.sidebarNav}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#5c3e3a', marginBottom: 4, letterSpacing: 1 }}>MENÚ PRINCIPAL</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
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
            onClick={() => { supabase.auth.signOut(); setLoggedIn(false); }}
            style={{ ...s.navItem, color: '#7a5a56' }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span style={{ fontSize: 14 }}>Cerrar sesión</span>
          </button>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ borderTop: '1px solid #2d1a18', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#dd8273', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
            {(adminEmail || 'A')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Admin User</div>
            <div style={{ fontSize: 11, color: '#9a7a76' }}>{adminEmail}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={s.main}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Cargando...</div>}

        {/* ── DASHBOARD ── */}
        {section === 'dashboard' && stats && (
          <>
            <SectionHeader
              title="Dashboard"
              subtitle="Bienvenido al panel de administración"
              actions={<button onClick={loadDashboard} style={s.headerBtn}>🔄 Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji="👥" label="USUARIOS TOTALES" value={stats.totalUsers.toLocaleString()} sub={stats.newUsersWeek > 0 ? `↑ ${stats.newUsersWeek} esta semana` : undefined} />
              <StatCard emoji="💩" label="REGISTROS HOY" value={String(stats.entriesToday)} sub={`${stats.entriesWeek} esta semana`} dark />
              <StatCard emoji="⏳" label="REGISTROS TOTALES" value={stats.totalEntries.toLocaleString()} sub={`${stats.activeUsersWeek} usuarios activos`} />
              <StatCard emoji="🕐" label="REPORTES" value={String(stats.totalFeedback)} sub={stats.unreadFeedback > 0 ? `${stats.unreadFeedback} esta semana` : 'Sin nuevos'} />
            </div>

            {/* Recent reports */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>🚩 Últimas sugerencias y reportes</span>
                <button onClick={() => setSection('reportes')} style={s.linkBtn}>Ver todos →</button>
              </div>
              {feedback.length === 0 ? (
                <div style={{ padding: 20, color: '#aaa', fontSize: 14 }}>No hay mensajes</div>
              ) : (
                feedback.slice(0, 5).map((item, i) => {
                  const meta = FEEDBACK_TYPE_META[item.type || 'other'] || FEEDBACK_TYPE_META.other;
                  return (
                    <div key={item.id} style={{ padding: '14px 20px', borderBottom: i < 4 ? '1px solid #00000010' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {item.user_email[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{item.user_email.split('@')[0]}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10, backgroundColor: meta.color + '20', color: meta.color }}>
                            {meta.emoji} {meta.label}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.message}</p>
                      </div>
                      <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 }}>{relativeTime(item.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recent users table */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>👥 Últimos usuarios activos</span>
                <button onClick={() => setSection('usuarios')} style={s.linkBtn}>Ver todos →</button>
              </div>
              {/* Column headers */}
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Usuario</span>
                <span style={{ flex: 2 }}>Registro</span>
                <span style={{ flex: 2 }}>Último acceso</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Estado</span>
              </div>
              {users.slice(0, 5).map((user, i) => {
                const isRecent = user.last_sign_in_at && (Date.now() - new Date(user.last_sign_in_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < 4 ? '1px solid #00000010' : 'none' }}>
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                        {(user.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user.email ? user.email.split('@')[0] : user.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{user.email}</div>
                      </div>
                    </div>
                    <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{shortDate(user.created_at)}</span>
                    <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{user.last_sign_in_at ? relativeTime(user.last_sign_in_at) : '—'}</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: isRecent ? '#dd827330' : '#eee', color: isRecent ? '#c0392b' : '#999' }}>
                        {isRecent ? '● Activo' : '○ Inactivo'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── USUARIOS ── */}
        {section === 'usuarios' && (
          <>
            <SectionHeader
              title="Usuarios"
              subtitle="Gestión de usuarios registrados"
              actions={<button onClick={loadDashboard} style={s.headerBtn}>🔄 Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji="👥" label="TOTAL USUARIOS" value={String(stats?.totalUsers || 0)} sub={stats?.newUsersWeek ? `↑ ${stats.newUsersWeek} esta semana` : undefined} />
              <StatCard emoji="🔥" label="ACTIVOS HOY" value={String(stats?.activeUsersWeek || 0)} dark />
              <StatCard emoji="🆕" label="NUEVOS ESTA SEMANA" value={String(stats?.newUsersWeek || 0)} />
              <StatCard emoji="📊" label="MEDIA ENTRIES" value={stats && stats.totalUsers > 0 ? String(Math.round(stats.totalEntries / stats.totalUsers)) : '0'} />
            </div>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Todos los usuarios ({users.length})</span>
              </div>
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Usuario</span>
                <span style={{ flex: 2 }}>Email</span>
                <span style={{ flex: 1 }}>Registro</span>
                <span style={{ flex: 1 }}>Último acceso</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Estado</span>
              </div>
              {users.map((user, i) => {
                const isRecent = user.last_sign_in_at && (Date.now() - new Date(user.last_sign_in_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < users.length - 1 ? '1px solid #00000010' : 'none' }}>
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i % 2 === 0 ? '#1a0e0e' : '#dd8273', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {(user.email || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user.email ? user.email.split('@')[0] : user.id.slice(0, 8)}</span>
                    </div>
                    <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{user.email || '—'}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{shortDate(user.created_at)}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{user.last_sign_in_at ? relativeTime(user.last_sign_in_at) : '—'}</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: isRecent ? '#dd827330' : '#eee', color: isRecent ? '#c0392b' : '#999' }}>
                        {isRecent ? '● Activo' : '○ Inactivo'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── CENTROS MÉDICOS ── */}
        {section === 'centros' && (
          <>
            <SectionHeader
              title="Centros Médicos"
              subtitle="Gestión de centros y clínicas registradas"
              actions={
                <button onClick={() => setShowCreateCenter(true)} style={{ ...s.headerBtn, backgroundColor: '#1a0e0e', color: '#fff' }}>
                  + Nuevo Centro
                </button>
              }
            />
            <div style={s.statsRow}>
              <StatCard emoji="🏥" label="TOTAL CENTROS" value={String(centers.length)} />
              <StatCard emoji="✅" label="ACTIVOS" value={String(centers.filter(c => c.subscription_status === 'active').length)} dark />
              <StatCard emoji="⏸️" label="INACTIVOS" value={String(centers.filter(c => c.subscription_status !== 'active').length)} />
              <StatCard emoji="🩺" label="ESPECIALIDADES" value={String(new Set(centers.map(c => c.specialty).filter(Boolean)).size)} />
            </div>

            {/* Create center form */}
            {showCreateCenter && (
              <div style={s.card}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Crear nuevo centro</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Nombre del centro *</label>
                      <input
                        type="text"
                        value={newCenter.name}
                        onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                        placeholder="Ej: Clínica San Rafael"
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Especialidad</label>
                      <input
                        type="text"
                        value={newCenter.specialty}
                        onChange={(e) => setNewCenter({ ...newCenter, specialty: e.target.value })}
                        placeholder="Ej: Gastroenterología"
                        style={s.input}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Dirección</label>
                      <input
                        type="text"
                        value={newCenter.address}
                        onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                        placeholder="Ej: Calle Mayor 10, Madrid"
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Teléfono</label>
                      <input
                        type="text"
                        value={newCenter.phone}
                        onChange={(e) => setNewCenter({ ...newCenter, phone: e.target.value })}
                        placeholder="Ej: +34 612 345 678"
                        style={s.input}
                      />
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #00000010', paddingTop: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Doctor principal</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Email del doctor</label>
                      <input
                        type="email"
                        value={newCenter.doctorEmail}
                        onChange={(e) => setNewCenter({ ...newCenter, doctorEmail: e.target.value })}
                        placeholder="doctor@email.com"
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Nombre del doctor</label>
                      <input
                        type="text"
                        value={newCenter.doctorName}
                        onChange={(e) => setNewCenter({ ...newCenter, doctorName: e.target.value })}
                        placeholder="Dr. García López"
                        style={s.input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Especialidad del doctor</label>
                      <input
                        type="text"
                        value={newCenter.doctorSpecialty}
                        onChange={(e) => setNewCenter({ ...newCenter, doctorSpecialty: e.target.value })}
                        placeholder="Gastroenterología"
                        style={s.input}
                      />
                    </div>
                  </div>
                  {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => { setShowCreateCenter(false); setNewCenter({ name: '', specialty: '', address: '', phone: '', doctorEmail: '', doctorName: '', doctorSpecialty: '' }); setError(''); }}
                      style={{ ...s.headerBtn, backgroundColor: '#eee', color: '#666' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateCenter}
                      disabled={!newCenter.name}
                      style={{ ...s.headerBtn, backgroundColor: '#1a0e0e', color: '#fff', opacity: !newCenter.name ? 0.5 : 1 }}
                    >
                      Crear Centro
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Centers list */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Todos los centros ({centers.length})</span>
                <button onClick={loadCenters} style={s.linkBtn}>🔄 Actualizar</button>
              </div>
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Centro</span>
                <span style={{ flex: 2 }}>Especialidad</span>
                <span style={{ flex: 2 }}>Dirección</span>
                <span style={{ flex: 1 }}>Estado</span>
                <span style={{ flex: 1 }}>Creado</span>
                <span style={{ flex: 0.5, textAlign: 'right' }}></span>
              </div>
              {centers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>No hay centros registrados</div>
              ) : (
                centers.map((center, i) => {
                  const isActive = center.subscription_status === 'active';
                  return (
                    <div key={center.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < centers.length - 1 ? '1px solid #00000010' : 'none' }}>
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isActive ? '#dd8273' : '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          🏥
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{center.name}</div>
                          {center.phone && <div style={{ fontSize: 11, color: '#999' }}>{center.phone}</div>}
                        </div>
                      </div>
                      <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{center.specialty || '—'}</span>
                      <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{center.address || '—'}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: isActive ? '#dd827330' : '#eee', color: isActive ? '#c0392b' : '#999' }}>
                          {isActive ? '● Activo' : '○ Inactivo'}
                        </span>
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{shortDate(center.created_at)}</span>
                      <span style={{ flex: 0.5, textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteCenter(center.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.4, padding: '4px 8px' }}
                          title="Eliminar centro"
                        >
                          🗑️
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {section === 'estadisticas' && stats && (
          <>
            <SectionHeader
              title="Estadísticas"
              subtitle="Métricas de uso de la aplicación"
              actions={<button onClick={loadDashboard} style={s.headerBtn}>🔄 Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji="📝" label="REGISTROS ESTE MES" value={String(stats.entriesWeek)} />
              <StatCard emoji="📊" label="MEDIA/USUARIO" value={stats.totalUsers > 0 ? (stats.totalEntries / stats.totalUsers).toFixed(1) : '0'} dark />
              <StatCard emoji="📅" label="DÍA MÁS ACTIVO" value="Lunes" sub="Mayor actividad" />
              <StatCard emoji="🕐" label="HORA PICO" value="9:00 AM" sub="Mayor actividad del día" />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {/* Activity chart placeholder */}
              <div style={{ ...s.card, flex: 1, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Registros por día</div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 160, justifyContent: 'space-between' }}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => {
                    const heights = [80, 60, 100, 45, 70, 30, 55];
                    return (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', maxWidth: 40, height: heights[i], backgroundColor: '#dd8273', borderRadius: 6, opacity: 0.7 + (i * 0.04) }} />
                        <span style={{ fontSize: 11, color: '#999' }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Top users */}
              <div style={{ ...s.card, width: 280, padding: 24, flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Top 5 Usuarios</div>
                {users.slice(0, 5).map((user, i) => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#dd8273', width: 20 }}>{i + 1}</span>
                    <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>
                      {(user.email || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#333' }}>{user.email ? user.email.split('@')[0] : '?'}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Activity by hour */}
            <div style={{ ...s.card, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Actividad por hora</div>
              <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 80, justifyContent: 'space-between' }}>
                {Array.from({ length: 24 }, (_, i) => {
                  const vals = [5, 3, 2, 1, 1, 2, 8, 25, 40, 55, 45, 35, 30, 28, 22, 18, 20, 25, 35, 30, 22, 15, 10, 7];
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: '100%', height: vals[i] * 1.3, backgroundColor: '#dd8273', borderRadius: 3, opacity: 0.5 + (vals[i] / 100) }} />
                      {i % 3 === 0 && <span style={{ fontSize: 9, color: '#bbb' }}>{i}h</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── REGISTROS ── */}
        {section === 'registros' && stats && (
          <>
            <SectionHeader
              title="Registros"
              subtitle="Historial completo de visitas al baño"
              actions={<button onClick={loadDashboard} style={s.headerBtn}>🔄 Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji="📋" label="REGISTROS TOTALES" value={stats.totalEntries.toLocaleString()} sub={`↑ ${stats.entriesWeek} esta semana`} />
              <StatCard emoji="💩" label="HOY" value={String(stats.entriesToday)} sub="registros hoy" dark />
              <StatCard emoji="📊" label="MEDIA DIARIA" value={stats.totalEntries > 0 ? (stats.totalEntries / 30).toFixed(1) : '0'} sub="registros / día" />
              <StatCard emoji="🕐" label="HORA MÁS ACTIVA" value="9:00 AM" sub="mayor actividad" />
            </div>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #00000015' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>🚽 Registro de visitas</span>
              </div>
              {/* Note: Individual entries would require a new RPC function to fetch. Showing users' recent activity for now. */}
              {users.slice(0, 10).map((user, i) => (
                <div key={user.id} style={{ padding: '14px 20px', borderBottom: i < 9 ? '1px solid #00000010' : 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i % 3 === 0 ? '#dd8273' : '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {(user.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user.email ? user.email.split('@')[0] : user.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#555' }}>{user.last_sign_in_at ? relativeTime(user.last_sign_in_at) : '—'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── REPORTES ── */}
        {section === 'reportes' && (() => {
          const filtered = feedbackFilter === 'all' ? feedback : feedback.filter(f => f.type === feedbackFilter);
          return (
            <>
              <SectionHeader
                title="Reportes"
                subtitle="Sugerencias y mensajes de los usuarios"
                actions={<button onClick={loadDashboard} style={s.headerBtn}>🔄 Actualizar</button>}
              />
              <div style={s.statsRow}>
                <StatCard emoji="📬" label="TOTAL REPORTES" value={String(feedback.length)} sub={`${stats?.unreadFeedback || 0} esta semana`} />
                <StatCard emoji="🐛" label="ERRORES" value={String(feedback.filter(f => f.type === 'bug').length)} sub="bugs reportados" dark />
                <StatCard emoji="💡" label="SUGERENCIAS" value={String(feedback.filter(f => f.type === 'suggestion').length)} />
                <StatCard emoji="❓" label="PREGUNTAS" value={String(feedback.filter(f => f.type === 'question').length)} />
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setFeedbackFilter('all')}
                  style={{ ...s.filterTab, backgroundColor: feedbackFilter === 'all' ? '#000' : '#00000015', color: feedbackFilter === 'all' ? '#fff' : '#666' }}
                >
                  Todos ({feedback.length})
                </button>
                {Object.entries(FEEDBACK_TYPE_META).map(([key, meta]) => {
                  const count = feedback.filter(f => f.type === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setFeedbackFilter(key)}
                      style={{
                        ...s.filterTab,
                        backgroundColor: feedbackFilter === key ? meta.color : key === 'bug' ? '#dd827333' : '#00000015',
                        color: feedbackFilter === key ? '#fff' : '#666',
                      }}
                    >
                      {meta.emoji} {meta.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Feedback list */}
              <div style={s.card}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No hay mensajes</div>
                ) : (
                  filtered.map((item, i) => {
                    const meta = FEEDBACK_TYPE_META[item.type || 'other'] || FEEDBACK_TYPE_META.other;
                    return (
                      <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #00000010' : 'none' }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {item.user_email[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{item.user_email.split('@')[0]}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: meta.color + '20', color: meta.color }}>
                                {meta.emoji} {meta.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.message}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                              <span style={{ fontSize: 12, color: '#aaa' }}>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFeedback(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#c0392b', padding: '4px 8px', flexShrink: 0 }}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          );
        })()}
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
    minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
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
