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

type Section = 'dashboard' | 'feedback' | 'users';

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<Section>('dashboard');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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
    setLoggedIn(true);
    setLoading(false);
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadDashboard();
  }, [loggedIn]);

  const loadDashboard = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadFeedback(), loadUsers()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get global stats from the SECURITY DEFINER function (bypasses RLS)
    const { data: adminData, error: rpcError } = await supabase.rpc('admin_get_stats');

    // Feedback (admin can read all feedback)
    const { data: allFeedback } = await supabase.from('feedback').select('id, created_at');
    const totalFeedback = allFeedback?.length || 0;
    const unreadFeedback = allFeedback?.filter(f => new Date(f.created_at) >= new Date(weekAgo)).length || 0;

    if (rpcError || !adminData) {
      // Fallback if RPC fails
      console.error('admin_get_stats error:', rpcError);
      setStats({
        totalUsers: 0, newUsersToday: 0, newUsersWeek: 0,
        totalFeedback, unreadFeedback,
        totalEntries: 0, entriesToday: 0, entriesWeek: 0, activeUsersWeek: 0,
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const usersFromRpc: { id: string; created_at: string; last_activity: string }[] = adminData.users || [];
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

    // Also populate users list from RPC data
    setUsers(usersFromRpc.map(u => ({
      id: u.id,
      email: u.email || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_activity,
    })));
  };

  const loadFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setFeedback(data || []);

    // Enrich users with emails from feedback
    const emailMap = new Map<string, string>();
    // We don't have user_id in feedback, but we have emails
    // This won't map to user_ids, but it's still useful info
  };

  const loadUsers = async () => {
    // Users are loaded from admin_get_stats RPC in loadStats
    // Nothing extra needed here
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
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 40 }}>💩</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>Cacalendario Admin</h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Acceso restringido</p>
          </div>

          <label style={styles.label}>Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Contraseña</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={styles.input}
          />

          {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button onClick={handleLogin} disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? '...' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>💩</span>
          <h1 style={{ fontSize: 20, fontWeight: 900 }}>Cacalendario Admin</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadDashboard} style={styles.btnSmall}>🔄</button>
          <button onClick={() => { supabase.auth.signOut(); setLoggedIn(false); }} style={styles.btnSmall}>Salir</button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={styles.tabs}>
        {(['dashboard', 'feedback', 'users'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              ...styles.tab,
              backgroundColor: section === s ? '#222' : 'transparent',
              color: section === s ? 'white' : '#666',
            }}
          >
            {s === 'dashboard' ? '📊 Dashboard' : s === 'feedback' ? `💬 Mensajes (${feedback.length})` : `👥 Usuarios (${stats?.totalUsers || 0})`}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 24 }}>Cargando...</p>}

      {/* ── DASHBOARD SECTION ── */}
      {section === 'dashboard' && stats && (
        <div>
          {/* Stats grid */}
          <div style={styles.statsGrid}>
            <StatCard
              icon="👥" label="Usuarios" value={stats.totalUsers}
              sub={stats.newUsersWeek > 0 ? `+${stats.newUsersWeek} esta semana` : undefined}
              onClick={() => setSection('users')}
            />
            <StatCard
              icon="💬" label="Mensajes" value={stats.totalFeedback}
              sub={stats.unreadFeedback > 0 ? `${stats.unreadFeedback} esta semana` : undefined}
              highlight={stats.unreadFeedback > 0}
              onClick={() => setSection('feedback')}
            />
            <StatCard
              icon="💩" label="Registros totales" value={stats.totalEntries}
              sub={stats.entriesToday > 0 ? `${stats.entriesToday} hoy` : undefined}
            />
            <StatCard
              icon="📈" label="Registros semana" value={stats.entriesWeek}
              sub={`${stats.activeUsersWeek} usuarios activos`}
            />
          </div>

          {/* Recent feedback preview */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>💬 Mensajes recientes</h3>
              <button onClick={() => setSection('feedback')} style={styles.linkBtn}>Ver todos →</button>
            </div>
            {feedback.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 14 }}>No hay mensajes</p>
            ) : (
              feedback.slice(0, 3).map(item => {
                const typeMeta = FEEDBACK_TYPE_META[item.type || 'other'] || FEEDBACK_TYPE_META.other;
                return (
                  <div key={item.id} style={styles.previewItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                            backgroundColor: typeMeta.color + '20', color: typeMeta.color,
                          }}
                        >
                          {typeMeta.emoji} {typeMeta.label}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.user_email}</span>
                      </div>
                      <span style={{ color: '#aaa', fontSize: 12 }}>{relativeTime(item.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#555', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent users preview */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>👥 Usuarios recientes</h3>
              <button onClick={() => setSection('users')} style={styles.linkBtn}>Ver todos →</button>
            </div>
            {users.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 14 }}>No hay usuarios registrados</p>
            ) : (
              users.slice(0, 5).map(user => (
                <div key={user.id} style={styles.previewItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{user.email || user.id.slice(0, 8) + '...'}</span>
                    <span style={{ color: '#aaa', fontSize: 12 }}>Desde {relativeTime(user.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── FEEDBACK SECTION ── */}
      {section === 'feedback' && (() => {
        const filtered = feedbackFilter === 'all' ? feedback : feedback.filter(f => f.type === feedbackFilter);
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Todos los mensajes ({feedback.length})</h2>
            </div>

            {/* Type filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => setFeedbackFilter('all')}
                style={{
                  ...styles.tab,
                  backgroundColor: feedbackFilter === 'all' ? '#222' : 'white',
                  color: feedbackFilter === 'all' ? 'white' : '#666',
                }}
              >
                Todos ({feedback.length})
              </button>
              {Object.entries(FEEDBACK_TYPE_META).map(([key, meta]) => {
                const count = feedback.filter(f => f.type === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setFeedbackFilter(key)}
                    style={{
                      ...styles.tab,
                      backgroundColor: feedbackFilter === key ? meta.color : 'white',
                      color: feedbackFilter === key ? 'white' : '#666',
                      borderColor: feedbackFilter === key ? meta.color : '#ddd',
                    }}
                  >
                    {meta.emoji} {meta.label} ({count})
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && !loading && (
              <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No hay mensajes</p>
            )}

            {filtered.map((item) => {
              const typeMeta = FEEDBACK_TYPE_META[item.type || 'other'] || FEEDBACK_TYPE_META.other;
              return (
                <div key={item.id} style={styles.feedbackCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          backgroundColor: typeMeta.color + '20', color: typeMeta.color,
                        }}
                      >
                        {typeMeta.emoji} {typeMeta.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{item.user_email}</span>
                      <span style={{ color: '#999', fontSize: 12 }}>{formatDate(item.created_at)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteFeedback(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#c0392b', padding: '4px 8px' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#333' }}>{item.message}</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── USERS SECTION ── */}
      {section === 'users' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Usuarios registrados ({users.length})</h2>
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Usuarios que han sincronizado datos con Supabase</p>
          </div>

          {users.length === 0 && !loading && (
            <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No hay usuarios registrados</p>
          )}

          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
            {users.map((user, i) => (
              <div
                key={user.id}
                style={{
                  padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: i % 2 === 0 ? '#fafafa' : 'white',
                  borderBottom: i < users.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {user.email || <span style={{ color: '#aaa' }}>{user.id.slice(0, 12)}...</span>}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#aaa' }}>Registro: {formatDate(user.created_at)}</p>
                  {user.last_sign_in_at && (
                    <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Última actividad: {relativeTime(user.last_sign_in_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatCard component ──
function StatCard({ icon, label, value, sub, highlight, onClick }: {
  icon: string; label: string; value: number; sub?: string; highlight?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.statCard,
        cursor: onClick ? 'pointer' : 'default',
        borderColor: highlight ? '#e74c3c' : '#eee',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
      </div>
      <p style={{ fontSize: 32, fontWeight: 900 }}>{value}</p>
      {sub && (
        <p style={{ fontSize: 12, color: highlight ? '#e74c3c' : '#27ae60', marginTop: 4, fontWeight: 600 }}>{sub}</p>
      )}
    </div>
  );
}

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5f5f5', fontFamily: 'Inter, system-ui, sans-serif',
  },
  loginCard: {
    width: '100%', maxWidth: 380, padding: 32, backgroundColor: 'white',
    borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  page: {
    maxWidth: 800, margin: '0 auto', padding: '20px 24px 40px',
    fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f9f9f9',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: 16,
  },
  tabs: {
    display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' as const,
  },
  tab: {
    padding: '8px 16px', borderRadius: 20, border: '1px solid #ddd',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12, marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    border: '1px solid #eee', transition: 'transform 0.2s',
  },
  sectionCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    border: '1px solid #eee', marginBottom: 16,
  },
  previewItem: {
    padding: '10px 0', borderBottom: '1px solid #f5f5f5',
  },
  feedbackCard: {
    border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 12,
    backgroundColor: 'white',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#555',
  },
  input: {
    width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e0e0e0',
    marginBottom: 16, fontSize: 14, outline: 'none',
  },
  btnPrimary: {
    width: '100%', padding: 14, borderRadius: 24, backgroundColor: '#222',
    color: 'white', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  btnSmall: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd',
    background: 'white', cursor: 'pointer', fontSize: 13,
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#2980b9', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
};
