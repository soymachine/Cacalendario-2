// User preferences: emoji style, theme, stored in localStorage

const PREFS_KEY = 'cacalendario_prefs';
const DOCTOR_COLOR_KEY = 'cacalendario_doctor_color';

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
  window.dispatchEvent(new Event('fluxia-prefs-changed'));
  return updated;
}

export function getSelectedEmoji(): PoopEmoji {
  const prefs = getPreferences();
  return POOP_EMOJIS.find((e) => e.id === prefs.emojiId) || POOP_EMOJIS[0];
}

/** Returns the base theme, overriding main/bg with the doctor's color if set. */
export function getSelectedTheme(): Theme {
  const prefs = getPreferences();
  const base = THEMES.find((t) => t.id === prefs.themeId) || THEMES[0];
  const doctorColor = getDoctorColor();
  if (!doctorColor) return base;
  return { ...base, main: doctorColor, bg: doctorColor };
}

// ── Doctor palette override ──

export function getDoctorColor(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DOCTOR_COLOR_KEY);
}

export function setDoctorColor(primary: string): void {
  localStorage.setItem(DOCTOR_COLOR_KEY, primary);
  applyDoctorColor(primary);
  window.dispatchEvent(new Event('fluxia-prefs-changed'));
}

export function clearDoctorColor(): void {
  localStorage.removeItem(DOCTOR_COLOR_KEY);
  applyDoctorColor(null);
  window.dispatchEvent(new Event('fluxia-prefs-changed'));
}

function applyDoctorColor(color: string | null): void {
  if (typeof document === 'undefined') return;
  if (color) {
    document.documentElement.style.setProperty('--fluxia-primary', color);
    document.documentElement.style.setProperty('--fluxia-primary-text', '#FFFFFF');
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#F0F2F4');
  } else {
    document.documentElement.style.setProperty('--fluxia-primary', '#353435');
    document.documentElement.style.setProperty('--fluxia-primary-text', '#E3EBEE');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#F0F2F4');
  }
}

// ── Doctor hidden fields ──

const DOCTOR_FIELDS_KEY = 'cacalendario_hidden_fields';

export function getDoctorHiddenFields(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DOCTOR_FIELDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setDoctorHiddenFields(fields: string[]): void {
  localStorage.setItem(DOCTOR_FIELDS_KEY, JSON.stringify(fields));
}

export function clearDoctorHiddenFields(): void {
  localStorage.removeItem(DOCTOR_FIELDS_KEY);
}

// Apply theme to DOM — keeps body in Figma gray, only CSS vars for legacy compat
export function applyTheme(_theme?: Theme): void {
  if (typeof document === 'undefined') return;
  // Apply doctor color CSS variable if stored
  const doctorColor = getDoctorColor();
  applyDoctorColor(doctorColor);
  // Body always uses the Figma gray background
  document.body.style.backgroundColor = '#F0F2F4';
}

