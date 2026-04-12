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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function applyDoctorColor(color: string | null): void {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (color) {
    document.documentElement.style.setProperty('--fluxia-primary', color);
    document.documentElement.style.setProperty('--fluxia-primary-text', '#FFFFFF');
    // Derive a light tint for chip backgrounds (15% primary + 85% white)
    const rgb = hexToRgb(color);
    if (rgb) {
      // chip: 15% primary + 85% white
      const cr = Math.round(rgb.r * 0.15 + 255 * 0.85);
      const cg = Math.round(rgb.g * 0.15 + 255 * 0.85);
      const cb = Math.round(rgb.b * 0.15 + 255 * 0.85);
      document.documentElement.style.setProperty('--fluxia-chip', `rgb(${cr},${cg},${cb})`);
      document.documentElement.style.setProperty('--fluxia-chip-text', color);
      // chipDark: 30% primary + 70% white (for nav bar)
      const dr = Math.round(rgb.r * 0.30 + 255 * 0.70);
      const dg = Math.round(rgb.g * 0.30 + 255 * 0.70);
      const db = Math.round(rgb.b * 0.30 + 255 * 0.70);
      document.documentElement.style.setProperty('--fluxia-chip-dark', `rgb(${dr},${dg},${db})`);
      // bg: 6% primary + 94% #F0F2F4 base
      const br = Math.round(rgb.r * 0.06 + 240 * 0.94);
      const bg_ = Math.round(rgb.g * 0.06 + 242 * 0.94);
      const bb = Math.round(rgb.b * 0.06 + 244 * 0.94);
      document.documentElement.style.setProperty('--fluxia-bg', `rgb(${br},${bg_},${bb})`);
    }
    if (meta) meta.setAttribute('content', '#F0F2F4');
  } else {
    document.documentElement.style.setProperty('--fluxia-primary', '#353435');
    document.documentElement.style.setProperty('--fluxia-primary-text', '#E3EBEE');
    document.documentElement.style.removeProperty('--fluxia-chip');
    document.documentElement.style.removeProperty('--fluxia-chip-text');
    document.documentElement.style.removeProperty('--fluxia-chip-dark');
    document.documentElement.style.removeProperty('--fluxia-bg');
    if (meta) meta.setAttribute('content', '#F0F2F4');
  }
}

// ── Doctor center image ──

const DOCTOR_IMAGE_KEY = 'cacalendario_doctor_image';

export function getDoctorImage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DOCTOR_IMAGE_KEY);
}

export function setDoctorImage(url: string): void {
  localStorage.setItem(DOCTOR_IMAGE_KEY, url);
}

export function clearDoctorImage(): void {
  localStorage.removeItem(DOCTOR_IMAGE_KEY);
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

