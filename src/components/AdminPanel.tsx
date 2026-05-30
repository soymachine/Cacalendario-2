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

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  center_name: string;
  plan: 'free' | 'beta' | 'pro';
  created_at: string;
  email?: string;
  provider?: string;
  patientCount: number;
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

type Section = 'dashboard' | 'usuarios' | 'doctores' | 'estadisticas' | 'registros' | 'reportes' | 'backups';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'usuarios', icon: '👥', label: 'Pacientes' },
  { id: 'doctores', icon: '🩺', label: 'Médicos' },
  { id: 'estadisticas', icon: '📈', label: 'Estadísticas' },
  { id: 'registros', icon: '📋', label: 'Registros' },
  { id: 'reportes', icon: '🚩', label: 'Reportes' },
  { id: 'backups', icon: '💾', label: 'Backups' },
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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [planConfirm, setPlanConfirm] = useState<{ doctor: Doctor; newPlan: 'free' | 'beta' | 'pro' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Doctor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Backup state
  interface BackupRecord { filename: string; createdAt: string; summary: string; }
  const [backupList, setBackupList] = useState<BackupRecord[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restorePreview, setRestorePreview] = useState<{ filename: string; data: any } | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
    await Promise.all([loadStats(), loadFeedback(), loadDoctors()]);
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

  const loadDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, specialty, plan, created_at, centers(name)')
      .order('created_at', { ascending: false });
    if (error) { console.error('loadDoctors:', error); return; }

    // Fetch accepted patient counts per doctor
    const { data: links } = await supabase
      .from('patient_links')
      .select('doctor_id')
      .eq('status', 'accepted');
    const countMap: Record<string, number> = {};
    (links || []).forEach((l: any) => { countMap[l.doctor_id] = (countMap[l.doctor_id] || 0) + 1; });

    const docList: Doctor[] = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      center_name: d.centers?.name || '—',
      plan: d.plan || 'free',
      created_at: d.created_at,
      patientCount: countMap[d.id] || 0,
    }));

    // Fetch email + OAuth provider for each doctor directly from auth.users
    const ids = docList.map(d => d.id);
    if (ids.length > 0) {
      const { data: authInfo } = await supabase.rpc('admin_get_doctor_auth_info', { p_ids: ids });
      if (authInfo) {
        const byId = new Map((authInfo as any[]).map(a => [a.id, a]));
        docList.forEach(d => {
          const a = byId.get(d.id);
          if (a) { d.email = a.email; d.provider = a.provider; }
        });
      }
    }

    setDoctors(docList);
  };

  const handleChangeDoctorPlan = async (doctorId: string, newPlan: 'free' | 'beta' | 'pro') => {
    setChangingPlanId(doctorId);
    const { error } = await supabase.rpc('admin_set_doctor_plan', { p_doctor_id: doctorId, p_plan: newPlan });
    setChangingPlanId(null);
    if (error) {
      alert('Error al cambiar el plan: ' + error.message);
      return;
    }
    setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, plan: newPlan } : d));
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    setDeletingId(doctor.id);
    const { error } = await supabase.rpc('admin_delete_doctor', { p_doctor_id: doctor.id });
    setDeletingId(null);
    setDeleteConfirm(null);
    if (error) {
      alert('Error al eliminar el médico: ' + error.message);
      return;
    }
    setDoctors(prev => prev.filter(d => d.id !== doctor.id));
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
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', marginBottom: 32 }}>
            <img src="/fluxia-logo.png" alt="Fluxia" style={{ height: 56, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>Panel de administración</p>
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
        <p style={{ color: '#fff', fontSize: 12, marginTop: 24, textAlign: 'center', opacity: 0.5 }}>v0.8</p>
      </div>
    );
  }

  // ── Backup / Restore ──
  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    try {
      const [{ data: entries }, { data: centers }, { data: doctors }, { data: links }] = await Promise.all([
        supabase.from('entries').select('*'),
        supabase.from('centers').select('*'),
        supabase.from('doctors').select('*'),
        supabase.from('patient_links').select('*'),
      ]);
      const backup = {
        version: 1,
        createdAt: new Date().toISOString(),
        entries: entries || [],
        centers: centers || [],
        doctors: doctors || [],
        patient_links: links || [],
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `fluxia_backup_${new Date().toISOString().slice(0, 16).replace('T', '_')}.json`;
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      const summary = `${backup.entries.length} registros · ${backup.centers.length} centros · ${backup.doctors.length} médicos`;
      setBackupList(prev => [{ filename, createdAt: backup.createdAt, summary }, ...prev]);
      setBackupMsg({ type: 'ok', text: `✅ Backup creado: ${filename}` });
    } catch (e: any) {
      setBackupMsg({ type: 'err', text: `❌ Error: ${e.message}` });
    }
    setBackupLoading(false);
  };

  const handleRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.entries) throw new Error('Fichero no válido');
        setRestorePreview({ filename: file.name, data });
        setBackupMsg(null);
      } catch (err: any) {
        setBackupMsg({ type: 'err', text: `❌ ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    setRestoreLoading(true);
    setBackupMsg(null);
    const { data } = restorePreview;
    try {
      if (data.entries?.length) {
        const { error } = await supabase.from('entries').upsert(data.entries, { onConflict: 'user_id,entry_id' });
        if (error) throw new Error('entries: ' + error.message);
      }
      if (data.centers?.length) {
        const { error } = await supabase.from('centers').upsert(data.centers, { onConflict: 'id' });
        if (error) throw new Error('centers: ' + error.message);
      }
      if (data.doctors?.length) {
        const { error } = await supabase.from('doctors').upsert(data.doctors, { onConflict: 'id' });
        if (error) throw new Error('doctors: ' + error.message);
      }
      if (data.patient_links?.length) {
        const { error } = await supabase.from('patient_links').upsert(data.patient_links, { onConflict: 'id' });
        if (error) throw new Error('patient_links: ' + error.message);
      }
      setBackupMsg({ type: 'ok', text: `✅ Restauración completada desde ${restorePreview.filename}` });
      setRestorePreview(null);
    } catch (e: any) {
      setBackupMsg({ type: 'err', text: `❌ Error durante la restauración: ${e.message}` });
    }
    setRestoreLoading(false);
  };

  // ── Main layout with sidebar ──
  return (
    <div style={s.shell}>
      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={{ ...s.sidebarLogo, flexDirection: 'column' as const, alignItems: 'flex-start', justifyContent: 'center', gap: 6 }}>
          <img src="/fluxia-logo.png" alt="Fluxia" style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dd8273', letterSpacing: 0.5 }}>Panel admin</div>
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
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Pacientes ({users.filter(u => !doctors.some(d => d.id === u.id)).length})</span>
              </div>
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2 }}>Usuario</span>
                <span style={{ flex: 2 }}>Email</span>
                <span style={{ flex: 1 }}>Registro</span>
                <span style={{ flex: 1 }}>Último acceso</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Estado</span>
              </div>
              {users.filter(u => !doctors.some(d => d.id === u.id)).map((user, i, arr) => {
                const isRecent = user.last_sign_in_at && (Date.now() - new Date(user.last_sign_in_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                return (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #00000010' : 'none' }}>
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

        {/* ── MÉDICOS ── */}
        {section === 'doctores' && (
          <>
            <SectionHeader
              title="Médicos"
              subtitle="Listado de profesionales registrados y gestión de planes"
              actions={<button onClick={loadDoctors} style={s.headerBtn}>🔄 Actualizar</button>}
            />
            <div style={s.statsRow}>
              <StatCard emoji="🩺" label="TOTAL MÉDICOS" value={String(doctors.length)} />
              <StatCard emoji="⭐" label="PLAN FREE" value={String(doctors.filter(d => d.plan === 'free').length)} />
              <StatCard emoji="🧪" label="PLAN BETA" value={String(doctors.filter(d => d.plan === 'beta').length)} />
              <StatCard emoji="🚀" label="PLAN PRO" value={String(doctors.filter(d => d.plan === 'pro').length)} dark />
              <StatCard emoji="🏥" label="ESPECIALIDADES" value={String(new Set(doctors.map(d => d.specialty).filter(Boolean)).size)} />
            </div>

            {/* Doctors list */}
            <div style={s.card}>
              <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#00000008', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' as const }}>
                <span style={{ flex: 2.5 }}>Médico</span>
                <span style={{ flex: 2 }}>Email</span>
                <span style={{ flex: 2 }}>Centro / Consulta</span>
                <span style={{ flex: 1.5 }}>Especialidad</span>
                <span style={{ flex: 1 }}>Alta</span>
                <span style={{ flex: 0.8, textAlign: 'center' as const }}>Pacientes</span>
                <span style={{ flex: 1.2, textAlign: 'center' as const }}>Plan</span>
              </div>
              {doctors.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>No hay médicos registrados</div>
              ) : (
                doctors.map((doc, i) => {
                  const isChanging = changingPlanId === doc.id;
                  const isGoogle = doc.provider === 'google';
                  return (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < doctors.length - 1 ? '1px solid #00000010' : 'none' }}>
                      <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {(doc.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{doc.name}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>{doc.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                      <span style={{ flex: 2, fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {doc.email || (!isGoogle && '—')}
                        {isGoogle && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: '#e8f0fe', color: '#1a73e8', whiteSpace: 'nowrap' as const }}>
                            Google
                          </span>
                        )}
                      </span>
                      <span style={{ flex: 2, fontSize: 13, color: '#555' }}>{doc.center_name}</span>
                      <span style={{ flex: 1.5, fontSize: 13, color: '#555' }}>{doc.specialty || '—'}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#555' }}>{shortDate(doc.created_at)}</span>
                      <span style={{ flex: 0.8, textAlign: 'center' as const, fontSize: 13, fontWeight: 600, color: doc.patientCount > 0 ? '#1a0e0e' : '#bbb' }}>
                        {doc.patientCount}
                      </span>
                      <span style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                          backgroundColor: doc.plan === 'pro' ? '#1a0e0e' : doc.plan === 'beta' ? '#6366f1' : '#fff8e1',
                          color: doc.plan === 'pro' ? '#dd8273' : doc.plan === 'beta' ? '#fff' : '#7a5810',
                          border: doc.plan === 'pro' || doc.plan === 'beta' ? 'none' : '1px solid #ffe082',
                        }}>
                          {doc.plan === 'pro' ? '🚀 Pro' : doc.plan === 'beta' ? '🧪 Beta' : '⭐ Free'}
                        </span>
                        <button
                          onClick={() => setPlanConfirm({ doctor: doc, newPlan: doc.plan === 'pro' ? 'free' : doc.plan === 'beta' ? 'pro' : 'beta' })}
                          disabled={isChanging}
                          title={doc.plan === 'pro' ? 'Cambiar a Free' : doc.plan === 'beta' ? 'Activar Pro' : 'Activar Beta'}
                          style={{
                            padding: '3px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 11,
                            cursor: 'pointer', backgroundColor: '#fff', color: '#555',
                            opacity: isChanging ? 0.4 : 1,
                          }}
                        >
                          {isChanging ? '…' : doc.plan === 'pro' ? '↓ Free' : doc.plan === 'beta' ? '↑ Pro' : '↑ Beta'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(doc)}
                          disabled={deletingId === doc.id}
                          title="Eliminar médico"
                          style={{
                            padding: '3px 8px', borderRadius: 6, border: '1px solid #ffcccc', fontSize: 11,
                            cursor: 'pointer', backgroundColor: '#fff5f5', color: '#c0392b',
                            opacity: deletingId === doc.id ? 0.4 : 1,
                          }}
                        >
                          🗑
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

        {/* ── BACKUPS ── */}
        {section === 'backups' && (
          <>
            <SectionHeader title="Copias de seguridad" subtitle="Exporta e importa el estado completo de la base de datos" />

            {backupMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                backgroundColor: backupMsg.type === 'ok' ? '#2ecc7118' : '#e74c3c18',
                color: backupMsg.type === 'ok' ? '#27ae60' : '#c0392b', fontSize: 13, fontWeight: 600 }}>
                {backupMsg.text}
              </div>
            )}

            {/* Create backup */}
            <div style={s.card}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>💾 Crear copia de seguridad</div>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Descarga un fichero JSON con todos los registros, centros, médicos y vínculos de pacientes.
                </p>
                <button onClick={handleCreateBackup} disabled={backupLoading}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: '#1a0e0e',
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: backupLoading ? 'default' : 'pointer', opacity: backupLoading ? 0.6 : 1 }}>
                  {backupLoading ? 'Generando...' : '⬇️ Descargar backup'}
                </button>
              </div>
              {backupList.length > 0 && (
                <div style={{ borderTop: '1px solid #00000010' }}>
                  <div style={{ padding: '10px 24px 6px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase' as const }}>
                    Backups de esta sesión
                  </div>
                  {backupList.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderTop: '1px solid #00000008' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{b.filename}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{b.summary}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb' }}>{new Date(b.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restore */}
            <div style={s.card}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>🔄 Restaurar copia</div>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Selecciona un fichero JSON generado por esta herramienta. Los registros existentes se mantienen;
                  los del backup se añaden o sobreescriben si ya existen (upsert por ID).
                </p>
                {!restorePreview ? (
                  <label style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, border: '2px dashed #ddd',
                    backgroundColor: '#fafafa', color: '#666', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    📂 Seleccionar fichero de backup
                    <input type="file" accept=".json" style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleRestoreFile(e.target.files[0])} />
                  </label>
                ) : (
                  <div style={{ backgroundColor: '#fff8e1', borderRadius: 10, border: '1px solid #f39c1240', padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>📋 {restorePreview.filename}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.7 }}>
                      📅 Creado: {new Date(restorePreview.data.createdAt).toLocaleString('es')}<br/>
                      📝 {restorePreview.data.entries?.length || 0} registros ·{' '}
                      🏥 {restorePreview.data.centers?.length || 0} centros ·{' '}
                      🩺 {restorePreview.data.doctors?.length || 0} médicos ·{' '}
                      🔗 {restorePreview.data.patient_links?.length || 0} vínculos
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={handleConfirmRestore} disabled={restoreLoading}
                        style={{ padding: '9px 20px', borderRadius: 9, border: 'none', backgroundColor: '#dd8273',
                          color: '#fff', fontWeight: 700, fontSize: 13, cursor: restoreLoading ? 'default' : 'pointer', opacity: restoreLoading ? 0.6 : 1 }}>
                        {restoreLoading ? 'Restaurando...' : '✅ Confirmar restauración'}
                      </button>
                      <button onClick={() => setRestorePreview(null)}
                        style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid #ddd', backgroundColor: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ ...s.card, padding: '16px 20px', backgroundColor: '#f0f4ff', border: '1px solid #c5d0e6' }}>
              <div style={{ fontSize: 13, color: '#3a5080', lineHeight: 1.7 }}>
                <strong>ℹ️ Cómo funciona</strong><br/>
                • <strong>Upsert por ID</strong>: añade lo que no existe, actualiza lo que sí. No borra nada.<br/>
                • Para restaurar borrando todo primero, hazlo desde <strong>Supabase → SQL Editor</strong>.<br/>
                • Guarda los backups fuera del ordenador (Drive, iCloud…) para mayor seguridad.<br/>
                • Para backups automáticos considera el plan Pro de Supabase (PITR).
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Plan change confirmation modal ── */}
      {planConfirm && (() => {
        const { doctor, newPlan } = planConfirm;
        const isPro = newPlan === 'pro';
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{isPro ? '🚀' : '⭐'}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a0e0e', margin: '12px 0 6px' }}>
                  {isPro ? 'Activar plan Pro' : 'Cambiar a plan Free'}
                </h3>
                <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>
                  ¿Confirmas el cambio de plan de <strong>{doctor.name}</strong> a{' '}
                  <strong>{isPro ? 'Pro' : 'Free'}</strong>?
                </p>
                {!isPro && (
                  <p style={{ fontSize: 13, color: '#c0392b', marginTop: 10, backgroundColor: '#fdecea', borderRadius: 8, padding: '8px 12px' }}>
                    El médico quedará limitado a 1 paciente.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setPlanConfirm(null)}
                  style={{ flex: 1, padding: 12, borderRadius: 24, border: '1px solid #ddd', backgroundColor: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setPlanConfirm(null);
                    await handleChangeDoctorPlan(doctor.id, newPlan);
                  }}
                  disabled={changingPlanId === doctor.id}
                  style={{ flex: 1, padding: 12, borderRadius: 24, border: 'none', backgroundColor: '#1a0e0e', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  {isPro ? '🚀 Activar Pro' : '↓ Cambiar a Free'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete doctor confirmation modal ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 40 }}>🗑️</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a0e0e', margin: '12px 0 6px' }}>Eliminar médico</h3>
              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>
                ¿Eliminar a <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})?
              </p>
              <p style={{ fontSize: 13, color: '#c0392b', marginTop: 10, backgroundColor: '#fdecea', borderRadius: 8, padding: '8px 12px' }}>
                Se borrarán su cuenta, centro y vínculos con pacientes. Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: 12, borderRadius: 24, border: '1px solid #ddd', backgroundColor: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteDoctor(deleteConfirm)}
                disabled={deletingId === deleteConfirm.id}
                style={{ flex: 1, padding: 12, borderRadius: 24, border: 'none', backgroundColor: '#c0392b', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {deletingId === deleteConfirm.id ? '…' : '🗑 Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', minHeight: 100,
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
