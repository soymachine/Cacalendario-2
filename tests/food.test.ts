// Tests del módulo de comidas (lógica compartida PA/MW/MA/Edge Functions).
//   npm test   (node --test --experimental-strip-types)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_FOOD_CONFIG, EMPTY_FOOD_DRAFT, MAIN_MEALS,
  normalizeFoodConfig, enableFoodConfig, isFoodActiveOn, isFoodExpectedOn, visibleFoodFields,
  validateFoodDraft, foodDraftToColumns, suggestMealType, recentMeals, repeatMealDraft,
  computeFoodStats, foodAdherence, effectiveDaysSinceLast, foodLagDays, buildTimeline,
  planFoodReminder, localDateTimeIn, patientDaysSinceLast, availableRegisterTypes, entryTimestamp, isFutureOccurrence, foodPhotoPath,
  isBowelEntry, isUrineEntry, isFoodEntry, addTag, removeTag, addDays, daysBetween,
  type FoodTrackingConfig, type FoodEntryLike, type FoodDraft,
} from '../src/lib/food.ts';

const cfgWith = (patch: Record<string, unknown>): FoodTrackingConfig =>
  normalizeFoodConfig({ ...JSON.parse(JSON.stringify(DEFAULT_FOOD_CONFIG)), enabled: true, enabled_at: '2026-09-01', ...patch });

const food = (date: string, time: string, extra: Partial<FoodEntryLike> = {}): FoodEntryLike =>
  ({ entry_type: 'food', date, time, food_tags: [], ...extra });

// ── Configuración del profesional ──

test('pacientes existentes (food_config NULL) tienen la comida desactivada', () => {
  const cfg = normalizeFoodConfig(null);
  assert.equal(cfg.enabled, false);
  assert.equal(isFoodActiveOn(cfg, '2026-10-01'), false);
  assert.equal(isFoodExpectedOn(cfg, '2026-10-01'), false);
});

test('el profesional puede activar el seguimiento de comidas', () => {
  const cfg = enableFoodConfig(normalizeFoodConfig(null), '2026-10-01');
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.enabled_at, '2026-10-01');
  // Reactivar no reinicia la fecha de activación
  assert.equal(enableFoodConfig({ ...cfg, enabled: false }, '2026-12-01').enabled_at, '2026-10-01');
  // Ida y vuelta por JSON (como se guarda en patient_links.food_config)
  assert.deepEqual(normalizeFoodConfig(JSON.parse(JSON.stringify(cfg))), cfg);
});

test('el profesional configura cada campo como obligatorio/opcional/oculto', () => {
  const cfg = normalizeFoodConfig({
    enabled: true,
    fields: { photo: 'required', meal_type: 'hidden', description: 'optional', portion: 'bogus', notes: 'hidden' },
  });
  assert.equal(cfg.fields.photo, 'required');
  assert.equal(cfg.fields.meal_type, 'hidden');
  assert.equal(cfg.fields.portion, 'optional', 'valores desconocidos vuelven al valor por defecto');
  assert.equal(cfg.fields.tags, 'optional');
});

test('la pauta normaliza frecuencia, periodo, recordatorios y etiquetas', () => {
  const cfg = normalizeFoodConfig({
    enabled: true,
    frequency: { type: 'specific_meals', meals: ['dinner', 'breakfast', 'brunch'], daily_target: 99 },
    period: { start_date: '2026-10-20', end_date: '2026-10-01' },
    reminders: { enabled: true, meal_times: { lunch: '13:45', dinner: '25:00' }, grace_minutes: -5, max_per_day: 50 },
    tags: [' Lácteos ', 'lácteos', 'Gluten', '', 42],
  });
  assert.deepEqual(cfg.frequency.meals, ['breakfast', 'dinner']);
  assert.equal(cfg.frequency.daily_target, 12);
  assert.deepEqual(cfg.period, { start_date: '2026-10-01', end_date: '2026-10-20' }, 'fechas invertidas se corrigen');
  assert.equal(cfg.reminders.meal_times.lunch, '13:45');
  assert.equal(cfg.reminders.meal_times.dinner, '21:00', 'hora inválida → por defecto');
  assert.equal(cfg.reminders.grace_minutes, 0);
  assert.equal(cfg.reminders.max_per_day, 5);
  assert.deepEqual(cfg.tags, ['Lácteos', 'Gluten']);
});

test('periodo de seguimiento: inicio, fin o sin fecha de fin', () => {
  const cfg = cfgWith({ period: { start_date: '2026-10-05', end_date: '2026-10-10' }, frequency: { type: 'daily_target', daily_target: 3 } });
  assert.equal(isFoodActiveOn(cfg, '2026-10-04'), false);
  assert.equal(isFoodActiveOn(cfg, '2026-10-05'), true);
  assert.equal(isFoodActiveOn(cfg, '2026-10-11'), false);
  const open = cfgWith({ period: { start_date: '2026-10-05', end_date: null } });
  assert.equal(isFoodActiveOn(open, '2030-01-01'), true);
  assert.equal(isFoodExpectedOn(cfgWith({ frequency: { type: 'none' } }), '2026-10-06'), false, 'sin objetivo no se exige');
});

test('catálogo de etiquetas: crear y quitar sin duplicados', () => {
  let tags = addTag([], 'Café');
  tags = addTag(tags, ' café ');
  tags = addTag(tags, 'Alcohol');
  assert.deepEqual(tags, ['Café', 'Alcohol']);
  assert.deepEqual(removeTag(tags, 'CAFÉ'), ['Alcohol']);
});

test('tipos de registro que ve el paciente según su pauta', () => {
  const food = { enabled: true, enabled_at: '2026-10-01', period: { start_date: '2026-10-05', end_date: '2026-10-20' } };
  // Pacientes existentes: lo de siempre
  assert.deepEqual(availableRegisterTypes('both', null, '2026-10-10'), ['poop', 'urine']);
  assert.deepEqual(availableRegisterTypes(undefined, null, '2026-10-10'), ['poop', 'urine']);
  assert.deepEqual(availableRegisterTypes('poop_only', null, '2026-10-10'), ['poop']);
  assert.deepEqual(availableRegisterTypes('urine_only', null, '2026-10-10'), ['urine']);
  // Comida activada: se añade dentro del periodo, no fuera
  assert.deepEqual(availableRegisterTypes('both', food, '2026-10-10'), ['poop', 'urine', 'food']);
  assert.deepEqual(availableRegisterTypes('both', food, '2026-10-25'), ['poop', 'urine']);
  // "Solo comida": siempre la comida, también fuera del periodo
  assert.deepEqual(availableRegisterTypes('none', food, '2026-10-10'), ['food']);
  assert.deepEqual(availableRegisterTypes('none', food, '2026-10-01'), ['food'], 'antes del inicio');
  assert.deepEqual(availableRegisterTypes('none', food, '2026-10-25'), ['food'], 'después del fin');
  // "Solo comida" sin comida activada (no debería guardarse así): nunca vacío
  assert.deepEqual(availableRegisterTypes('none', { enabled: false }, '2026-10-10'), ['poop', 'urine']);
});

// ── Formulario del paciente ──

test('el paciente solo ve los campos habilitados', () => {
  const cfg = cfgWith({ fields: { photo: 'required', meal_type: 'optional', description: 'hidden', portion: 'hidden', tags: 'optional', notes: 'hidden' } });
  assert.deepEqual(visibleFoodFields(cfg), ['photo', 'meal_type', 'tags']);
});

test('validación de campos obligatorios', () => {
  const cfg = cfgWith({ fields: { photo: 'required', meal_type: 'required', description: 'optional', portion: 'hidden', tags: 'optional', notes: 'optional' } });
  const r1 = validateFoodDraft(cfg, { ...EMPTY_FOOD_DRAFT, description: 'Tostada' });
  assert.equal(r1.ok, false);
  assert.deepEqual(r1.missing, ['photo', 'meal_type']);
  const r2 = validateFoodDraft(cfg, { ...EMPTY_FOOD_DRAFT, hasPhoto: true, meal_type: 'breakfast' });
  assert.equal(r2.ok, true);
  // Un campo oculto nunca es obligatorio aunque el JSON diga otra cosa
  const hidden = cfgWith({ fields: { ...DEFAULT_FOOD_CONFIG.fields, portion: 'hidden', description: 'required' } });
  assert.equal(validateFoodDraft(hidden, { ...EMPTY_FOOD_DRAFT, description: 'x' }).ok, true);
});

test('registro rápido: foto + fecha/hora basta si la pauta lo permite', () => {
  const cfg = cfgWith({ fields: { photo: 'required', meal_type: 'optional', description: 'optional', portion: 'optional', tags: 'optional', notes: 'optional' } });
  assert.equal(validateFoodDraft(cfg, { ...EMPTY_FOOD_DRAFT, hasPhoto: true }).ok, true);
});

test('un registro completamente vacío se rechaza', () => {
  const v = validateFoodDraft(cfgWith({}), EMPTY_FOOD_DRAFT);
  assert.equal(v.ok, false);
  assert.equal(v.empty, true);
});

test('el paciente crea un registro: columnas food_* limpias según la pauta', () => {
  const cfg = cfgWith({ fields: { ...DEFAULT_FOOD_CONFIG.fields, portion: 'hidden' } });
  const draft: FoodDraft = {
    meal_type: 'lunch', description: '  Pasta con tomate  ', portion: 'large',
    tags: ['Gluten', 'gluten'], notes: ' con prisa ', hasPhoto: false,
  };
  assert.deepEqual(foodDraftToColumns(cfg, draft), {
    food_meal_type: 'lunch', food_description: 'Pasta con tomate', food_portion: null,
    food_tags: ['Gluten'], notes: 'con prisa',
  });
});

test('tipo de comida sugerido según la hora', () => {
  assert.equal(suggestMealType(8, 20), 'breakfast');
  assert.equal(suggestMealType(11, 30), 'mid_morning');
  assert.equal(suggestMealType(14, 10), 'lunch');
  assert.equal(suggestMealType(17, 45), 'afternoon_snack');
  assert.equal(suggestMealType(21, 15), 'dinner');
  assert.equal(suggestMealType(3, 0), 'other');
});

test('el paciente puede registrar con fecha/hora retrospectiva, nunca futura', () => {
  const now = new Date(2026, 9, 1, 15, 0).getTime();
  const ts = entryTimestamp('2026-09-29', '21:05');
  assert.equal(new Date(ts).getDate(), 29);
  assert.equal(new Date(ts).getHours(), 21);
  assert.equal(isFutureOccurrence('2026-09-29', '21:05', now), false);
  assert.equal(isFutureOccurrence('2026-10-01', '15:03', now), false, 'margen de 5 min');
  assert.equal(isFutureOccurrence('2026-10-02', '08:00', now), true);
});

test('la foto se guarda en la carpeta privada del propio paciente', () => {
  const p = foodPhotoPath('user-uuid', '1727780000_ab12cd');
  assert.equal(p, 'user-uuid/1727780000_ab12cd.jpg');
  assert.equal(p.split('/')[0], 'user-uuid', 'primera carpeta = id del paciente (lo exige la RLS de Storage)');
  assert.ok(!foodPhotoPath('u', '../x').includes('..'), 'sin rutas relativas');
});

// ── Repetir comida ──

test('repetir comida: recientes sin duplicados y sin copiar foto', () => {
  const entries = [
    food('2026-09-28', '14:00', { food_meal_type: 'lunch', food_description: 'Lentejas', food_portion: 'normal', food_tags: ['Legumbres'], food_photo_path: 'u/1.jpg', notes: 'nota vieja' }),
    food('2026-09-30', '14:05', { food_meal_type: 'lunch', food_description: 'lentejas ', food_portion: 'normal', food_tags: ['legumbres'] }),
    food('2026-09-30', '08:00', { food_meal_type: 'breakfast', food_description: 'Café con tostada', food_tags: ['Café', 'Gluten'] }),
    food('2026-09-29', '21:00', { food_photo_path: 'u/2.jpg' }), // solo foto: nada que copiar
    { entry_type: 'poop', date: '2026-09-30', time: '10:00' },
  ];
  const recent = recentMeals(entries);
  assert.deepEqual(recent.map((e) => e.time), ['14:05', '08:00']);

  const cfg = cfgWith({ tags: ['Café', 'Legumbres'] }); // Gluten desactivada desde entonces
  const draft = repeatMealDraft(cfg, recent[1]);
  assert.deepEqual(draft, {
    meal_type: 'breakfast', description: 'Café con tostada', portion: null,
    tags: ['Café'], notes: '', hasPhoto: false,
  });
  assert.equal(repeatMealDraft(cfg, entries[0]).hasPhoto, false, 'la foto anterior nunca se copia');
  assert.equal(repeatMealDraft(cfg, entries[0]).notes, '');
});

// ── Panel del profesional ──

test('estadísticas: total, por tipo de comida y etiquetas más usadas', () => {
  const cfg = cfgWith({ frequency: { type: 'none' } });
  const entries = [
    food('2026-09-29', '08:00', { food_meal_type: 'breakfast', food_tags: ['Café'] }),
    food('2026-09-29', '14:00', { food_meal_type: 'lunch', food_tags: ['Café', 'Gluten'], food_photo_path: 'u/a.jpg' }),
    food('2026-09-30', '21:00', { food_meal_type: 'dinner', food_tags: ['Gluten', 'Café'] }),
    { entry_type: 'urine', date: '2026-09-30', time: '09:00' },
  ];
  const s = computeFoodStats(entries, cfg, '2026-10-01');
  assert.equal(s.total, 3);
  assert.equal(s.byMealType.breakfast, 1);
  assert.equal(s.byMealType.lunch, 1);
  assert.equal(s.byMealType.dinner, 1);
  assert.deepEqual(s.topTags, [{ tag: 'Café', count: 3 }, { tag: 'Gluten', count: 2 }]);
  assert.equal(s.withPhoto, 1);
  assert.equal(s.adherence, null, 'sin objetivo no hay adherencia');
});

test('adherencia con objetivo diario (hoy no cuenta)', () => {
  const cfg = cfgWith({ enabled_at: '2026-09-28', frequency: { type: 'daily_target', daily_target: 3 } });
  const entries = [
    ...['08:00', '14:00', '21:00', '22:00'].map((t) => food('2026-09-28', t)), // 4 → cuenta 3
    food('2026-09-29', '14:00'),                                              // 1
    food('2026-09-30', '08:00'), food('2026-09-30', '14:00'),                 // 2
    food('2026-10-01', '08:00'),                                              // hoy: no cuenta
  ];
  const a = foodAdherence(entries, cfg, '2026-10-01', 14);
  assert.equal(a.days, 3);
  assert.equal(a.value, 6 / 9);
});

test('adherencia por comidas concretas', () => {
  const cfg = cfgWith({ enabled_at: '2026-09-29', frequency: { type: 'specific_meals', meals: ['breakfast', 'dinner'] } });
  const entries = [
    food('2026-09-29', '08:00', { food_meal_type: 'breakfast' }),
    food('2026-09-29', '08:30', { food_meal_type: 'breakfast' }), // duplicado: no suma
    food('2026-09-29', '14:00', { food_meal_type: 'lunch' }),     // no esperada
    food('2026-09-30', '21:00', { food_meal_type: 'dinner' }),
  ];
  assert.deepEqual(foodAdherence(entries, cfg, '2026-10-01'), { value: 2 / 4, days: 2 });
  const all = cfgWith({ enabled_at: '2026-09-29', frequency: { type: 'all_meals' } });
  assert.deepEqual(MAIN_MEALS, ['breakfast', 'lunch', 'dinner']);
  assert.deepEqual(foodAdherence(entries, all, '2026-10-01'), { value: 3 / 6, days: 2 });
});

test('semáforo: la comida esperada cuenta, sin crear otro sistema de estado', () => {
  // Deposiciones al día pero 5 días sin registrar comida → manda el retraso mayor
  assert.equal(effectiveDaysSinceLast({ coreExpected: true, coreDays: 0, foodExpected: true, foodDays: 5, anyDays: 0 }), 5);
  // Comida sin objetivo: no penaliza
  assert.equal(effectiveDaysSinceLast({ coreExpected: true, coreDays: 1, foodExpected: false, foodDays: 9, anyDays: 1 }), 1);
  // Comportamiento de siempre si no aplica nada nuevo
  assert.equal(effectiveDaysSinceLast({ coreExpected: true, coreDays: null, foodExpected: false, foodDays: null, anyDays: null }), null);
  // Solo comida (entry_type_mode = 'none')
  assert.equal(effectiveDaysSinceLast({ coreExpected: false, coreDays: 2, foodExpected: true, foodDays: 0, anyDays: 0 }), 0);
});

test('retraso de comida: desde el último registro o desde el inicio del seguimiento', () => {
  const now = Date.UTC(2026, 9, 10, 12);
  const cfg = cfgWith({ enabled_at: '2026-10-01', period: { start_date: '2026-10-05', end_date: null }, frequency: { type: 'all_meals' } });
  assert.equal(foodLagDays(cfg, null, '2026-10-10', now), 5);
  assert.equal(foodLagDays(cfg, '2026-10-09', '2026-10-10', now), 1);
  assert.equal(foodLagDays(cfg, '2026-09-20', '2026-10-10', now), 5, 'registros anteriores al periodo no cuentan');
  assert.equal(foodLagDays(cfgWith({ frequency: { type: 'none' } }), null, '2026-10-10', now), null);
});

test('semáforo de un paciente: sin pauta de comidas no cambia nada', () => {
  const now = Date.UTC(2026, 9, 10, 12);
  const base = { today: '2026-10-10', now };
  // Paciente existente (food_config NULL): días desde el último registro, como siempre
  assert.equal(patientDaysSinceLast({ ...base, entryTypeMode: 'both', foodConfig: null, lastCoreDate: '2026-10-08', lastFoodDate: null }), 2);
  assert.equal(patientDaysSinceLast({ ...base, entryTypeMode: 'both', foodConfig: null, lastCoreDate: null, lastFoodDate: null }), null);
  // Comida esperada y retrasada → manda la comida
  const food = { enabled: true, enabled_at: '2026-10-01', frequency: { type: 'all_meals' } };
  assert.equal(patientDaysSinceLast({ ...base, entryTypeMode: 'both', foodConfig: food, lastCoreDate: '2026-10-10', lastFoodDate: '2026-10-06' }), 4);
  // Solo comida: las deposiciones antiguas no penalizan
  assert.equal(patientDaysSinceLast({ ...base, entryTypeMode: 'none', foodConfig: food, lastCoreDate: '2026-09-01', lastFoodDate: '2026-10-10' }), 0);
});

// ── Línea temporal ──

test('línea temporal unificada: días recientes primero, horas en orden', () => {
  const entries = [
    { entry_type: 'poop', date: '2026-09-30', time: '11:30', id: 'b1' },
    { entry_type: 'food', date: '2026-09-30', time: '14:10', id: 'f2' },
    { entry_type: 'food', date: '2026-09-30', time: '08:20', id: 'f1' },
    { entry_type: 'poop', date: '2026-09-30', time: '19:15', id: 'b2' },
    { entry_type: 'urine', date: '2026-09-29', time: '23:00', id: 'u1' },
    { date: '2026-09-29', time: '07:00', id: 'legacy' }, // sin entry_type = deposición
  ];
  const tl = buildTimeline(entries);
  assert.deepEqual(tl.map((d) => d.date), ['2026-09-30', '2026-09-29']);
  assert.deepEqual(tl[0].events.map((e) => e.id), ['f1', 'b1', 'f2', 'b2']);
  assert.deepEqual(buildTimeline(entries, ['food']).flatMap((d) => d.events.map((e) => e.id)), ['f1', 'f2']);
  assert.deepEqual(buildTimeline(entries, ['poop'])[1].events.map((e) => e.id), ['legacy']);
});

// ── Recordatorios ──

const remCfg = (patch: Record<string, unknown> = {}) => cfgWith({
  frequency: { type: 'specific_meals', meals: ['breakfast', 'lunch', 'dinner'] },
  reminders: { enabled: true, meal_times: { breakfast: '09:00', lunch: '14:00', dinner: '21:00' }, grace_minutes: 60, max_per_day: 3 },
  ...patch,
});
const at = (h: number, m = 0) => h * 60 + m;

test('recordatorio: "Todavía no has registrado la comida" tras la hora + margen', () => {
  const r = planFoodReminder({ cfg: remCfg(), localDate: '2026-10-01', localMinutes: at(15, 5), foodEntriesToday: [{ food_meal_type: 'breakfast' }], alreadySent: [] });
  assert.deepEqual(r, { slot: 'lunch', title: 'Fluxia', body: 'Todavía no has registrado la comida.' });
});

test('recordatorios respetan la configuración del profesional', () => {
  const base = { localDate: '2026-10-01', localMinutes: at(15, 5), foodEntriesToday: [], alreadySent: [] as string[] };
  assert.equal(planFoodReminder({ ...base, cfg: remCfg({ reminders: { enabled: false } }) }), null, 'recordatorios desactivados');
  assert.equal(planFoodReminder({ ...base, cfg: remCfg({ enabled: false }) }), null, 'módulo desactivado');
  assert.equal(planFoodReminder({ ...base, cfg: remCfg({ frequency: { type: 'none' } }) }), null, 'sin objetivo');
  assert.equal(planFoodReminder({ ...base, cfg: remCfg({ period: { start_date: '2026-10-02', end_date: null } }) }), null, 'fuera de periodo');
  assert.equal(planFoodReminder({ ...base, cfg: remCfg({ frequency: { type: 'specific_meals', meals: ['dinner'] } }) }), null, 'la comida no es obligatoria');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(14, 30), cfg: remCfg() }), null, 'aún dentro del margen');
  assert.equal(planFoodReminder({ ...base, foodEntriesToday: [{ food_meal_type: 'lunch' }], cfg: remCfg() }), null, 'comida ya registrada');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(11, 0), cfg: remCfg() })?.slot, 'breakfast', 'el desayuno pendiente sí se avisa');
});

test('recordatorios sin exceso: sin repetir, con tope diario y horas de descanso', () => {
  const cfg = remCfg();
  const base = { cfg, localDate: '2026-10-01', foodEntriesToday: [] };
  assert.equal(planFoodReminder({ ...base, localMinutes: at(15), alreadySent: ['lunch', 'breakfast'] }), null, 'cada comida se avisa una vez');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(22, 10), alreadySent: ['breakfast', 'lunch', 'x'] }), null, 'tope diario');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(23, 30), alreadySent: [] }), null, 'no molestar de noche');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(7, 0), alreadySent: [] }), null, 'no molestar de madrugada');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(20, 0), alreadySent: ['lunch'] }), null, 'el desayuno caducado no se avisa por la tarde');
  assert.equal(planFoodReminder({ ...base, localMinutes: at(22, 5), alreadySent: [] })?.slot, 'dinner');
});

test('recordatorio de objetivo diario', () => {
  const cfg = remCfg({ frequency: { type: 'daily_target', daily_target: 3 }, reminders: { enabled: true, daily_target_time: '20:00' } });
  const base = { cfg, localDate: '2026-10-01', alreadySent: [] as string[] };
  assert.equal(planFoodReminder({ ...base, localMinutes: at(19, 0), foodEntriesToday: [] }), null);
  assert.match(planFoodReminder({ ...base, localMinutes: at(20, 10), foodEntriesToday: [{}] })!.body, /1 de 3/);
  assert.equal(planFoodReminder({ ...base, localMinutes: at(20, 10), foodEntriesToday: [{}, {}, {}] }), null);
});

test('hora local por zona horaria del paciente', () => {
  const now = new Date(Date.UTC(2026, 9, 1, 22, 30)); // 00:30 del 2 de octubre en Madrid (CEST)
  assert.deepEqual(localDateTimeIn('Europe/Madrid', now), { date: '2026-10-02', minutes: 30 });
  assert.deepEqual(localDateTimeIn('America/Mexico_City', now), { date: '2026-10-01', minutes: at(16, 30) });
  assert.deepEqual(localDateTimeIn('Not/AZone', now), localDateTimeIn('Europe/Madrid', now), 'zona inválida → Madrid');
});

// ── Deposición y micción no cambian ──

test('registros existentes siguen clasificándose igual', () => {
  assert.equal(isBowelEntry({}), true, 'sin entry_type = deposición (datos antiguos)');
  assert.equal(isBowelEntry({ entry_type: 'poop' }), true);
  assert.equal(isBowelEntry({ entry_type: 'food' }), false, 'una comida nunca cuenta como deposición');
  assert.equal(isUrineEntry({ entry_type: 'urine' }), true);
  assert.equal(isFoodEntry({ entry_type: 'urine' }), false);
});

test('utilidades de fecha', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-09-28', '2026-10-01'), 3);
});

// ── Copias sincronizadas a mano (CLAUDE.md) ──

test('las copias de food.ts en PA, MA y Edge Functions son idénticas a src/lib/food.ts', () => {
  const canonical = readFileSync(new URL('../src/lib/food.ts', import.meta.url), 'utf8');
  for (const copy of ['../mobile/src/lib/food.ts', '../mobile-medics/src/lib/food.ts', '../supabase/functions/_shared/food.ts']) {
    assert.equal(readFileSync(new URL(copy, import.meta.url), 'utf8'), canonical, `${copy} desincronizada: cp src/lib/food.ts ${copy.slice(3)}`);
  }
});
