// Tests de la selección de recordatorios de comida del cron check-inactive-patients.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectFoodReminders, subscriptionTimezone, type FoodLinkRow } from '../supabase/functions/_shared/foodReminderJob.ts';

const cfg = (reminders = true) => ({
  enabled: true,
  enabled_at: '2026-09-01',
  frequency: { type: 'specific_meals', meals: ['breakfast', 'lunch', 'dinner'] },
  reminders: { enabled: reminders, meal_times: { breakfast: '09:00', lunch: '14:00', dinner: '21:00' }, grace_minutes: 60 },
});
const link = (patient_id: string, patch: Partial<FoodLinkRow> = {}): FoodLinkRow =>
  ({ patient_id, food_config: cfg(), push_disabled: false, doctor_unlinked: false, ...patch });
const expo = { type: 'expo', token: 'ExponentPushToken[x]', timezone: 'Europe/Madrid' };
// 15:30 en Madrid (CEST, UTC+2)
const now = new Date(Date.UTC(2026, 9, 1, 13, 30));

const run = (over: Partial<Parameters<typeof selectFoodReminders>[0]> = {}) => selectFoodReminders({
  links: [link('p1')],
  subscriptions: new Map([['p1', expo]]),
  foodEntries: [],
  sentLog: [],
  skipPatients: new Set(),
  now,
  ...over,
});

test('envía el recordatorio de la comida pendiente en la hora local del paciente', () => {
  const out = run();
  assert.equal(out.length, 1);
  assert.equal(out[0].local_date, '2026-10-01');
  assert.equal(out[0].reminder.slot, 'lunch');
  assert.equal(out[0].reminder.body, 'Todavía no has registrado la comida.');
});

test('respeta la configuración del profesional y del vínculo', () => {
  assert.equal(run({ links: [link('p1', { food_config: cfg(false) })] }).length, 0, 'recordatorios desactivados');
  assert.equal(run({ links: [link('p1', { food_config: null })] }).length, 0, 'módulo sin configurar');
  assert.equal(run({ links: [link('p1', { push_disabled: true })] }).length, 0, 'notificaciones desactivadas por el profesional');
  assert.equal(run({ links: [link('p1', { doctor_unlinked: true })] }).length, 0, 'paciente desvinculado');
  assert.equal(run({ subscriptions: new Map() }).length, 0, 'sin suscripción push');
});

test('no duplica: comida registrada, ya avisada o aviso general en esta ejecución', () => {
  assert.equal(run({ foodEntries: [{ user_id: 'p1', date: '2026-10-01', food_meal_type: 'lunch' }] }).length, 0);
  assert.equal(run({ sentLog: [{ patient_id: 'p1', local_date: '2026-10-01', slot: 'lunch' }] }).length, 0);
  assert.equal(run({ skipPatients: new Set(['p1']) }).length, 0);
  // El registro de otro día u otro paciente no cuenta
  assert.equal(run({ foodEntries: [{ user_id: 'p1', date: '2026-09-30', food_meal_type: 'lunch' }, { user_id: 'p2', date: '2026-10-01', food_meal_type: 'lunch' }] }).length, 1);
});

test('como mucho un recordatorio por paciente aunque tenga varios profesionales', () => {
  assert.equal(run({ links: [link('p1'), link('p1')] }).length, 1);
});

test('zona horaria desde la suscripción, Madrid por defecto', () => {
  assert.equal(subscriptionTimezone({ type: 'expo', token: 't', timezone: 'Atlantic/Canary' }), 'Atlantic/Canary');
  assert.equal(subscriptionTimezone({ endpoint: 'https://push' }), 'Europe/Madrid');
  assert.equal(subscriptionTimezone(null), 'Europe/Madrid');
  // En Canarias (UTC+1) son las 14:30: aún dentro del margen de la comida
  assert.equal(run({ subscriptions: new Map([['p1', { ...expo, timezone: 'Atlantic/Canary' }]]) }).length, 0);
});
