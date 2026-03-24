import { usePreferences } from '../lib/usePreferences';
import { asset } from '../lib/config';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { theme } = usePreferences();

  return (
    <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: theme.main }}>
      <div className="w-full max-w-md flex flex-col h-screen relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-5 right-4 z-10 w-10 h-10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={theme.text} />
            <path d="M8 8L16 16M16 8L8 16" stroke={theme.id === 'night' ? '#1a1a2e' : 'white'} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center pt-12 pb-4 shrink-0">
          <img src={asset('/logo.svg')} alt="Cacalendario" className="w-20 h-[71px]" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 pb-8">
          <h2 className="text-sm font-black mb-6" style={{ color: theme.text }}>AJUSTES</h2>

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
          </div>
        </div>
      </div>
    </div>
  );
}
