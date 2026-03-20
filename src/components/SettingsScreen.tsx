import { useState, useEffect } from 'react';
import {
  POOP_EMOJIS,
  THEMES,
  getPreferences,
  savePreferences,
  applyTheme,
  getSelectedTheme,
  type PoopEmoji,
  type Theme,
} from '../lib/preferences';
import { asset } from '../lib/config';
import { useTier } from '../lib/useTier';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [prefs, setPrefs] = useState(getPreferences);
  const [showTipThanks, setShowTipThanks] = useState(false);
  const { tier, limits } = useTier();
  const theme = THEMES.find((t) => t.id === prefs.themeId) || THEMES[0];

  const selectEmoji = (emoji: PoopEmoji, index: number) => {
    // Check if within tier limit
    if (index >= limits.freeEmojis && tier !== 'premium') return;
    const updated = savePreferences({ emojiId: emoji.id });
    setPrefs(updated);
  };

  const selectTheme = (t: Theme, index: number) => {
    if (index >= limits.freeThemes && tier !== 'premium') return;
    const updated = savePreferences({ themeId: t.id });
    setPrefs(updated);
    applyTheme(t);
  };

  const handleTip = (amount: string) => {
    // Open buy me a coffee or similar
    window.open(`https://buymeacoffee.com/cacalendario`, '_blank');
    setShowTipThanks(true);
    setTimeout(() => setShowTipThanks(false), 3000);
  };

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

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto px-6 pb-8">
          <h2 className="text-sm font-black mb-6" style={{ color: theme.text }}>AJUSTES</h2>

          {/* === EMOJI PICKER === */}
          <div className="mb-8">
            <p className="text-xs font-black mb-3" style={{ color: theme.text, opacity: 0.6 }}>
              EMOJI DE CACA
            </p>
            <div className="grid grid-cols-5 gap-2">
              {POOP_EMOJIS.map((emoji, idx) => {
                const isSelected = prefs.emojiId === emoji.id;
                const isLocked = idx >= limits.freeEmojis && tier !== 'premium';
                return (
                  <button
                    key={emoji.id}
                    onClick={() => selectEmoji(emoji, idx)}
                    className={`relative rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      isLocked ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? theme.text : theme.glass,
                      border: isSelected ? 'none' : '2px solid transparent',
                    }}
                  >
                    <span className="text-2xl">
                      {emoji.char === 'svg' ? '💩' : emoji.char}
                    </span>
                    <span
                      className="text-[9px] font-bold leading-tight"
                      style={{ color: isSelected ? (theme.id === 'night' ? '#1a1a2e' : 'white') : theme.text }}
                    >
                      {emoji.label}
                    </span>
                    {isLocked && (
                      <div className="absolute top-1 right-1">
                        <span className="text-xs">🔒</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-2" style={{ color: theme.text, opacity: 0.4 }}>
              🔒 = {tier === 'anon' ? 'Regístrate para desbloquear más' : 'Disponible con Premium ⭐'}
            </p>
          </div>

          {/* === THEME PICKER === */}
          <div className="mb-8">
            <p className="text-xs font-black mb-3" style={{ color: theme.text, opacity: 0.6 }}>
              TEMA
            </p>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t, idx) => {
                const isSelected = prefs.themeId === t.id;
                const isLocked = idx >= limits.freeThemes && tier !== 'premium';
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTheme(t, idx)}
                    className={`relative rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                      isLocked ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? theme.text : theme.glass,
                      border: isSelected ? 'none' : '2px solid transparent',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: t.main }}
                    >
                      <span className="text-sm">{t.emoji}</span>
                    </div>
                    <span
                      className="text-[9px] font-bold leading-tight"
                      style={{ color: isSelected ? (theme.id === 'night' ? '#1a1a2e' : 'white') : theme.text }}
                    >
                      {t.label}
                    </span>
                    {isLocked && (
                      <div className="absolute top-1 right-1">
                        <span className="text-xs">🔒</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] mt-2" style={{ color: theme.text, opacity: 0.4 }}>
              🔒 = {tier === 'anon' ? 'Regístrate para desbloquear más' : 'Disponible con Premium ⭐'}
            </p>
          </div>

          {/* === TIP JAR === */}
          <div className="mb-4">
            <p className="text-xs font-black mb-3" style={{ color: theme.text, opacity: 0.6 }}>
              APOYA EL PROYECTO
            </p>
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: theme.glass }}
            >
              <div className="text-center mb-4">
                <span className="text-4xl">☕</span>
                <p className="text-base font-black mt-2" style={{ color: theme.text }}>
                  ¿Te gusta Cacalendario?
                </p>
                <p className="text-xs mt-1" style={{ color: theme.text, opacity: 0.6 }}>
                  Invítame un café para seguir desarrollando nuevas funciones y mantener la app gratis.
                </p>
              </div>

              <div className="flex gap-2">
                {[
                  { label: '☕ 1€', amount: '1' },
                  { label: '☕☕ 3€', amount: '3' },
                  { label: '☕☕☕ 5€', amount: '5' },
                ].map((tip) => (
                  <button
                    key={tip.amount}
                    onClick={() => handleTip(tip.amount)}
                    className="flex-1 rounded-full py-2.5 text-center active:scale-95 transition-transform"
                    style={{ backgroundColor: theme.text }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: theme.id === 'night' ? '#1a1a2e' : 'white' }}
                    >
                      {tip.label}
                    </span>
                  </button>
                ))}
              </div>

              {showTipThanks && (
                <p
                  className="text-center text-sm font-bold mt-3 animate-pulse"
                  style={{ color: theme.text }}
                >
                  ¡Gracias por tu apoyo! 💩❤️
                </p>
              )}

              <div className="mt-4 pt-3 border-t" style={{ borderColor: `${theme.text}15` }}>
                <p className="text-[10px] text-center" style={{ color: theme.text, opacity: 0.4 }}>
                  100% de las donaciones van a desarrollo y hosting.
                  <br />
                  Hecho con 💩 y ❤️ en España.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
