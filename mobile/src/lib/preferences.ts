// User preferences: emoji style, theme, stored locally

import { localStore } from './localStore';
import { emitEvent, FLUXIA_PREFS_CHANGED } from './events';

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
  try {
    const raw = localStore.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: Partial<Preferences>): Preferences {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStore.setItem(PREFS_KEY, JSON.stringify(updated));
  emitEvent(FLUXIA_PREFS_CHANGED);
  return updated;
}

export function clearPreferences(): void {
  localStore.removeItem(PREFS_KEY);
}

export function getSelectedEmoji(): PoopEmoji {
  const prefs = getPreferences();
  return POOP_EMOJIS.find((e) => e.id === prefs.emojiId) || POOP_EMOJIS[0];
}

export function getSelectedTheme(): Theme {
  const prefs = getPreferences();
  return THEMES.find((t) => t.id === prefs.themeId) || THEMES[0];
}

// ── Doctor center image ──

const DOCTOR_IMAGE_KEY = 'cacalendario_doctor_image';

export function getDoctorImage(): string | null {
  return localStore.getItem(DOCTOR_IMAGE_KEY);
}

export function setDoctorImage(url: string): void {
  localStore.setItem(DOCTOR_IMAGE_KEY, url);
}

export function clearDoctorImage(): void {
  localStore.removeItem(DOCTOR_IMAGE_KEY);
}

// ── Doctor hidden fields ──

const DOCTOR_FIELDS_KEY = 'cacalendario_hidden_fields';

export function getDoctorHiddenFields(): string[] {
  try {
    const raw = localStore.getItem(DOCTOR_FIELDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setDoctorHiddenFields(fields: string[]): void {
  localStore.setItem(DOCTOR_FIELDS_KEY, JSON.stringify(fields));
}

export function clearDoctorHiddenFields(): void {
  localStore.removeItem(DOCTOR_FIELDS_KEY);
}

// ── Doctor entry type mode ──

const DOCTOR_ENTRY_TYPE_MODE_KEY = 'cacalendario_entry_type_mode';
export type EntryTypeMode = 'both' | 'poop_only' | 'urine_only';

export function getDoctorEntryTypeMode(): EntryTypeMode {
  return (localStore.getItem(DOCTOR_ENTRY_TYPE_MODE_KEY) as EntryTypeMode) || 'both';
}

export function setDoctorEntryTypeMode(mode: EntryTypeMode): void {
  localStore.setItem(DOCTOR_ENTRY_TYPE_MODE_KEY, mode);
}

export function clearDoctorEntryTypeMode(): void {
  localStore.removeItem(DOCTOR_ENTRY_TYPE_MODE_KEY);
}
