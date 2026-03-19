import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FeedbackItem {
  id: string;
  user_email: string;
  message: string;
  created_at: string;
}

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
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Feedback
    const { data: allFeedback } = await supabase.from('feedback').select('id, created_at');
    const totalFeedback = allFeedback?.length || 0;
    const unreadFeedback = allFeedback?.filter(f => {
      const d = new Date(f.created_at);
      return d >= new Date(weekAgo);
    }).length || 0;

    // Entries
    const { data: allEntries } = await supabase.from('entries').select('id, date, user_id, created_at');
    const totalEntries = allEntries?.length || 0;
    const entriesToday = allEntries?.filter(e => e.date === todayStr).length || 0;
    const entriesWeek = allEntries?.filter(e => {
      const d = new Date(e.created_at);
      return d >= new Date(weekAgo);
    }).length || 0;

    // Active users (unique users with entries this week)
    const activeUserIds = new Set(
      allEntries?.filter(e => {
        const d = new Date(e.created_at);
        return d >= new Date(weekAgo);
      }).map(e => e.user_id) || []
    );

    // Users — we get count from auth.users via entries unique user_ids
    const uniqueUserIds = new Set(allEntries?.map(e => e.user_id) || []);

    setStats({
      totalUsers: uniqueUserIds.size,
      newUsersToday: 0, // will be calculated from users list
      newUsersWeek: 0,
      totalFeedback,
      unreadFeedback,
      totalEntries,
      entriesToday,
      entriesWeek,
      activeUsersWeek: activeUserIds.size,
    });
  };

  const loadFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setFeedback(data || []);
  };

  const loadUsers = async () => {
    // Get unique users from entries table
    const { data: entries } = await supabase
      .from('entries')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    if (!entries) {
      setUsers([]);
      return;
    }

    // Group by user_id, get earliest created_at
    const userMap = new Map<string, { firstSeen: string; lastSeen: string }>();
    for (const e of entries) {
      const existing = userMap.get(e.user_id);
      if (!existing) {
        userMap.set(e.user_id, { firstSeen: e.created_at, lastSeen: e.created_at });
      } else {
        if (e.created_at < existing.firstSeen) existing.firstSeen = e.created_at;
        if (e.created_at > existing.lastSeen) existing.lastSeen = e.created_at;
      }
    }

    // Also get emails from feedback
    const { data: feedbackData } = await supabase.from('feedback').select('user_email');
    const emailSet = new Set(feedbackData?.map(f => f.user_email) || []);

    // We can't query auth.users from the client, but we know emails from feedback
    // For now, list user_ids with activity info
    const userList: UserInfo[] = Array.from(userMap.entries()).map(([uid, info]) => ({
      id: uid,
      email: '', // will be filled if we find it
      created_at: info.firstSeen,
      last_sign_in_at: info.lastSeen,
    }));

    setUsers(userList);

    // Update stats with user counts
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    setStats(prev => prev ? {
      ...prev,
      totalUsers: userList.length,
      newUsersToday: userList.filter(u => u.created_at.startsWith(todayStr)).length,
      newUsersWeek: userList.filter(u => new Date(u.created_at) >= weekAgo).length,
    } : prev);
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
              feedback.slice(0, 3).map(item => (
                <div key={item.id} style={styles.previewItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.user_email}</span>
                    <span style={{ color: '#aaa', fontSize: 12 }}>{relativeTime(item.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#555', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.message}
                  </p>
                </div>
              ))
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
      {section === 'feedback' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Todos los mensajes ({feedback.length})</h2>
          </div>

          {feedback.length === 0 && !loading && (
            <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No hay mensajes</p>
          )}

          {feedback.map((item) => (
            <div key={item.id} style={styles.feedbackCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{item.user_email}</span>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{formatDate(item.created_at)}</span>
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
          ))}
        </div>
      )}

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
                  <p style={{ fontSize: 12, color: '#aaa' }}>Primera actividad</p>
                  <p style={{ fontSize: 12, color: '#666' }}>{formatDate(user.created_at)}</p>
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
