import { useState, useEffect } from 'react';
import { usePreferences } from '../lib/usePreferences';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { asset } from '../lib/config';
import { registerPushSubscription, unregisterPushSubscription } from '../lib/push';
import { APP_VERSION } from '../lib/version';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { theme } = usePreferences();
  const { user } = useAuth();
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';
  const [code, setCode] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [linkMessage, setLinkMessage] = useState('');
  const [linkedCenter, setLinkedCenter] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushLoading, setPushLoading] = useState(false);
  const isStandalone = typeof window !== 'undefined' &&
    ((navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches);

  // Check push notification status
  useEffect(() => {
    if (!('Notification' in window)) { setPushPermission('unsupported'); return; }
    setPushPermission(Notification.permission);
    if (!user) return;
    supabase.from('push_subscriptions').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setPushSubscribed(!!data));
  }, [user]);

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

  // Load profile data and linked center
  useEffect(() => {
    if (!user) return;
    // Load display_name
    supabase.from('user_profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    // Load linked center
    supabase
      .from('patient_links')
      .select('id, status, center_id')
      .eq('patient_id', user.id)
      .eq('status', 'accepted')
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          supabase.from('centers').select('name').eq('id', data[0].center_id).single()
            .then(({ data: center }) => {
              if (center) setLinkedCenter(center.name);
            });
        }
      });
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    await supabase.from('user_profiles').upsert({ id: user.id, display_name: trimmed || null, email: user.email ?? null }, { onConflict: 'id' });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleLinkDoctor = async () => {
    if (!code.trim()) return;
    if (!user) {
      setLinkStatus('error');
      setLinkMessage('Debes iniciar sesión primero');
      return;
    }
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
    await supabase
      .from('patient_links')
      .update({ status: 'rejected' })
      .eq('patient_id', user.id)
      .eq('status', 'accepted');
    setLinkedCenter(null);
    setLinkStatus('idle');
    setLinkMessage('');
    setCode('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md h-full mx-auto flex flex-col relative">
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto px-6 pb-8">
          {/* Header: logo + close */}
          <div className="relative flex justify-center pt-12 pb-4">
            <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
            <button onClick={onClose} className="absolute top-5 right-0 w-10 h-10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill={theme.text} />
                <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 className="text-sm font-black mb-6" style={{ color: theme.text }}>AJUSTES</h2>

          {/* Display name */}
          {user && (
            <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-sm font-black mb-1" style={{ color: theme.text }}>👤 TU NOMBRE</p>
              <p className="text-xs mt-1 mb-3" style={{ color: `${theme.text}80` }}>
                Opcional. Si lo introduces, tu médico lo verá en lugar de tu email.
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: María García"
                maxLength={60}
                className="w-full rounded-lg p-3 text-sm outline-none placeholder-white/50"
                style={{ backgroundColor: theme.main, color: theme.text }}
              />
              <button
                onClick={handleSaveName}
                className="w-full mt-3 rounded-full py-2.5 text-sm font-bold active:scale-95 transition-transform"
                style={{ backgroundColor: theme.text, color: invertColor }}
              >
                {nameSaved ? '✅ Guardado' : 'Guardar nombre'}
              </button>
            </div>
          )}

          {/* Link with doctor */}
          {user && (
            <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-sm font-black mb-1" style={{ color: theme.text }}>🏥 VINCULAR CON MI MÉDICO</p>

              {linkedCenter ? (
                <div>
                  <p className="text-sm mt-3" style={{ color: theme.text }}>
                    Vinculado con: <strong>{linkedCenter}</strong>
                  </p>
                  <p className="text-xs mt-1" style={{ color: `${theme.text}80` }}>
                    Tu médico puede ver tus registros para ayudarte mejor.
                  </p>
                  <button
                    onClick={handleUnlink}
                    className="mt-4 rounded-full px-6 py-2 text-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: '#c0392b', color: 'white' }}
                  >
                    Desvincular
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs mt-1 mb-3" style={{ color: `${theme.text}80` }}>
                    Si tu médico te ha dado un código, introdúcelo aquí para compartir tus registros.
                  </p>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CAC-XXXXXX"
                    maxLength={10}
                    className="w-full rounded-lg p-3 text-center text-lg font-bold tracking-widest outline-none uppercase placeholder-white/50"
                    style={{ backgroundColor: theme.main, color: theme.text, letterSpacing: 3 }}
                  />
                  <button
                    onClick={handleLinkDoctor}
                    disabled={linkStatus === 'loading' || !code.trim()}
                    className="w-full mt-3 rounded-full py-2.5 text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ backgroundColor: theme.text, color: invertColor }}
                  >
                    {linkStatus === 'loading' ? 'Verificando...' : 'Vincular'}
                  </button>
                  {linkStatus === 'success' && (
                    <p className="text-xs mt-2 text-center" style={{ color: '#27ae60' }}>✅ {linkMessage}</p>
                  )}
                  {linkStatus === 'error' && (
                    <p className="text-xs mt-2 text-center" style={{ color: '#c0392b' }}>❌ {linkMessage}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Push notifications */}
          {user && pushPermission !== 'unsupported' && (
            <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: theme.glass }}>
              <p className="text-sm font-black mb-1" style={{ color: theme.text }}>🔔 NOTIFICACIONES</p>

              {!isStandalone ? (
                /* iOS Safari: must be installed as PWA first */
                <>
                  <p className="text-xs mt-2 mb-3" style={{ color: `${theme.text}80` }}>
                    Para activar notificaciones en iOS, primero instala la app en tu pantalla de inicio:
                  </p>
                  <p className="text-xs mb-1" style={{ color: `${theme.text}80` }}>1. Toca el botón compartir <strong>⎋</strong> en Safari</p>
                  <p className="text-xs mb-1" style={{ color: `${theme.text}80` }}>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                  <p className="text-xs mb-3" style={{ color: `${theme.text}80` }}>3. Abre la app desde el icono y vuelve a Ajustes</p>
                  <p className="text-[10px]" style={{ color: `${theme.text}50` }}>Requiere iOS 16.4 o superior</p>
                </>
              ) : pushPermission === 'denied' ? (
                <>
                  <p className="text-xs mt-2 mb-3" style={{ color: `${theme.text}80` }}>
                    Las notificaciones están bloqueadas. En iOS, elimina la app de la pantalla de inicio, reinstálala desde Safari y acepta el permiso cuando aparezca.
                  </p>
                  <button
                    onClick={() => setPushPermission(Notification.permission)}
                    className="w-full rounded-full py-2 text-xs font-bold active:scale-95 transition-transform border-2"
                    style={{ borderColor: theme.text, color: theme.text }}
                  >
                    Volver a verificar
                  </button>
                </>
              ) : pushSubscribed ? (
                <>
                  <p className="text-xs mt-1 mb-3" style={{ color: `${theme.text}80` }}>
                    ✅ Activadas. Recibirás un recordatorio si llevas un tiempo sin registrar.
                  </p>
                  <button
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="w-full mt-1 rounded-full py-2.5 text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(192,57,43,0.12)', color: '#c0392b' }}
                  >
                    {pushLoading ? '...' : 'Desactivar notificaciones'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs mt-1 mb-3" style={{ color: `${theme.text}80` }}>
                    Activa los recordatorios para no olvidar registrar tu actividad.
                  </p>
                  <button
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="w-full mt-1 rounded-full py-2.5 text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ backgroundColor: theme.text, color: theme.id === 'night' ? '#1a1a2e' : 'white' }}
                  >
                    {pushLoading ? '...' : 'Activar notificaciones'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* About */}
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: theme.glass }}>
            <p className="text-base font-bold" style={{ color: theme.text }}>
              Cacalendario es 100% gratis
            </p>
            <p className="text-xs mt-2" style={{ color: `${theme.text}80` }}>
              Todas las funciones desbloqueadas. Sin límites, sin publicidad.
            </p>
            <p className="text-[10px] mt-4" style={{ color: `${theme.text}60` }}>
              Hecho con ❤️ en España.
            </p>
            <p className="text-[10px] mt-2" style={{ color: `${theme.text}40` }}>
              {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
