// Reusable paywall/upgrade prompt component
import { usePreferences } from '../lib/usePreferences';
import type { UserTier } from '../lib/tiers';
import { getUpgradeMessage } from '../lib/tiers';

interface UpgradePromptProps {
  tier: UserTier;
  feature: string; // e.g. "estadísticas completas", "más registros"
  onRegister: () => void;
  onPremium: () => void;
  compact?: boolean;
}

export default function UpgradePrompt({ tier, feature, onRegister, onPremium, compact = false }: UpgradePromptProps) {
  const { theme } = usePreferences();
  const { title, cta, target } = getUpgradeMessage(tier);
  const invertColor = theme.id === 'night' ? '#1a1a2e' : 'white';
  const onClick = target === 'register' ? onRegister : onPremium;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
        style={{ backgroundColor: theme.glass }}
      >
        <span className="text-2xl">🔒</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold" style={{ color: theme.text }}>
            {feature}
          </p>
          <p className="text-xs" style={{ color: `${theme.text}80` }}>{cta}</p>
        </div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0">
          <path d="M1 1L7 7L1 13" stroke={`${theme.text}60`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: theme.glass }}>
      <p className="text-4xl mb-3">{tier === 'anon' ? '📝' : '⭐'}</p>
      <p className="text-lg font-black" style={{ color: theme.text }}>{title}</p>
      <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
        {tier === 'anon'
          ? 'Crea una cuenta gratuita para desbloquear más funciones.'
          : `Hazte Premium para desbloquear ${feature}.`}
      </p>
      <button
        onClick={onClick}
        className="mt-4 rounded-full px-8 py-3 active:scale-95 transition-transform"
        style={{ backgroundColor: theme.text }}
      >
        <span className="text-base font-bold" style={{ color: invertColor }}>{cta}</span>
      </button>
    </div>
  );
}
