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

// ── Resumen del plan para la UI ──────────────────────────────────────────────
// El médico tiene que poder ver de un vistazo qué plan tiene, con qué
// periodicidad paga y hasta cuándo lo tiene garantizado. Con solo la insignia
// PRO, una suscripción cancelada parecía indistinguible de una activa: seguía
// diciendo PRO sin explicar que ya no se renovará.

export type BillingIntervalCode = 'day' | 'week' | 'month' | 'year';

export interface DoctorBillingFields {
  plan: DoctorPlan;
  test_plan_started_at?: string | null;
  stripe_status?: string | null;
  stripe_interval?: string | null;
  stripe_current_period_end?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
}

/** `positive` = todo en orden · `warning` = el acceso tiene fecha de fin o el cobro falla. */
export type PlanTone = 'positive' | 'warning' | 'neutral';

export interface PlanSummary {
  /** "Plan Pro · Mensual" */
  title: string;
  /** "Se renueva el 22 de septiembre de 2026" */
  detail: string;
  tone: PlanTone;
}

const INTERVAL_LABEL: Record<string, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
  year: 'Anual',
};

/** "22 de septiembre de 2026" (o null si no hay fecha). */
export function formatPlanDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function planSummary(d: DoctorBillingFields): PlanSummary {
  const until = formatPlanDate(d.stripe_current_period_end);

  if (d.plan === 'pro') {
    const interval = d.stripe_interval ? INTERVAL_LABEL[d.stripe_interval] : null;
    const title = interval ? `Plan Pro · ${interval}` : 'Plan Pro';

    // Impago: Stripe sigue reintentando y el acceso se mantiene (ver ENTITLED
    // en stripe-webhook), pero el médico tiene que enterarse.
    if (d.stripe_status === 'past_due' || d.stripe_status === 'unpaid') {
      return {
        title,
        detail: 'No hemos podido cobrar tu última factura. Actualiza la tarjeta para no perder el acceso.',
        tone: 'warning',
      };
    }

    if (d.stripe_cancel_at_period_end) {
      return {
        title,
        detail: until
          ? `Cancelada · mantienes Pro hasta el ${until} y no se volverá a cobrar`
          : 'Cancelada · mantienes Pro hasta el final del periodo ya pagado',
        tone: 'warning',
      };
    }

    return {
      title,
      detail: until ? `Activa · se renueva el ${until}` : 'Activa · renovación automática',
      tone: 'positive',
    };
  }

  if (d.plan === 'beta') {
    return { title: 'Plan Beta', detail: 'Acceso completo, sin fecha de caducidad', tone: 'positive' };
  }

  if (d.plan === 'test') {
    const daysLeft = testPlanDaysLeft(d.test_plan_started_at);
    if (daysLeft === null) {
      return { title: 'Prueba gratuita', detail: `${TEST_PLAN_DURATION_DAYS} días de acceso completo`, tone: 'positive' };
    }
    if (daysLeft <= 0) {
      return { title: 'Prueba gratuita caducada', detail: 'Pasa al plan Pro para seguir usando Fluxia', tone: 'warning' };
    }
    return {
      title: 'Prueba gratuita',
      detail: `Te ${daysLeft === 1 ? 'queda 1 día' : `quedan ${daysLeft} días`} · sin tarjeta`,
      tone: daysLeft <= 7 ? 'warning' : 'positive',
    };
  }

  return { title: 'Plan Inicio', detail: 'Gratuito, con límite de pacientes', tone: 'neutral' };
}
