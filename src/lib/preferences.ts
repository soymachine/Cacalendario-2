// User preferences: emoji style, theme, stored in localStorage

const PREFS_KEY = 'cacalendario_prefs';
const DOCTOR_COLOR_KEY = 'cacalendario_doctor_color';
const DOCTOR_SECONDARY_KEY = 'cacalendario_doctor_secondary';

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

export function setDoctorColor(primary: string, secondary?: string): void {
  localStorage.setItem(DOCTOR_COLOR_KEY, primary);
  if (secondary) localStorage.setItem(DOCTOR_SECONDARY_KEY, secondary);
  else localStorage.removeItem(DOCTOR_SECONDARY_KEY);
  applyDoctorColor(primary, secondary);
  window.dispatchEvent(new Event('fluxia-prefs-changed'));
}

export function clearDoctorColor(): void {
  localStorage.removeItem(DOCTOR_COLOR_KEY);
  localStorage.removeItem(DOCTOR_SECONDARY_KEY);
  applyDoctorColor(null);
  window.dispatchEvent(new Event('fluxia-prefs-changed'));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function applyDoctorColor(color: string | null, secondary?: string | null): void {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (color) {
    document.documentElement.style.setProperty('--fluxia-primary', color);
    document.documentElement.style.setProperty('--fluxia-primary-text', '#FFFFFF');
    const sec = secondary || color;
    document.documentElement.style.setProperty('--fluxia-secondary', sec);
    // Derive tints from primary (for chips/selections)
    const rgb = hexToRgb(color);
    if (rgb) {
      // chip: 15% primary + 85% white
      const cr = Math.round(rgb.r * 0.15 + 255 * 0.85);
      const cg = Math.round(rgb.g * 0.15 + 255 * 0.85);
      const cb = Math.round(rgb.b * 0.15 + 255 * 0.85);
      document.documentElement.style.setProperty('--fluxia-chip', `rgb(${cr},${cg},${cb})`);
      document.documentElement.style.setProperty('--fluxia-chip-text', color);
    }
    // Derive tints from secondary (for nav bar and bg)
    const sRgb = hexToRgb(sec);
    if (sRgb) {
      // secondary-chip-dark: 30% secondary + 70% white (nav bar background)
      const dr = Math.round(sRgb.r * 0.30 + 255 * 0.70);
      const dg = Math.round(sRgb.g * 0.30 + 255 * 0.70);
      const db = Math.round(sRgb.b * 0.30 + 255 * 0.70);
      document.documentElement.style.setProperty('--fluxia-chip-dark', `rgb(${dr},${dg},${db})`);
      // bg: 10% secondary + 90% white
      const br = Math.round(sRgb.r * 0.10 + 255 * 0.90);
      const bg_ = Math.round(sRgb.g * 0.10 + 255 * 0.90);
      const bb = Math.round(sRgb.b * 0.10 + 255 * 0.90);
      document.documentElement.style.setProperty('--fluxia-bg', `rgb(${br},${bg_},${bb})`);
      // nav-bg: 20% secondary + 80% white (more visible than bg, less heavy than chip-dark)
      const nr = Math.round(sRgb.r * 0.20 + 255 * 0.80);
      const ng = Math.round(sRgb.g * 0.20 + 255 * 0.80);
      const nb = Math.round(sRgb.b * 0.20 + 255 * 0.80);
      document.documentElement.style.setProperty('--fluxia-nav-bg', `rgb(${nr},${ng},${nb})`);
    }
    if (meta) meta.setAttribute('content', '#F0F2F4');
  } else {
    document.documentElement.style.setProperty('--fluxia-primary', '#353435');
    document.documentElement.style.setProperty('--fluxia-primary-text', '#E3EBEE');
    document.documentElement.style.removeProperty('--fluxia-secondary');
    document.documentElement.style.removeProperty('--fluxia-chip');
    document.documentElement.style.removeProperty('--fluxia-chip-text');
    document.documentElement.style.removeProperty('--fluxia-chip-dark');
    document.documentElement.style.removeProperty('--fluxia-bg');
    document.documentElement.style.removeProperty('--fluxia-nav-bg');
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

// ── Doctor entry type mode ──

const DOCTOR_ENTRY_TYPE_MODE_KEY = 'cacalendario_entry_type_mode';
export type EntryTypeMode = 'both' | 'poop_only' | 'urine_only';

export function getDoctorEntryTypeMode(): EntryTypeMode {
  if (typeof window === 'undefined') return 'both';
  return (localStorage.getItem(DOCTOR_ENTRY_TYPE_MODE_KEY) as EntryTypeMode) || 'both';
}

export function setDoctorEntryTypeMode(mode: EntryTypeMode): void {
  localStorage.setItem(DOCTOR_ENTRY_TYPE_MODE_KEY, mode);
}

export function clearDoctorEntryTypeMode(): void {
  localStorage.removeItem(DOCTOR_ENTRY_TYPE_MODE_KEY);
}

export function applyTheme(_theme?: Theme): void {
  if (typeof document === 'undefined') return;
  const doctorColor = getDoctorColor();
  const doctorSecondary = typeof window !== 'undefined' ? localStorage.getItem(DOCTOR_SECONDARY_KEY) : null;
  applyDoctorColor(doctorColor, doctorSecondary);
  document.body.style.backgroundColor = '#F0F2F4';
}

