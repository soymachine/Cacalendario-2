// Facturación con Stripe (MW — panel de médicos).
//
// El navegador nunca habla con Stripe directamente: pide una URL a una Edge
// Function, que es quien tiene la clave secreta, y redirige a ella. Stripe
// devuelve al usuario a /medics y el plan real lo escribe el webhook.
import { supabaseMedics as supabase } from './supabase';

/** Precio público del plan Pro. El importe que se cobra es el del Price de Stripe. */
export const PRO_PRICE_LABEL = '19,95 €';

async function invokeBilling(fn: 'stripe-checkout' | 'stripe-portal'): Promise<string> {
  const { data, error } = await supabase.functions.invoke(fn, { body: {} });

  if (error) {
    // `functions.invoke` no expone el cuerpo del error, así que el mensaje del
    // servidor (p.ej. "Ya tienes el plan Pro activo") viaja también en `data`.
    throw new Error(data?.error || error.message || 'No se pudo contactar con el sistema de pagos.');
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('Respuesta inesperada del sistema de pagos.');

  return data.url as string;
}

/** Abre Stripe Checkout para contratar el plan Pro. */
export async function startProCheckout(): Promise<void> {
  window.location.href = await invokeBilling('stripe-checkout');
}

/** Abre el Customer Portal: cambiar tarjeta, ver facturas, cancelar. */
export async function openBillingPortal(): Promise<void> {
  window.location.href = await invokeBilling('stripe-portal');
}

export type CheckoutOutcome = 'success' | 'cancel' | null;

/**
 * Lee `?checkout=...` del `success_url`/`cancel_url` de Stripe y limpia la URL
 * para que un refresco no vuelva a mostrar el mensaje.
 */
export function readCheckoutOutcome(): CheckoutOutcome {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('checkout');
  if (outcome !== 'success' && outcome !== 'cancel') return null;

  params.delete('checkout');
  params.delete('session_id');
  const query = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''));

  return outcome;
}
