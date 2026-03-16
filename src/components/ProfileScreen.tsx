import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { asset } from '../lib/config';

interface ProfileScreenProps {
  onClose: () => void;
}

export default function ProfileScreen({ onClose }: ProfileScreenProps) {
  const { user, signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-salmon">
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#231f20" />
            <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-6 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        <div className="flex-1 px-10 flex flex-col">
          <p className="text-2xl font-black text-black">MI CUENTA</p>

          {/* Avatar */}
          <div className="flex items-center gap-4 mt-6">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-2xl font-black">
                {(user.email || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-base text-black font-black">{user.email}</p>
              <p className="text-sm text-black/50 mt-1">Datos sincronizados</p>
            </div>
          </div>

          {/* Sync status */}
          <div className="mt-8 rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <p className="text-sm text-black">Sincronización activa</p>
            </div>
            <p className="text-xs text-black/50 mt-2">
              Tus registros se guardan en la nube automáticamente. Puedes acceder desde cualquier dispositivo.
            </p>
          </div>
        </div>

        {/* Sign out button */}
        <div className="shrink-0 flex justify-center px-10 py-6">
          {confirmLogout ? (
            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              <p className="text-sm text-black text-center">¿Seguro que quieres cerrar sesión?</p>
              <p className="text-xs text-black/50 text-center">Tus datos locales se mantendrán en este dispositivo.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 rounded-full py-2.5 active:scale-95 transition-transform border-2 border-black"
                >
                  <span className="text-black text-base">cancelar</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 bg-black rounded-full py-2.5 active:scale-95 transition-transform"
                >
                  <span className="text-white text-base">salir</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full max-w-sm rounded-full py-2.5 flex items-center justify-center active:scale-95 transition-transform border-2 border-black"
            >
              <span className="text-black text-lg">cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
