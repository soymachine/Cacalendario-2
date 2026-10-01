// Selección de recordatorios de comida para el cron check-inactive-patients.
// Lógica pura (sin red ni base de datos) para poder probarla con
// tests/foodReminderJob.test.ts; index.ts hace las consultas y los envíos.
import { normalizeFoodConfig, planFoodReminder, localDateTimeIn, type FoodReminder } from './food.ts';

/** Zona horaria por defecto si la app aún no la ha informado (Fluxia opera en España). */
export const DEFAULT_TIMEZONE = 'Europe/Madrid';

export interface FoodLinkRow {
  patient_id: string;
  food_config: unknown;
  push_disabled: boolean | null;
  doctor_unlinked: boolean | null;
}

export interface FoodReminderToSend {
  patient_id: string;
  local_date: string;
  reminder: FoodReminder;
}

export function subscriptionTimezone(subscription: unknown): string {
  const tz = subscription && typeof subscription === 'object'
    ? (subscription as { timezone?: unknown }).timezone : undefined;
  return typeof tz === 'string' && tz.length > 0 && tz.length < 64 ? tz : DEFAULT_TIMEZONE;
}

/**
 * Como mucho un recordatorio de comida por paciente y ejecución. Se ignoran
 * los vínculos desvinculados o con notificaciones desactivadas por el
 * profesional, los pacientes sin suscripción push y los que ya han recibido
 * el recordatorio general de inactividad en esta misma ejecución.
 */
export function selectFoodReminders(input: {
  links: FoodLinkRow[];
  subscriptions: Map<string, unknown>;
  foodEntries: { user_id: string; date: string; food_meal_type: string | null }[];
  sentLog: { patient_id: string; local_date: string; slot: string }[];
  skipPatients: Set<string>;
  now: Date;
}): FoodReminderToSend[] {
  const out: FoodReminderToSend[] = [];
  const done = new Set<string>();

  for (const link of input.links) {
    const pid = link.patient_id;
    if (!pid || done.has(pid) || input.skipPatients.has(pid)) continue;
    if (link.push_disabled || link.doctor_unlinked) continue;
    const sub = input.subscriptions.get(pid);
    if (!sub) continue;

    const cfg = normalizeFoodConfig(link.food_config);
    if (!cfg.enabled || !cfg.reminders.enabled) continue;

    const { date, minutes } = localDateTimeIn(subscriptionTimezone(sub), input.now);
    const reminder = planFoodReminder({
      cfg,
      localDate: date,
      localMinutes: minutes,
      foodEntriesToday: input.foodEntries.filter((e) => e.user_id === pid && e.date === date),
      alreadySent: input.sentLog.filter((l) => l.patient_id === pid && l.local_date === date).map((l) => l.slot),
    });
    if (reminder) {
      out.push({ patient_id: pid, local_date: date, reminder });
      done.add(pid);
    }
  }
  return out;
}
