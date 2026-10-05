// Módulo de seguimiento de comidas (entry_type = 'food') — lógica pura.
//
// Fuente canónica: src/lib/food.ts. Copias idénticas (byte a byte) en
// mobile/src/lib/food.ts (PA), mobile-medics/src/lib/food.ts (MA) y
// supabase/functions/_shared/food.ts (recordatorios). tests/food.test.ts
// comprueba que no divergen: edita aquí y copia el archivo entero.
//
// Sin imports a propósito: tiene que funcionar igual en Astro, Expo, Deno y
// en `node --experimental-strip-types` (tests). Nada de enums ni namespaces.
//
// Principio de producto: seguimiento clínico, no un contador de calorías. Aquí
// no hay gramos, calorías ni puntuaciones nutricionales, y nada infiere
// causalidad entre comidas y síntomas: solo orden cronológico y recuentos.

// ── Tipos de comida, cantidades y campos ──

export const MEAL_TYPES = ['breakfast', 'mid_morning', 'lunch', 'afternoon_snack', 'dinner', 'other'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Desayuno',
  mid_morning: 'Media mañana',
  lunch: 'Comida',
  afternoon_snack: 'Merienda',
  dinner: 'Cena',
  other: 'Otro',
};

/** Con artículo, para frases ("Todavía no has registrado la comida"). */
export const MEAL_TYPE_WITH_ARTICLE: Record<MealType, string> = {
  breakfast: 'el desayuno',
  mid_morning: 'la media mañana',
  lunch: 'la comida',
  afternoon_snack: 'la merienda',
  dinner: 'la cena',
  other: 'otra comida',
};

/** Comidas principales: lo que se espera cuando la pauta es "todas las comidas". */
export const MAIN_MEALS: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const PORTION_SIZES = ['small', 'normal', 'large'] as const;
export type PortionSize = (typeof PORTION_SIZES)[number];

export const PORTION_LABEL: Record<PortionSize, string> = {
  small: 'Pequeña',
  normal: 'Normal',
  large: 'Grande',
};

export const FOOD_FIELDS = ['photo', 'meal_type', 'description', 'portion', 'tags', 'notes'] as const;
export type FoodField = (typeof FOOD_FIELDS)[number];
export type FieldMode = 'required' | 'optional' | 'hidden';

export const FOOD_FIELD_LABEL: Record<FoodField, string> = {
  photo: 'Foto',
  meal_type: 'Tipo de comida',
  description: '¿Qué has comido?',
  portion: 'Cantidad',
  tags: 'Etiquetas',
  notes: 'Observaciones',
};

export const FIELD_MODE_LABEL: Record<FieldMode, string> = {
  required: 'Obligatorio',
  optional: 'Opcional',
  hidden: 'Oculto',
};

/** Textos de la interfaz del módulo (sin sistema i18n en Fluxia: todo en un sitio). */
export const FOOD_TEXT = {
  module: 'Comida',
  modulePlural: 'Comidas',
  takePhoto: 'Hacer foto',
  pickFromGallery: 'Elegir de la galería',
  descriptionPlaceholder: 'Pollo a la plancha, arroz y ensalada de tomate',
  notesPlaceholder: 'Escribe aquí cualquier observación...',
  repeatMeal: 'Repetir comida',
  save: 'Guardar registro',
  saved: 'Comida registrada',
  required: 'obligatorio',
  missingFields: 'Falta por completar',
  emptyRecord: 'Añade al menos una foto o algún dato de la comida.',
} as const;

export const FREQUENCY_TYPES = ['all_meals', 'daily_target', 'specific_meals', 'none'] as const;
export type FrequencyType = (typeof FREQUENCY_TYPES)[number];

export const FREQUENCY_LABEL: Record<FrequencyType, string> = {
  all_meals: 'Registrar todas las comidas',
  daily_target: 'Número de registros al día',
  specific_meals: 'Comidas concretas',
  none: 'Sin objetivo',
};

// ── Pauta (patient_links.food_config) ──

export interface FoodReminderSettings {
  enabled: boolean;
  /** Hora local (HH:MM) a la que se espera cada comida. */
  meal_times: Record<MealType, string>;
  /** Minutos de margen tras la hora esperada antes de recordar. */
  grace_minutes: number;
  /** Hora local (HH:MM) del aviso de "objetivo diario" (frecuencia daily_target). */
  daily_target_time: string;
  /** Tope de recordatorios de comida al día. */
  max_per_day: number;
}

export interface FoodTrackingConfig {
  version: 1;
  enabled: boolean;
  /** Día (YYYY-MM-DD) en que se activó; referencia de adherencia sin registros. */
  enabled_at: string | null;
  fields: Record<FoodField, FieldMode>;
  frequency: {
    type: FrequencyType;
    daily_target: number;
    meals: MealType[];
  };
  period: {
    start_date: string | null;
    end_date: string | null;
  };
  reminders: FoodReminderSettings;
  /** Etiquetas del catálogo del profesional activadas para este paciente. */
  tags: string[];
}

export const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  breakfast: '09:00',
  mid_morning: '11:30',
  lunch: '14:30',
  afternoon_snack: '17:30',
  dinner: '21:00',
  other: '12:00',
};

export const DEFAULT_FOOD_CONFIG: FoodTrackingConfig = {
  version: 1,
  enabled: false,
  enabled_at: null,
  fields: {
    photo: 'optional',
    meal_type: 'optional',
    description: 'optional',
    portion: 'optional',
    tags: 'optional',
    notes: 'optional',
  },
  frequency: { type: 'none', daily_target: 3, meals: [...MAIN_MEALS] },
  period: { start_date: null, end_date: null },
  reminders: {
    enabled: false,
    meal_times: { ...DEFAULT_MEAL_TIMES },
    grace_minutes: 60,
    daily_target_time: '20:00',
    max_per_day: 3,
  },
  tags: [],
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isHHMM = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const isMealType = (v: unknown): v is MealType => typeof v === 'string' && (MEAL_TYPES as readonly string[]).includes(v);
const isPortion = (v: unknown): v is PortionSize => typeof v === 'string' && (PORTION_SIZES as readonly string[]).includes(v);

/**
 * Convierte lo que haya en la base de datos (NULL, versiones parciales, datos
 * manipulados) en una pauta completa y válida. Todo el código lee la pauta a
 * través de aquí: NULL ⇒ módulo desactivado.
 */
export function normalizeFoodConfig(raw: unknown): FoodTrackingConfig {
  const d = DEFAULT_FOOD_CONFIG;
  if (!isObj(raw)) return cloneConfig(d);

  const fieldsRaw = isObj(raw.fields) ? raw.fields : {};
  const fields = { ...d.fields };
  for (const f of FOOD_FIELDS) {
    const m = fieldsRaw[f];
    if (m === 'required' || m === 'optional' || m === 'hidden') fields[f] = m;
  }

  const freqRaw = isObj(raw.frequency) ? raw.frequency : {};
  const freqType = (FREQUENCY_TYPES as readonly string[]).includes(freqRaw.type as string)
    ? (freqRaw.type as FrequencyType) : d.frequency.type;
  const meals = Array.isArray(freqRaw.meals)
    ? MEAL_TYPES.filter((m) => (freqRaw.meals as unknown[]).includes(m))
    : [...d.frequency.meals];

  const periodRaw = isObj(raw.period) ? raw.period : {};
  let start = isDateKey(periodRaw.start_date) ? periodRaw.start_date : null;
  let end = isDateKey(periodRaw.end_date) ? periodRaw.end_date : null;
  if (start && end && end < start) [start, end] = [end, start];

  const remRaw = isObj(raw.reminders) ? raw.reminders : {};
  const timesRaw = isObj(remRaw.meal_times) ? remRaw.meal_times : {};
  const meal_times = { ...d.reminders.meal_times };
  for (const m of MEAL_TYPES) if (isHHMM(timesRaw[m])) meal_times[m] = timesRaw[m] as string;

  return {
    version: 1,
    enabled: raw.enabled === true,
    enabled_at: isDateKey(raw.enabled_at) ? raw.enabled_at : null,
    fields,
    frequency: {
      type: freqType,
      daily_target: clampInt(freqRaw.daily_target, 1, 12, d.frequency.daily_target),
      meals,
    },
    period: { start_date: start, end_date: end },
    reminders: {
      enabled: remRaw.enabled === true,
      meal_times,
      grace_minutes: clampInt(remRaw.grace_minutes, 0, 240, d.reminders.grace_minutes),
      daily_target_time: isHHMM(remRaw.daily_target_time) ? remRaw.daily_target_time : d.reminders.daily_target_time,
      max_per_day: clampInt(remRaw.max_per_day, 1, 5, d.reminders.max_per_day),
    },
    tags: Array.isArray(raw.tags) ? normalizeTagList(raw.tags.filter((t): t is string => typeof t === 'string')) : [],
  };
}

function cloneConfig(c: FoodTrackingConfig): FoodTrackingConfig {
  return {
    ...c,
    fields: { ...c.fields },
    frequency: { ...c.frequency, meals: [...c.frequency.meals] },
    period: { ...c.period },
    reminders: { ...c.reminders, meal_times: { ...c.reminders.meal_times } },
    tags: [...c.tags],
  };
}

/** Pauta lista para guardar al activar el módulo (fija enabled_at si faltaba). */
export function enableFoodConfig(cfg: FoodTrackingConfig, today: string): FoodTrackingConfig {
  return { ...cloneConfig(cfg), enabled: true, enabled_at: cfg.enabled_at ?? today };
}

/** El módulo está activo ese día: activado y dentro del periodo de seguimiento. */
export function isFoodActiveOn(cfg: FoodTrackingConfig, dateKey: string): boolean {
  if (!cfg.enabled) return false;
  if (cfg.period.start_date && dateKey < cfg.period.start_date) return false;
  if (cfg.period.end_date && dateKey > cfg.period.end_date) return false;
  return true;
}

/** El profesional espera registros de comida ese día (cuenta para el semáforo). */
export function isFoodExpectedOn(cfg: FoodTrackingConfig, dateKey: string): boolean {
  return isFoodActiveOn(cfg, dateKey) && cfg.frequency.type !== 'none';
}

/** Comidas concretas que se esperan cada día (vacío si el objetivo no es por comida). */
export function expectedMeals(cfg: FoodTrackingConfig): MealType[] {
  if (cfg.frequency.type === 'all_meals') return [...MAIN_MEALS];
  if (cfg.frequency.type === 'specific_meals') return cfg.frequency.meals.filter((m) => m !== 'other');
  return [];
}

export type RegisterType = 'poop' | 'urine' | 'food';

/**
 * Tipos de registro que el paciente puede crear ese día según su pauta
 * (patient_links.entry_type_mode + food_config). Con "Solo comida" ('none')
 * la comida se ofrece siempre, también fuera del periodo de seguimiento
 * (entonces no cuenta para la adherencia ni genera avisos): el profesional
 * ha decidido que este paciente no registra deposiciones ni micciones.
 * Nunca devuelve una lista vacía.
 */
export function availableRegisterTypes(
  entryTypeMode: string | null | undefined,
  foodConfig: unknown,
  today: string,
): RegisterType[] {
  const cfg = normalizeFoodConfig(foodConfig);
  const mode = entryTypeMode || 'both';
  if (mode === 'none') return cfg.enabled ? ['food'] : ['poop', 'urine'];
  const types: RegisterType[] = mode === 'poop_only' ? ['poop'] : mode === 'urine_only' ? ['urine'] : ['poop', 'urine'];
  if (isFoodActiveOn(cfg, today)) types.push('food');
  return types;
}

export function visibleFoodFields(cfg: FoodTrackingConfig): FoodField[] {
  return FOOD_FIELDS.filter((f) => cfg.fields[f] !== 'hidden');
}

export function isFieldVisible(cfg: FoodTrackingConfig, f: FoodField): boolean {
  return cfg.fields[f] !== 'hidden';
}

export function isFieldRequired(cfg: FoodTrackingConfig, f: FoodField): boolean {
  return cfg.fields[f] === 'required';
}

// ── Etiquetas ──

/** Recorta, quita vacías y duplicados (sin distinguir mayúsculas), mantiene el orden. */
export function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
    const k = t.toLocaleLowerCase('es');
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export function addTag(list: string[], tag: string): string[] {
  return normalizeTagList([...list, tag]);
}

export function removeTag(list: string[], tag: string): string[] {
  const k = tag.toLocaleLowerCase('es');
  return list.filter((t) => t.toLocaleLowerCase('es') !== k);
}

// ── Formulario del paciente ──

/**
 * Tipo de comida sugerido por la hora (horarios españoles). El paciente
 * siempre puede cambiarlo.
 */
export function suggestMealType(hours: number, minutes = 0): MealType {
  const t = hours * 60 + minutes;
  if (t >= 5 * 60 && t < 11 * 60) return 'breakfast';
  if (t >= 11 * 60 && t < 13 * 60) return 'mid_morning';
  if (t >= 13 * 60 && t < 16 * 60 + 30) return 'lunch';
  if (t >= 16 * 60 + 30 && t < 20 * 60) return 'afternoon_snack';
  if (t >= 20 * 60) return 'dinner';
  return 'other';
}

export interface FoodDraft {
  meal_type: MealType | null;
  description: string;
  portion: PortionSize | null;
  tags: string[];
  notes: string;
  /** Hay foto (local o ya subida). */
  hasPhoto: boolean;
}

export const EMPTY_FOOD_DRAFT: FoodDraft = {
  meal_type: null, description: '', portion: null, tags: [], notes: '', hasPhoto: false,
};

export interface FoodValidation {
  ok: boolean;
  /** Campos obligatorios sin rellenar, en el orden del formulario. */
  missing: FoodField[];
  /** No hay ningún dato: ni foto ni contenido (solo fecha/hora). */
  empty: boolean;
}

function fieldFilled(d: FoodDraft, f: FoodField): boolean {
  switch (f) {
    case 'photo': return d.hasPhoto;
    case 'meal_type': return d.meal_type != null;
    case 'description': return d.description.trim().length > 0;
    case 'portion': return d.portion != null;
    case 'tags': return d.tags.length > 0;
    case 'notes': return d.notes.trim().length > 0;
  }
}

/**
 * Valida un registro contra la pauta. Los campos ocultos nunca son
 * obligatorios. Un registro sin ningún dato visible se rechaza para evitar
 * entradas vacías por error (la fecha/hora sola no aporta nada clínico).
 */
export function validateFoodDraft(cfg: FoodTrackingConfig, draft: FoodDraft): FoodValidation {
  const visible = visibleFoodFields(cfg);
  const missing = visible.filter((f) => cfg.fields[f] === 'required' && !fieldFilled(draft, f));
  const empty = visible.length > 0 && !visible.some((f) => fieldFilled(draft, f));
  return { ok: missing.length === 0 && !empty, missing, empty };
}

/** Columnas food_* a guardar: limpia valores de campos ocultos y normaliza. */
export function foodDraftToColumns(cfg: FoodTrackingConfig, draft: FoodDraft): {
  food_meal_type: MealType | null;
  food_description: string | null;
  food_portion: PortionSize | null;
  food_tags: string[];
  notes: string;
} {
  const v = (f: FoodField) => isFieldVisible(cfg, f);
  const desc = draft.description.trim();
  return {
    food_meal_type: v('meal_type') ? draft.meal_type : null,
    food_description: v('description') && desc ? desc.slice(0, 500) : null,
    food_portion: v('portion') ? draft.portion : null,
    food_tags: v('tags') ? normalizeTagList(draft.tags) : [],
    notes: v('notes') ? draft.notes.trim() : '',
  };
}

// ── Registros de comida ──

/** Forma mínima de un registro que entiende este módulo (PA, MW y MA la cumplen). */
export interface FoodEntryLike {
  entry_type?: string | null;
  date: string;
  time: string;
  notes?: string | null;
  food_meal_type?: string | null;
  food_description?: string | null;
  food_portion?: string | null;
  food_tags?: string[] | null;
  food_photo_path?: string | null;
}

export const isFoodEntry = (e: { entry_type?: string | null }): boolean => e.entry_type === 'food';
/** Deposición: los registros antiguos sin entry_type son deposiciones. */
export const isBowelEntry = (e: { entry_type?: string | null }): boolean => (e.entry_type ?? 'poop') === 'poop';
export const isUrineEntry = (e: { entry_type?: string | null }): boolean => e.entry_type === 'urine';

export function mealTypeLabel(v: string | null | undefined): string | null {
  return isMealType(v) ? MEAL_TYPE_LABEL[v] : null;
}

export function portionLabel(v: string | null | undefined): string | null {
  return isPortion(v) ? PORTION_LABEL[v] : null;
}

const sortKey = (e: { date: string; time: string }) => `${e.date} ${e.time || '00:00'}`;

/**
 * Comidas recientes para "Repetir comida": las más recientes primero, sin
 * repetir la misma combinación (tipo + descripción + cantidad + etiquetas) y
 * descartando las que no tienen nada que copiar (p. ej. solo foto).
 */
export function recentMeals<T extends FoodEntryLike>(entries: T[], limit = 6): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  const foods = entries.filter(isFoodEntry).sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  for (const e of foods) {
    const tags = [...(e.food_tags ?? [])].map((t) => t.toLocaleLowerCase('es')).sort();
    const desc = (e.food_description ?? '').trim().toLocaleLowerCase('es');
    if (!e.food_meal_type && !desc && !e.food_portion && tags.length === 0) continue;
    const key = [e.food_meal_type ?? '', desc, e.food_portion ?? '', tags.join('|')].join('¦');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Borrador a partir de una comida anterior: copia tipo, descripción, cantidad
 * y etiquetas (solo las que la pauta mantiene activas). Nunca copia la foto ni
 * las observaciones de aquel día.
 */
export function repeatMealDraft(cfg: FoodTrackingConfig, entry: FoodEntryLike): FoodDraft {
  const used = new Set((entry.food_tags ?? []).map((t) => t.toLocaleLowerCase('es')));
  const v = (f: FoodField) => isFieldVisible(cfg, f);
  return {
    meal_type: v('meal_type') && isMealType(entry.food_meal_type) ? entry.food_meal_type : null,
    description: v('description') ? (entry.food_description ?? '') : '',
    portion: v('portion') && isPortion(entry.food_portion) ? entry.food_portion : null,
    tags: v('tags') ? cfg.tags.filter((t) => used.has(t.toLocaleLowerCase('es'))) : [],
    notes: '',
    hasPhoto: false,
  };
}

// ── Fechas (claves YYYY-MM-DD, sin depender de la zona horaria del proceso) ──

export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const p = (k: string) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(toKey) - p(fromKey)) / 86400000);
}

/**
 * Mismo cálculo de "días sin registrar" que usan MW/MA para el semáforo
 * (loadPatients): diferencia con el inicio UTC del día del registro.
 */
export function daysSinceDate(dateKey: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(dateKey).getTime()) / 86400000);
}

/** Fecha (YYYY-MM-DD) y minutos desde medianoche en una zona horaria IANA. */
export function localDateTimeIn(timeZone: string, now: Date = new Date()): { date: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    return localDateTimeIn('Europe/Madrid', now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Marca de tiempo (ms, hora local del dispositivo) de un registro con fecha y hora. */
export function entryTimestamp(dateKey: string, time: string): number {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi).getTime();
}

/** Un registro retrospectivo puede ser de cualquier día pasado, nunca futuro (5 min de margen). */
export function isFutureOccurrence(dateKey: string, time: string, now: number = Date.now()): boolean {
  return entryTimestamp(dateKey, time) > now + 5 * 60 * 1000;
}

/**
 * Ruta de la foto en el bucket privado `food-photos`. La primera carpeta es
 * el id del paciente: es lo que comprueban las políticas RLS de Storage.
 */
export function foodPhotoPath(userId: string, entryId: string): string {
  return `${userId}/${entryId.replace(/[^A-Za-z0-9_-]/g, '_')}.jpg`;
}

const hhmmToMinutes = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

// ── Estadísticas y adherencia ──

export interface FoodStats {
  total: number;
  byMealType: Record<MealType, number>;
  /** Etiquetas más usadas (definidas por el profesional), de más a menos. */
  topTags: { tag: string; count: number }[];
  withPhoto: number;
  /** 0–1, o null si la pauta no fija objetivo o aún no hay días completos. */
  adherence: number | null;
  adherenceDays: number;
}

/**
 * Adherencia en los últimos `windowDays` días COMPLETOS (hoy no cuenta: el día
 * está en curso), recortados al periodo de seguimiento y a la activación.
 *   · daily_target: Σ min(registros del día, objetivo) / (objetivo × días)
 *   · all_meals / specific_meals: comidas esperadas registradas / (comidas × días)
 *   · none: null
 */
export function foodAdherence(
  entries: FoodEntryLike[],
  cfg: FoodTrackingConfig,
  today: string,
  windowDays = 14,
): { value: number | null; days: number } {
  if (!cfg.enabled || cfg.frequency.type === 'none') return { value: null, days: 0 };
  let from = addDays(today, -windowDays);
  const to0 = addDays(today, -1);
  for (const lower of [cfg.period.start_date, cfg.enabled_at]) if (lower && lower > from) from = lower;
  const to = cfg.period.end_date && cfg.period.end_date < to0 ? cfg.period.end_date : to0;
  const days = to < from ? 0 : daysBetween(from, to) + 1;
  if (days <= 0) return { value: null, days: 0 };

  const foods = entries.filter((e) => isFoodEntry(e) && e.date >= from && e.date <= to);

  if (cfg.frequency.type === 'daily_target') {
    const target = cfg.frequency.daily_target;
    const perDay = new Map<string, number>();
    for (const e of foods) perDay.set(e.date, (perDay.get(e.date) ?? 0) + 1);
    let got = 0;
    for (const c of perDay.values()) got += Math.min(c, target);
    return { value: got / (target * days), days };
  }

  const meals = expectedMeals(cfg);
  if (meals.length === 0) return { value: null, days: 0 };
  const slots = new Set<string>();
  for (const e of foods) {
    if (isMealType(e.food_meal_type) && meals.includes(e.food_meal_type)) slots.add(`${e.date}|${e.food_meal_type}`);
  }
  return { value: slots.size / (meals.length * days), days };
}

export function computeFoodStats(
  entries: FoodEntryLike[],
  cfg: FoodTrackingConfig,
  today: string,
  opts: { from?: string; to?: string; adherenceWindow?: number } = {},
): FoodStats {
  const foods = entries.filter((e) => isFoodEntry(e)
    && (!opts.from || e.date >= opts.from) && (!opts.to || e.date <= opts.to));
  const byMealType = Object.fromEntries(MEAL_TYPES.map((m) => [m, 0])) as Record<MealType, number>;
  const tagCount = new Map<string, number>();
  let withPhoto = 0;
  for (const e of foods) {
    if (isMealType(e.food_meal_type)) byMealType[e.food_meal_type]++;
    for (const t of e.food_tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    if (e.food_photo_path) withPhoto++;
  }
  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));
  const adh = foodAdherence(entries, cfg, today, opts.adherenceWindow ?? 14);
  return { total: foods.length, byMealType, topTags, withPhoto, adherence: adh.value, adherenceDays: adh.days };
}

/**
 * Integración con el semáforo existente (mismos umbrales verde/ámbar/rojo).
 * Cada módulo que el profesional espera aporta sus "días sin registrar"; el
 * estado del paciente es el del módulo más retrasado. Si no se espera ningún
 * módulo, se mantiene el comportamiento de siempre (último registro de
 * cualquier tipo).
 *
 *   coreDays: días desde la última deposición/micción (null = nunca)
 *   foodDays: días desde la última comida, o desde que empezó el seguimiento
 *             si aún no hay ninguna (null = no aplica)
 *   anyDays:  días desde el último registro de cualquier tipo
 */
export function effectiveDaysSinceLast(input: {
  coreExpected: boolean;
  coreDays: number | null;
  foodExpected: boolean;
  foodDays: number | null;
  anyDays: number | null;
}): number | null {
  const lags: number[] = [];
  if (input.coreExpected && input.coreDays != null) lags.push(input.coreDays);
  if (input.foodExpected && input.foodDays != null) lags.push(input.foodDays);
  if (lags.length > 0) return Math.max(...lags);
  return input.anyDays;
}

/**
 * Días de retraso de la comida para el semáforo: desde la última comida o,
 * si no hay ninguna, desde el inicio del seguimiento. null si no se espera.
 */
export function foodLagDays(
  cfg: FoodTrackingConfig,
  lastFoodDate: string | null,
  today: string,
  now: number = Date.now(),
): number | null {
  if (!isFoodExpectedOn(cfg, today)) return null;
  const start = [cfg.period.start_date, cfg.enabled_at].filter((d): d is string => !!d).sort().pop() ?? null;
  const ref = lastFoodDate && (!start || lastFoodDate >= start) ? lastFoodDate : start;
  return ref ? Math.max(0, daysSinceDate(ref, now)) : null;
}

/** Fecha local (YYYY-MM-DD) del dispositivo. */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "Días sin registrar" que alimentan el semáforo de un paciente en MW/MA
 * (mismos umbrales verde/ámbar/rojo de siempre). Sin pauta de comidas es
 * exactamente lo de antes: días desde el último registro. Con ella, manda el
 * módulo esperado más retrasado.
 */
export function patientDaysSinceLast(input: {
  entryTypeMode?: string | null;
  foodConfig: unknown;
  /** Último registro de deposición/micción (YYYY-MM-DD) o null. */
  lastCoreDate: string | null;
  /** Último registro de comida (YYYY-MM-DD) o null. */
  lastFoodDate: string | null;
  today?: string;
  now?: number;
}): number | null {
  const cfg = normalizeFoodConfig(input.foodConfig);
  const today = input.today ?? localDateKey();
  const now = input.now ?? Date.now();
  const latest = [input.lastCoreDate, input.lastFoodDate].filter((d): d is string => !!d).sort().pop() ?? null;
  return effectiveDaysSinceLast({
    coreExpected: (input.entryTypeMode || 'both') !== 'none',
    coreDays: input.lastCoreDate ? daysSinceDate(input.lastCoreDate, now) : null,
    foodExpected: isFoodExpectedOn(cfg, today),
    foodDays: cfg.enabled ? foodLagDays(cfg, input.lastFoodDate, today, now) : null,
    anyDays: latest ? daysSinceDate(latest, now) : null,
  });
}

// ── Línea temporal clínica unificada ──

export interface TimelineDay<T> {
  date: string;
  /** Registros del día en orden cronológico (de la mañana a la noche). */
  events: T[];
}

/**
 * Agrupa registros de cualquier tipo por día (más reciente primero) y los
 * ordena por hora dentro del día. Solo orden cronológico: no relaciona
 * eventos entre sí ni sugiere causalidad.
 */
export function buildTimeline<T extends { date: string; time: string; entry_type?: string | null }>(
  entries: T[],
  types?: string[],
): TimelineDay<T>[] {
  const byDay = new Map<string, T[]>();
  for (const e of entries) {
    const type = e.entry_type ?? 'poop';
    if (types && !types.includes(type)) continue;
    const list = byDay.get(e.date);
    if (list) list.push(e); else byDay.set(e.date, [e]);
  }
  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, events]) => ({ date, events: events.sort((a, b) => (a.time || '').localeCompare(b.time || '')) }));
}

// ── Recordatorios ──

export interface FoodReminder {
  /** Clave de deduplicación del día: el tipo de comida o 'daily_target'. */
  slot: string;
  title: string;
  body: string;
}

/**
 * Decide si toca enviar UN recordatorio de comida ahora (como mucho uno por
 * ejecución del cron). Respeta la pauta del profesional, el periodo, las horas
 * de descanso (23:00–08:00), el tope diario y no repite una comida ya avisada.
 * Un aviso de comida solo es válido durante 3 h tras su hora + margen, para no
 * mandar "no has registrado el desayuno" por la noche si el cron se retrasó.
 */
export function planFoodReminder(input: {
  cfg: FoodTrackingConfig;
  localDate: string;
  localMinutes: number;
  /** Registros de comida del paciente con fecha localDate. */
  foodEntriesToday: { food_meal_type?: string | null }[];
  /** Slots ya avisados hoy (food_reminder_log). */
  alreadySent: string[];
}): FoodReminder | null {
  const { cfg, localDate, localMinutes, foodEntriesToday, alreadySent } = input;
  if (!cfg.reminders.enabled || !isFoodExpectedOn(cfg, localDate)) return null;
  if (localMinutes < 8 * 60 || localMinutes >= 23 * 60) return null;
  if (alreadySent.length >= cfg.reminders.max_per_day) return null;

  const title = 'Fluxia';
  if (cfg.frequency.type === 'daily_target') {
    const target = cfg.frequency.daily_target;
    const count = foodEntriesToday.length;
    const due = hhmmToMinutes(cfg.reminders.daily_target_time);
    if (count >= target || alreadySent.includes('daily_target')) return null;
    if (localMinutes < due || localMinutes >= due + 180) return null;
    return {
      slot: 'daily_target',
      title,
      body: `Hoy llevas ${count} de ${target} registros de comida. Tu profesional necesita esta información 🩺`,
    };
  }

  const recorded = new Set(foodEntriesToday.map((e) => e.food_meal_type).filter(Boolean));
  for (const meal of expectedMeals(cfg)) {
    if (recorded.has(meal) || alreadySent.includes(meal)) continue;
    const due = hhmmToMinutes(cfg.reminders.meal_times[meal]) + cfg.reminders.grace_minutes;
    if (localMinutes >= due && localMinutes < due + 180) {
      return { slot: meal, title, body: `Todavía no has registrado ${MEAL_TYPE_WITH_ARTICLE[meal]}.` };
    }
  }
  return null;
}
