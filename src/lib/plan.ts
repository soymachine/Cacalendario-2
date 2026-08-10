// Trial gratuito de médicos (plan 'test').
//
// Fuente canónica. La copia de la app está en mobile-medics/src/lib/plan.ts:
// si tocas algo aquí, replícalo allí (ver CLAUDE.md).
//
// El trial NO pasa por Stripe ni pide tarjeta: se cuenta desde
// `doctors.test_plan_started_at`, que fija el trigger `doctors_set_trial_on_insert`
// en el alta. Al caducar, MW ofrece pasar por Stripe Checkout.

export const TEST_PLAN_DURATION_DAYS = 30;

export type DoctorPlan = 'free' | 'beta' | 'test' | 'pro';

/** Días que quedan de prueba (0 si ya caducó), o null si el trial no ha empezado. */
export function testPlanDaysLeft(startedAt: string | null | undefined): number | null {
  if (!startedAt) return null;
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, TEST_PLAN_DURATION_DAYS - elapsedDays);
}

/** true solo para un médico en 'test' cuyo periodo de prueba ya se agotó. */
export function isTrialExpired(plan: DoctorPlan, startedAt: string | null | undefined): boolean {
  if (plan !== 'test') return false;
  const daysLeft = testPlanDaysLeft(startedAt);
  return daysLeft !== null && daysLeft <= 0;
}
