import { useAuth } from '../lib/auth';

interface ProfileButtonProps {
  onLoginClick: () => void;
  onProfileClick: () => void;
}

export default function ProfileButton({ onLoginClick, onProfileClick }: ProfileButtonProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="absolute top-5 left-4 z-10 flex items-center gap-2 bg-black/10 rounded-full px-4 py-2 active:bg-black/20 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#231f20" strokeWidth="2" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="#231f20" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-black text-[#231f20]">ENTRAR</span>
      </button>
    );
  }

  // Logged in: show avatar with first letter
  const initial = (user.email || '?')[0].toUpperCase();
  return (
    <button
      onClick={onProfileClick}
      className="absolute top-5 left-4 z-10 w-10 h-10 rounded-full bg-black flex items-center justify-center active:scale-95 transition-transform"
    >
      <span className="text-white text-sm font-black">{initial}</span>
    </button>
  );
}
