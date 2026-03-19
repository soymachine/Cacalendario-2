import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FeedbackItem {
  id: string;
  user_email: string;
  message: string;
  created_at: string;
}

const ADMIN_EMAILS = ['soymachine@gmail.com', 'ericbarbercot@icloud.com'];

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    // Check if user is admin
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
    loadFeedback();
  }, [loggedIn]);

  const loadFeedback = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setFeedback(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    setFeedback(feedback.filter((f) => f.id !== id));
  };

  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Admin Panel</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Acceso restringido</p>

        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 14 }}
        />

        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 14 }}
        />

        {error && <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 12, borderRadius: 24, backgroundColor: '#222', color: 'white',
            border: 'none', fontSize: 16, cursor: 'pointer', opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '...' : 'Entrar'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Feedback ({feedback.length})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={loadFeedback}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
          >
            🔄 Actualizar
          </button>
          <button
            onClick={() => { supabase.auth.signOut(); setLoggedIn(false); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#666' }}>Cargando...</p>}

      {feedback.length === 0 && !loading && (
        <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>No hay feedback todavía</p>
      )}

      {feedback.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 12,
            backgroundColor: '#fafafa'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{item.user_email}</span>
              <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                {new Date(item.created_at).toLocaleString('es-ES')}
              </span>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#c0392b' }}
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.message}</p>
        </div>
      ))}
    </div>
  );
}
