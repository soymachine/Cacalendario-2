import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { asset } from '../lib/config';
import { usePreferences } from '../lib/usePreferences';
import { getEntries } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  onClose: () => void;
  onShowPrivacy: () => void;
}

export default function ProfileScreen({ onClose, onShowPrivacy }: ProfileScreenProps) {
  const { user, signOut } = useAuth();
  const { theme } = usePreferences();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleExportData = () => {
    const entries = getEntries();
    const exportData = {
      app: 'Cacalendario',
      exportDate: new Date().toISOString(),
      user: user.email,
      totalEntries: entries.length,
      entries: entries,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cacalendario-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // 1. Get current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        // 2. Call Edge Function to delete user + data server-side
        const { error: fnError } = await supabase.functions.invoke('delete-user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (fnError) {
          console.error('Edge function error, falling back to client-side delete:', fnError);
          // Fallback: delete entries client-side
          await supabase.from('entries').delete().eq('user_id', user.id);
          await supabase.auth.signOut();
        }
      } else {
        // No session, just clean up what we can
        await supabase.from('entries').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
      }

      // 3. Clear local storage
      localStorage.removeItem('cacalendario_entries');
      localStorage.removeItem('cacalendario_prefs');

      window.dispatchEvent(new Event('cacalendario-updated'));
      onClose();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md h-full mx-auto flex flex-col relative">
        <div className="flex-1 min-h-0 px-10 flex flex-col overflow-y-auto pb-8">
          {/* Header: logo + close */}
          <div className="relative flex justify-center pt-12 pb-6">
            <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
            <button onClick={onClose} className="absolute top-5 right-0 w-10 h-10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill={theme.text} />
                <path d="M8 8L16 16M16 8L8 16" stroke={invertColor} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="text-2xl font-black" style={{ color: theme.text }}>MI CUENTA</p>

          {/* Avatar */}
          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.text }}>
              <span className="text-2xl font-black" style={{ color: invertColor }}>
                {(user.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-base font-black" style={{ color: theme.text }}>{user.email}</p>
              <p className="text-sm mt-1" style={{ color: `${theme.text}80` }}>Datos sincronizados</p>
            </div>
          </div>

          {/* Sync status */}
          <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: theme.glass }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <p className="text-sm" style={{ color: theme.text }}>Sincronización activa</p>
            </div>
            <p className="text-xs mt-2" style={{ color: `${theme.text}80` }}>
              Tus registros se guardan en la nube automáticamente.
            </p>
          </div>

          {/* Export data */}
          <button
            onClick={handleExportData}
            className="mt-4 w-full rounded-lg p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: theme.glass }}
          >
            <span className="text-xl">📦</span>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: theme.text }}>
                {exported ? '¡Descargado!' : 'Exportar mis datos'}
              </p>
              <p className="text-xs" style={{ color: `${theme.text}80` }}>Descargar en formato JSON</p>
            </div>
          </button>

          {/* Privacy policy link */}
          <button
            onClick={onShowPrivacy}
            className="mt-4 w-full rounded-lg p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: theme.glass }}
          >
            <span className="text-xl">🔒</span>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: theme.text }}>Política de privacidad</p>
              <p className="text-xs" style={{ color: `${theme.text}80` }}>Tus derechos y nuestro uso de datos</p>
            </div>
          </button>

          {/* Delete account */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="mt-4 w-full rounded-lg p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: 'rgba(192,57,43,0.1)' }}
            >
              <span className="text-xl">⚠️</span>
              <div className="text-left">
                <p className="text-sm font-bold text-red-700">Eliminar mi cuenta</p>
                <p className="text-xs text-red-700/70">Borrar todos mis datos permanentemente</p>
              </div>
            </button>
          ) : (
            <div className="mt-4 rounded-lg p-4 border-2 border-red-500" style={{ backgroundColor: 'rgba(192,57,43,0.08)' }}>
              <p className="text-sm font-bold text-red-700 text-center">⚠️ ¿Estás seguro?</p>
              <p className="text-xs text-red-700/80 text-center mt-2">
                Esta acción es <strong>irreversible</strong>. Se borrarán todos tus registros de la nube y del dispositivo.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform border-2"
                  style={{ borderColor: theme.text }}
                >
                  <span className="text-sm" style={{ color: theme.text }}>cancelar</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform disabled:opacity-50"
                  style={{ backgroundColor: '#c0392b' }}
                >
                  <span className="text-white text-sm font-bold">
                    {deleting ? 'eliminando...' : 'sí, eliminar todo'}
                  </span>
                </button>
              </div>
            </div>
          )}
          {/* Sign out button */}
          <div className="flex justify-center mt-6">
            {confirmLogout ? (
              <div className="w-full flex flex-col items-center gap-3">
                <p className="text-sm text-center" style={{ color: theme.text }}>¿Seguro que quieres cerrar sesión?</p>
                <p className="text-xs text-center" style={{ color: `${theme.text}80` }}>Tus datos locales se mantendrán en este dispositivo.</p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform border-2"
                    style={{ borderColor: theme.text }}
                  >
                    <span className="text-base" style={{ color: theme.text }}>cancelar</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform"
                    style={{ backgroundColor: '#c0392b' }}
                  >
                    <span className="text-white text-base font-bold">salir</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full rounded-full py-2.5 flex items-center justify-center active:scale-95 transition-transform border-2"
                style={{ borderColor: theme.text }}
              >
                <span className="text-lg" style={{ color: theme.text }}>cerrar sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
