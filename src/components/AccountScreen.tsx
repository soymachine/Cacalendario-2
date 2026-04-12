import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { usePreferences } from '../lib/usePreferences';
import { getEntries } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { registerPushSubscription, unregisterPushSubscription } from '../lib/push';
import { APP_VERSION } from '../lib/version';
import { D } from '../lib/design';

interface AccountScreenProps {
  onShowAuth: () => void;
  onShowPrivacy: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'bug', emoji: '🐛', label: 'Error' },
  { id: 'suggestion', emoji: '💡', label: 'Sugerencia' },
  { id: 'question', emoji: '❓', label: 'Pregunta' },
  { id: 'other', emoji: '💬', label: 'Otro' },
] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number]['id'];

const card: React.CSSProperties = {
  backgroundColor: D.card,
  borderRadius: 16,
  padding: '16px',
  marginBottom: 12,
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: D.textMuted,
  letterSpacing: 0.5,
  marginBottom: 8,
  display: 'block',
};

export default function AccountScreen({ onShowAuth, onShowPrivacy }: AccountScreenProps) {
  const { user, signOut } = useAuth();
  const { emoji } = usePreferences();

  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [code, setCode] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [linkMessage, setLinkMessage] = useState('');
  const [linkedCenter, setLinkedCenter] = useState<string | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushLoading, setPushLoading] = useState(false);

  // Profile state
  const [exported, setExported] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback state
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const isStandalone = typeof window !== 'undefined' &&
    ((navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    if (!user) return;
    // Load display_name
    supabase.from('user_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name); });
    // Load linked center
    supabase.from('patient_links').select('id, status, center_id')
      .eq('patient_id', user.id).eq('status', 'accepted').limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          supabase.from('centers').select('name').eq('id', data[0].center_id).single()
            .then(({ data: center }) => { if (center) setLinkedCenter(center.name); });
        }
      });
    // Check push
    if (!('Notification' in window)) { setPushPermission('unsupported'); return; }
    setPushPermission(Notification.permission);
    supabase.from('push_subscriptions').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setPushSubscribed(!!data));
  }, [user]);

  useEffect(() => {
    if (user) setFeedbackEmail(user.email || '');
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    await supabase.from('user_profiles').upsert(
      { id: user.id, display_name: trimmed || null, email: user.email ?? null },
      { onConflict: 'id' }
    );
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleLinkDoctor = async () => {
    if (!code.trim() || !user) return;
    setLinkStatus('loading');
    const { data, error } = await supabase.rpc('patient_accept_invite', { p_code: code.trim().toUpperCase() });
    if (error || !data?.success) {
      setLinkStatus('error');
      setLinkMessage(data?.error || 'Código no válido');
    } else {
      setLinkStatus('success');
      setLinkMessage(`Vinculado con ${data.center_name}`);
      setLinkedCenter(data.center_name);
    }
  };

  const handleUnlink = async () => {
    if (!user) return;
    await supabase.from('patient_links').update({ status: 'rejected' })
      .eq('patient_id', user.id).eq('status', 'accepted');
    setLinkedCenter(null);
    setLinkStatus('idle');
    setLinkMessage('');
    setCode('');
  };

  const handleTogglePush = async () => {
    if (!user) return;
    setPushLoading(true);
    if (pushSubscribed) {
      await unregisterPushSubscription(user.id);
      setPushSubscribed(false);
    } else {
      await registerPushSubscription(user.id);
      const perm = Notification.permission;
      setPushPermission(perm);
      if (perm === 'granted') {
        const { data } = await supabase.from('push_subscriptions').select('id').eq('user_id', user.id).maybeSingle();
        setPushSubscribed(!!data);
      }
    }
    setPushLoading(false);
  };

  const handleExportData = () => {
    const entries = getEntries();
    const exportData = {
      app: 'Fluxia',
      exportDate: new Date().toISOString(),
      user: user?.email,
      totalEntries: entries.length,
      entries,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxia-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    setConfirmLogout(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { error: fnError } = await supabase.functions.invoke('delete-user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (fnError) {
          await supabase.from('entries').delete().eq('user_id', user.id);
          await supabase.auth.signOut();
        }
      } else {
        await supabase.from('entries').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
      }
      localStorage.removeItem('cacalendario_entries');
      localStorage.removeItem('cacalendario_prefs');
      window.dispatchEvent(new Event('fluxia-updated'));
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) { setFeedbackError('Escribe un mensaje'); return; }
    if (!feedbackEmail.trim()) { setFeedbackError('Indica tu email para poder responderte'); return; }
    setFeedbackLoading(true);
    setFeedbackError('');
    const { error: dbError } = await supabase.from('feedback').insert({
      user_email: feedbackEmail.trim(),
      message: feedbackMessage.trim(),
      type: feedbackType,
    });
    if (dbError) {
      setFeedbackError('Error al enviar. Inténtalo de nuevo.');
    } else {
      setFeedbackSent(true);
    }
    setFeedbackLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: D.bg,
    border: `1px solid ${D.border}`,
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 15,
    color: D.text,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const chipBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 4px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: active ? D.primary : D.bg,
    color: active ? D.primaryText : D.text,
    fontSize: 12,
    fontWeight: 700,
    transition: 'all 0.1s',
  });

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: D.primary,
    color: D.primaryText,
    fontSize: 15,
    fontWeight: 700,
  };

  const outlineBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: 50,
    border: `2px solid ${D.border}`,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: D.text,
    fontSize: 15,
    fontWeight: 700,
  };

  const dangerBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: D.dangerBg,
    color: D.danger,
    fontSize: 15,
    fontWeight: 700,
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: D.bg }}>
      <div style={{ padding: '24px 16px 32px', maxWidth: 480, margin: '0 auto' }}>

        {/* ── NOT LOGGED IN ── */}
        {!user && (
          <>
            <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>👤</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: D.text, marginBottom: 8 }}>
                Inicia sesión para sincronizar
              </p>
              <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                Guarda tus registros en la nube y accede desde cualquier dispositivo.
              </p>
              <button onClick={onShowAuth} style={primaryBtn}>
                Iniciar sesión / Registrarse
              </button>
            </div>
          </>
        )}

        {/* ── LOGGED IN ── */}
        {user && (
          <>
            {/* User card */}
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                backgroundColor: D.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: D.primaryText }}>
                  {(user.email || '?')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: D.success, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: D.textMuted }}>Sincronización activa</span>
                </div>
              </div>
            </div>

            {/* Sign out — right below user card */}
            {confirmLogout ? (
              <div style={{ ...card, marginBottom: 12 }}>
                <p style={{ fontSize: 14, color: D.text, textAlign: 'center', marginBottom: 4 }}>¿Seguro que quieres cerrar sesión?</p>
                <p style={{ fontSize: 12, color: D.textMuted, textAlign: 'center', marginBottom: 12 }}>Tus datos locales se mantendrán en este dispositivo.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmLogout(false)} style={{ ...outlineBtn, flex: 1 }}>Cancelar</button>
                  <button onClick={handleSignOut} style={{ ...dangerBtn, flex: 1, backgroundColor: D.danger, color: 'white' }}>Salir</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmLogout(true)} style={{ ...dangerBtn, marginBottom: 12 }}>
                Cerrar sesión
              </button>
            )}

            {/* Display name */}
            <div style={card}>
              <span style={label}>👤 TU NOMBRE</span>
              <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 10, marginTop: -4 }}>
                Opcional. Tu médico lo verá en lugar de tu email.
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: María García"
                maxLength={60}
                style={inputStyle}
              />
              <button
                onClick={handleSaveName}
                style={{ ...primaryBtn, marginTop: 10 }}
              >
                {nameSaved ? '✅ Guardado' : 'Guardar nombre'}
              </button>
            </div>

            {/* Link with doctor */}
            <div style={card}>
              <span style={label}>🏥 VINCULAR CON MI MÉDICO</span>
              {linkedCenter ? (
                <>
                  <p style={{ fontSize: 14, color: D.text, marginBottom: 4 }}>
                    Vinculado con: <strong>{linkedCenter}</strong>
                  </p>
                  <p style={{ fontSize: 12, color: D.textMuted }}>
                    Tu médico puede ver tus registros para ayudarte mejor.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 10, marginTop: -4 }}>
                    Si tu médico te ha dado un código, introdúcelo aquí para compartir tus registros.
                  </p>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CAC-XXXXXX"
                    maxLength={10}
                    style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 3 }}
                  />
                  <button
                    onClick={handleLinkDoctor}
                    disabled={linkStatus === 'loading' || !code.trim()}
                    style={{ ...primaryBtn, marginTop: 10, opacity: (linkStatus === 'loading' || !code.trim()) ? 0.5 : 1 }}
                  >
                    {linkStatus === 'loading' ? 'Verificando...' : 'Vincular'}
                  </button>
                  {linkStatus === 'success' && (
                    <p style={{ fontSize: 12, color: D.success, textAlign: 'center', marginTop: 8 }}>✅ {linkMessage}</p>
                  )}
                  {linkStatus === 'error' && (
                    <p style={{ fontSize: 12, color: D.danger, textAlign: 'center', marginTop: 8 }}>❌ {linkMessage}</p>
                  )}
                </>
              )}
            </div>

            {/* Push notifications */}
            {pushPermission !== 'unsupported' && (
              <div style={card}>
                <span style={label}>🔔 NOTIFICACIONES</span>
                {!isStandalone ? (
                  <>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 6 }}>
                      Para activar notificaciones en iOS, primero instala la app en tu pantalla de inicio:
                    </p>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 2 }}>1. Toca el botón compartir <strong>⎋</strong> en Safari</p>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 2 }}>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 8 }}>3. Abre la app desde el icono y vuelve a Cuenta</p>
                    <p style={{ fontSize: 11, color: D.textMuted }}>Requiere iOS 16.4 o superior</p>
                  </>
                ) : pushPermission === 'denied' ? (
                  <>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 6 }}>
                      Las notificaciones están bloqueadas. Para activarlas:
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: D.textMuted, marginBottom: 12 }}>
                      Ajustes del iPhone → busca "Fluxia" → Notificaciones → Permitir
                    </p>
                    <button
                      onClick={() => setPushPermission(Notification.permission)}
                      style={outlineBtn}
                    >
                      Ya lo he activado — volver a verificar
                    </button>
                  </>
                ) : pushSubscribed ? (
                  <>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 12 }}>
                      ✅ Activadas. Recibirás un recordatorio si llevas un tiempo sin registrar.
                    </p>
                    <button
                      onClick={handleTogglePush}
                      disabled={pushLoading}
                      style={{ ...dangerBtn, opacity: pushLoading ? 0.5 : 1 }}
                    >
                      {pushLoading ? '...' : 'Desactivar notificaciones'}
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 12 }}>
                      Activa los recordatorios para no olvidar registrar tu actividad.
                    </p>
                    <button
                      onClick={handleTogglePush}
                      disabled={pushLoading}
                      style={{ ...primaryBtn, opacity: pushLoading ? 0.5 : 1 }}
                    >
                      {pushLoading ? '...' : 'Activar notificaciones'}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── FEEDBACK ── */}
        <div style={card}>
          <span style={label}>💬 FEEDBACK</span>
          {feedbackSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>💌</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 6 }}>¡Mensaje enviado!</p>
              <p style={{ fontSize: 13, color: D.textMuted }}>Gracias por tu feedback. Lo revisaremos pronto.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 12, marginTop: -4 }}>
                ¿Has encontrado un error o tienes una idea para mejorar?
              </p>

              {/* Email if not logged in */}
              {!user && (
                <>
                  <p style={{ ...label, marginBottom: 6 }}>TU EMAIL</p>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="para poder responderte"
                    style={{ ...inputStyle, marginBottom: 12 }}
                  />
                </>
              )}

              {/* Type */}
              <p style={{ ...label, marginBottom: 6 }}>TIPO</p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFeedbackType(type.id)}
                    style={chipBtn(feedbackType === type.id)}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{type.emoji}</div>
                    <div>{type.label}</div>
                  </button>
                ))}
              </div>

              {/* Message */}
              <p style={{ ...label, marginBottom: 6 }}>MENSAJE</p>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Describe el error o tu sugerencia..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  marginBottom: feedbackError ? 8 : 12,
                }}
              />

              {feedbackError && (
                <p style={{ fontSize: 13, color: D.danger, marginBottom: 8 }}>{feedbackError}</p>
              )}

              <button
                onClick={handleSendFeedback}
                disabled={feedbackLoading}
                style={{ ...primaryBtn, opacity: feedbackLoading ? 0.5 : 1 }}
              >
                {feedbackLoading ? 'Enviando...' : 'Enviar feedback'}
              </button>
            </>
          )}
        </div>

        {/* ── DATA MANAGEMENT (logged in) ── */}
        {user && (
          <div style={card}>
            <span style={label}>DATOS</span>

            {/* Export */}
            <button
              onClick={handleExportData}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `1px solid ${D.border}`,
              }}
            >
              <span style={{ fontSize: 20 }}>📦</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>
                  {exported ? '¡Descargado!' : 'Exportar mis datos'}
                </p>
                <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}>Descargar en formato JSON</p>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Privacy */}
            <button
              onClick={onShowPrivacy}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>🔒</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: D.text, margin: 0 }}>Política de privacidad</p>
                <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}>Tus derechos y nuestro uso de datos</p>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1L7 7L1 13" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ── DELETE ACCOUNT (subtle, at the bottom) ── */}
        {user && confirmDelete ? (
          <div style={{ ...card, marginBottom: 12, border: `2px solid ${D.danger}`, backgroundColor: D.dangerBg }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: D.danger, textAlign: 'center', marginBottom: 6 }}>⚠️ ¿Estás seguro?</p>
            <p style={{ fontSize: 12, color: D.danger, textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>
              Esta acción es <strong>irreversible</strong>. Se borrarán todos tus registros de la nube y del dispositivo.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ ...outlineBtn, flex: 1 }}>Cancelar</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ flex: 1, padding: '12px 0', borderRadius: 50, border: 'none', cursor: 'pointer', backgroundColor: D.danger, color: 'white', fontSize: 14, fontWeight: 700, opacity: deleting ? 0.5 : 1 }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar todo'}
              </button>
            </div>
          </div>
        ) : null}

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 4 }}>
            Fluxia es 100% gratis
          </p>
          <p style={{ fontSize: 11, color: D.textMuted }}>
            Hecho con ❤️ en España · {APP_VERSION}
          </p>
          {user && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 16, fontSize: 12, color: D.danger, opacity: 0.6 }}
            >
              Eliminar mi cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
