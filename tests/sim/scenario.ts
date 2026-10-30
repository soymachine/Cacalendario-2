// Generador del mes virtual: puro y determinista (misma semilla ⇒ mismos
// registros). No toca la red; run.ts ejecuta las acciones contra Supabase y
// compara el resultado con `expected`, que es la verdad de referencia.
//
// Los registros tienen la misma forma que PoopEntry (mobile/src/lib/storage.ts)
// y los valores salen de las mismas listas que los formularios de PA
// (mobile/src/lib/formOptions.ts, copiadas aquí porque ese módulo carga imágenes).

import { addDays, entryTimestamp, type MealType } from '../../src/lib/food.ts';
import type { Persona } from './personas.ts';

export const SIM_DAYS = 30;

// ── Valores de los formularios de PA (mobile/src/lib/formOptions.ts) ──
const COLORS = ['#3B1F0E', '#7B4226', '#7B4226', '#C4844A', '#D4B84A'];
const URINE_COLORS = ['#FDFBEA', '#FFF59D', '#FFE033', '#FFC107', '#FF8F00'];
const FLOATS = ['floats', 'sinks', 'both'] as const;
const URINE_CHARS = ['odor', 'pain', 'turbid'];
const TEXTURE_BY_BRISTOL: Record<number, SimEntry['feces_texture']> = {
  1: 'hard', 2: 'hard', 3: 'normal', 4: 'normal', 5: 'soft', 6: 'loose', 7: 'liquid',
};
const MEAL_HOURS: Record<MealType, [number, number]> = {
  breakfast: [7, 9], mid_morning: [10, 11], lunch: [13, 15], afternoon_snack: [17, 18], dinner: [20, 22], other: [12, 19],
};
const DISHES: Record<MealType, string[]> = {
  breakfast: ['Tostada con tomate y café', 'Yogur con avena', 'Café con leche y galletas'],
  mid_morning: ['Fruta', 'Bocadillo de jamón'],
  lunch: ['Lentejas con verduras', 'Arroz con pollo', 'Ensalada y merluza', 'Pasta boloñesa'],
  afternoon_snack: ['Manzana', 'Frutos secos'],
  dinner: ['Tortilla francesa y ensalada', 'Crema de calabacín', 'Pescado al horno con patata'],
  other: ['Picoteo'],
};
const FOOD_TAGS = ['lácteos', 'gluten', 'picante', 'fritos', 'fibra'];

export interface SimEntry {
  id: string;
  date: string;
  time: string;
  notes: string;
  timestamp: number;
  entry_type: 'poop' | 'urine' | 'food';
  bristol: number | null;
  floats: 'floats' | 'sinks' | 'both' | null;
  color: string | null;
  quantity: number | null;
  duration: 'short' | 'medium' | 'long' | null;
  feces_texture: 'hard' | 'normal' | 'soft' | 'loose' | 'liquid' | 'oily' | null;
  symptoms: string[];
  urine_type: 'voluntary' | 'involuntary_escape' | 'involuntary_drip' | null;
  urine_quantity: number | null;
  urine_color: string | null;
  urine_characteristics: string[];
  urine_urgency: number | null;
  during_sleep: boolean | null;
  food_meal_type: MealType | null;
  food_description: string | null;
  food_portion: 'small' | 'normal' | 'large' | null;
  food_tags: string[];
  /** Solo en la simulación: el registro lleva foto (run.ts la sube y rellena food_photo_path). */
  withPhoto?: boolean;
}

export type SimAction =
  | { kind: 'save'; persona: string; day: number; entry: SimEntry }
  | { kind: 'edit'; persona: string; day: number; entry: SimEntry }
  | { kind: 'delete'; persona: string; day: number; entryId: string }
  | { kind: 'resend'; persona: string; day: number; entry: SimEntry };

export interface Scenario {
  seed: number;
  startDate: string;
  /** Acciones de pacientes por día (índice 0..SIM_DAYS-1), en orden. */
  days: SimAction[][];
  /** Registros que deben existir al final, por paciente. */
  expected: Map<string, Map<string, SimEntry>>;
}

/** PRNG pequeño y determinista (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla estable por paciente: añadir un perfil no cambia los demás. */
function personaSeed(seed: number, key: string): number {
  let h = seed ^ 0x9e3779b9;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  return h >>> 0;
}

export function generateScenario(opts: {
  seed: number;
  personas: Persona[];
  /** Último día del mes virtual (YYYY-MM-DD), normalmente hoy. */
  today: string;
  /** Instante actual: no se generan registros en el futuro. */
  now: number;
}): Scenario {
  const startDate = addDays(opts.today, -(SIM_DAYS - 1));
  const days: SimAction[][] = Array.from({ length: SIM_DAYS }, () => []);
  const expected = new Map<string, Map<string, SimEntry>>();

  for (const p of opts.personas) {
    const r = rng(personaSeed(opts.seed, p.key));
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
    const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
    const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const truth = new Map<string, SimEntry>();
    expected.set(p.key, truth);

    const base = (date: string, time: string, type: SimEntry['entry_type']): SimEntry => {
      const timestamp = entryTimestamp(date, time);
      return {
        // Mismo formato que generateEntryId() de PA: `${ms}_${6 caracteres}`
        id: `${timestamp}_${Math.floor(r() * 2 ** 31).toString(36).padStart(6, '0').slice(-6)}`,
        date, time, notes: '', timestamp, entry_type: type,
        bristol: null, floats: null, color: null, quantity: null, duration: null, feces_texture: null, symptoms: [],
        urine_type: null, urine_quantity: null, urine_color: null, urine_characteristics: [], urine_urgency: null, during_sleep: null,
        food_meal_type: null, food_description: null, food_portion: null, food_tags: [],
      };
    };

    for (let day = 0; day < SIM_DAYS; day++) {
      if (p.lastActiveDay !== undefined && day > p.lastActiveDay) break;
      if (r() < p.skipProb) continue;
      const date = addDays(startDate, day);
      const todays: SimEntry[] = [];

      if (p.poop) {
        const bristols = p.poop.bristol.find((b) => day <= b.until)?.values ?? [4];
        for (let i = 0, n = int(...p.poop.perDay); i < n; i++) {
          const e = base(date, hhmm(int(7, 22), int(0, 59)), 'poop');
          e.bristol = pick(bristols);
          e.feces_texture = TEXTURE_BY_BRISTOL[e.bristol];
          e.floats = pick(FLOATS);
          e.color = pick(COLORS);
          e.quantity = int(2, 8) * 10;
          e.duration = pick(p.poop.durations);
          if (r() < p.poop.symptomsProb) e.symptoms = [...new Set([pick(p.poop.symptoms), pick(p.poop.symptoms)])];
          todays.push(e);
        }
      }

      if (p.urine) {
        for (let i = 0, n = int(...p.urine.perDay); i < n; i++) {
          const night = i === 0 && r() < p.urine.nightProb;
          const e = base(date, night ? hhmm(int(2, 5), int(0, 59)) : hhmm(int(7, 23), int(0, 59)), 'urine');
          e.urine_type = r() < p.urine.leakProb ? pick(['involuntary_escape', 'involuntary_drip'] as const) : 'voluntary';
          e.urine_quantity = int(5, 40) * 10;
          e.urine_color = pick(URINE_COLORS);
          e.urine_urgency = int(...p.urine.urgency);
          e.during_sleep = night;
          if (r() < 0.1) e.urine_characteristics = [pick(URINE_CHARS)];
          todays.push(e);
        }
      }

      if (p.meals) {
        for (const meal of ['breakfast', 'lunch', 'dinner'] as const) {
          if (r() >= p.meals.prob) continue;
          const [h0, h1] = MEAL_HOURS[meal];
          const e = base(date, hhmm(int(h0, h1), int(0, 59)), 'food');
          e.food_meal_type = meal;
          e.food_description = pick(DISHES[meal]);
          e.food_portion = pick(['small', 'normal', 'normal', 'large'] as const);
          if (r() < 0.3) e.food_tags = [pick(FOOD_TAGS)];
          e.withPhoto = r() < p.meals.photoProb;
          todays.push(e);
        }
      }

      // El último día solo se registra lo que ya ha pasado.
      for (const e of todays.filter((x) => x.timestamp <= opts.now).sort((a, b) => a.timestamp - b.timestamp)) {
        days[day].push({ kind: 'save', persona: p.key, day, entry: e });
        truth.set(e.id, e);

        if (!p.fixes) continue;
        if (r() < p.fixes.resendProb) {
          days[day].push({ kind: 'resend', persona: p.key, day, entry: e });
        }
        if (r() < p.fixes.deleteProb) {
          days[day].push({ kind: 'delete', persona: p.key, day, entryId: e.id });
          truth.delete(e.id);
        } else if (r() < p.fixes.editProb) {
          const edited: SimEntry = { ...e, notes: 'Corregido', symptoms: [...e.symptoms] };
          if (edited.entry_type === 'poop') {
            edited.bristol = Math.min(7, (edited.bristol ?? 4) + 1);
            edited.feces_texture = TEXTURE_BY_BRISTOL[edited.bristol];
          } else if (edited.entry_type === 'urine') {
            edited.urine_quantity = (edited.urine_quantity ?? 100) + 50;
          }
          days[day].push({ kind: 'edit', persona: p.key, day, entry: edited });
          truth.set(e.id, edited);
        }
      }
    }
  }

  return { seed: opts.seed, startDate, days, expected };
}
