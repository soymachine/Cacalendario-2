// User preferences: emoji style, theme, stored in localStorage

const PREFS_KEY = 'cacalendario_prefs';

export interface PoopEmoji {
  id: string;
  label: string;
  char: string; // emoji character or 'svg' for default
}

export interface Theme {
  id: string;
  label: string;
  emoji: string;
  bg: string;       // body background
  main: string;     // main salmon-like color
  text: string;     // primary text
  glass: string;    // translucent white overlay
}

export const POOP_EMOJIS: PoopEmoji[] = [
  { id: 'default', label: 'Clásico', char: 'svg' },
];

export const THEMES: Theme[] = [
  {
    id: 'salmon', label: 'Salmón', emoji: '🍑',
    bg: '#c4705f', main: '#dd8273', text: '#231f20', glass: 'rgba(255,255,255,0.28)',
  },
];

export interface Preferences {
  emojiId: string;
  themeId: string;
}

const DEFAULT_PREFS: Preferences = {
  emojiId: 'default',
  themeId: 'salmon',
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
  document.body.style.backgroundColor = t.main;
  document.documentElement.style.setProperty('--cacalendario-bg', t.main);

  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.main);
}
