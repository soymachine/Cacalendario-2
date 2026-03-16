import { useAuth } from '../lib/auth';
import { usePreferences } from '../lib/usePreferences';

interface ProfileButtonProps {
  onLoginClick: () => void;
  onProfileClick: () => void;
}

export default function ProfileButton({ onLoginClick, onProfileClick }: ProfileButtonProps) {
  const { user, loading } = useAuth();
  const { theme } = usePreferences();

  if (loading) return <div className="w-10 h-10" />;

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 rounded-full px-4 py-2 active:opacity-70 transition-opacity"
        style={{ backgroundColor: theme.glass }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={theme.text} strokeWidth="2" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={theme.text} strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-black" style={{ color: theme.text }}>ENTRAR</span>
      </button>
    );
  }

  // Logged in: show avatar with first letter
  const initial = (user.email || '?')[0].toUpperCase();
  return (
    <button
      onClick={onProfileClick}
      className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
      style={{ backgroundColor: theme.text }}
    >
      <span className="text-sm font-black" style={{ color: theme.id === 'night' ? '#1a1a2e' : 'white' }}>{initial}</span>
    </button>
  );
}
