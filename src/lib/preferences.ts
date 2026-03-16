// User preferences: emoji style, theme, stored in localStorage

const PREFS_KEY = 'cacalendario_prefs';

export interface PoopEmoji {
  id: string;
  label: string;
  char: string; // emoji character or 'svg' for default
  premium: boolean;
}

export interface Theme {
  id: string;
  label: string;
  emoji: string;
  bg: string;       // body background
  main: string;     // main salmon-like color
  text: string;     // primary text
  glass: string;    // translucent white overlay
  premium: boolean;
}

export const POOP_EMOJIS: PoopEmoji[] = [
  { id: 'default', label: 'Clásico', char: 'svg', premium: false },
  { id: 'poop', label: 'Emoji', char: '💩', premium: false },
  { id: 'chocolate', label: 'Chocolate', char: '🍫', premium: false },
  { id: 'chestnut', label: 'Castaña', char: '🌰', premium: true },
  { id: 'fire', label: 'Fuego', char: '🔥', premium: true },
  { id: 'star', label: 'Estrella', char: '⭐', premium: true },
  { id: 'ghost', label: 'Fantasma', char: '👻', premium: true },
  { id: 'alien', label: 'Alien', char: '👾', premium: true },
  { id: 'mushroom', label: 'Seta', char: '🍄', premium: true },
  { id: 'rainbow', label: 'Arcoíris', char: '🌈', premium: true },
];

export const THEMES: Theme[] = [
  {
    id: 'salmon', label: 'Salmón', emoji: '🍑',
    bg: '#c4705f', main: '#dd8273', text: '#231f20', glass: 'rgba(255,255,255,0.28)',
    premium: false,
  },
  {
    id: 'lavender', label: 'Lavanda', emoji: '💜',
    bg: '#8b6fa5', main: '#a78bbd', text: '#1a1525', glass: 'rgba(255,255,255,0.25)',
    premium: false,
  },
  {
    id: 'mint', label: 'Menta', emoji: '🌿',
    bg: '#5a9e8f', main: '#72bfad', text: '#0f2922', glass: 'rgba(255,255,255,0.25)',
    premium: true,
  },
  {
    id: 'sky', label: 'Cielo', emoji: '🌊',
    bg: '#5a7fa5', main: '#72a0c7', text: '#0f1d2b', glass: 'rgba(255,255,255,0.25)',
    premium: true,
  },
  {
    id: 'gold', label: 'Oro', emoji: '✨',
    bg: '#b8943f', main: '#d4ad55', text: '#2b2210', glass: 'rgba(255,255,255,0.25)',
    premium: true,
  },
  {
    id: 'night', label: 'Noche', emoji: '🌙',
    bg: '#1a1a2e', main: '#2d2d4a', text: '#e0e0e0', glass: 'rgba(255,255,255,0.12)',
    premium: true,
  },
  {
    id: 'rose', label: 'Rosa', emoji: '🌸',
    bg: '#c97b8b', main: '#e8a0b0', text: '#2b1018', glass: 'rgba(255,255,255,0.28)',
    premium: true,
  },
  {
    id: 'earth', label: 'Tierra', emoji: '🪵',
    bg: '#8b6f47', main: '#a6885c', text: '#1f170b', glass: 'rgba(255,255,255,0.22)',
    premium: true,
  },
];

export interface Preferences {
  emojiId: string;
  themeId: string;
  tipDismissed: boolean;
}

const DEFAULT_PREFS: Preferences = {
  emojiId: 'default',
  themeId: 'salmon',
  tipDismissed: false,
};

export function getPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('cacalendario-prefs-changed'));
  return updated;
}

export function getSelectedEmoji(): PoopEmoji {
  const prefs = getPreferences();
  return POOP_EMOJIS.find((e) => e.id === prefs.emojiId) || POOP_EMOJIS[0];
}

export function getSelectedTheme(): Theme {
  const prefs = getPreferences();
  return THEMES.find((t) => t.id === prefs.themeId) || THEMES[0];
}

// Apply theme to DOM
export function applyTheme(theme?: Theme): void {
  const t = theme || getSelectedTheme();
  document.documentElement.style.setProperty('--theme-bg', t.bg);
  document.documentElement.style.setProperty('--theme-main', t.main);
  document.documentElement.style.setProperty('--theme-text', t.text);
  document.documentElement.style.setProperty('--theme-glass', t.glass);
  document.body.style.backgroundColor = t.bg;

  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.main);
}
