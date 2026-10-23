// Interpretación de las respuestas de Expo / Web Push para el registro de
// envíos (tabla push_log). Lógica pura (sin red ni base de datos) para poder
// probarla con tests/pushResult.test.ts; check-inactive-patients y send-push
// hacen los envíos y las escrituras.

export type PushChannel = 'expo' | 'webpush';
export type PushStatus = 'sent' | 'failed' | 'expired';

export interface PushOutcome {
  status: PushStatus;
  error: string | null;
  /** Ticket de Expo, para consultar después el receipt de entrega. */
  ticketId: string | null;
}

export interface ExpoSubscription {
  type: 'expo';
  token: string;
}

export function isExpoSubscription(sub: unknown): sub is ExpoSubscription {
  return !!sub && typeof sub === 'object' && (sub as ExpoSubscription).type === 'expo'
    && typeof (sub as ExpoSubscription).token === 'string';
}

export function subscriptionChannel(sub: unknown): PushChannel {
  return isExpoSubscription(sub) ? 'expo' : 'webpush';
}

/** Últimos caracteres del token o endpoint: reconocer el dispositivo sin guardar el token entero. */
export function deviceHint(sub: unknown): string | null {
  if (!sub || typeof sub !== 'object') return null;
  const s = sub as { token?: unknown; endpoint?: unknown };
  const id = typeof s.token === 'string' ? s.token : typeof s.endpoint === 'string' ? s.endpoint : null;
  return id ? id.slice(-10) : null;
}

const clip = (s: string) => s.slice(0, 300);

/** Respuesta de POST https://exp.host/--/api/v2/push/send para UN mensaje. */
export function expoSendOutcome(httpStatus: number, out: unknown): PushOutcome {
  const data = (out as { data?: unknown } | null)?.data;
  // Con un solo destinatario Expo devuelve un objeto; con varios, un array.
  const ticket = (Array.isArray(data) ? data[0] : data) as
    | { status?: string; id?: string; message?: string; details?: { error?: string } }
    | undefined;
  if (ticket?.status === 'ok') {
    return { status: 'sent', error: null, ticketId: typeof ticket.id === 'string' ? ticket.id : null };
  }
  const errType = ticket?.details?.error;
  if (errType === 'DeviceNotRegistered') return { status: 'expired', error: 'DeviceNotRegistered', ticketId: null };
  const top = (out as { errors?: { message?: string }[] } | null)?.errors?.[0]?.message;
  const msg = ticket?.message ?? top ?? `HTTP ${httpStatus}`;
  return { status: 'failed', error: clip(errType ? `${errType}: ${msg}` : msg), ticketId: null };
}

/** Respuesta HTTP de un servicio de Web Push. */
export function webPushOutcome(httpStatus: number, bodyText = ''): PushOutcome {
  if (httpStatus === 404 || httpStatus === 410) return { status: 'expired', error: `HTTP ${httpStatus}`, ticketId: null };
  if (httpStatus >= 200 && httpStatus < 300) return { status: 'sent', error: null, ticketId: null };
  return { status: 'failed', error: clip(`HTTP ${httpStatus}${bodyText ? `: ${bodyText}` : ''}`), ticketId: null };
}

export interface ReceiptResult {
  ticketId: string;
  status: 'ok' | 'error';
  error: string | null;
}

/**
 * Respuesta de POST https://exp.host/--/api/v2/push/getReceipts. Los tickets
 * cuyo receipt aún no está disponible no aparecen: se vuelven a consultar en
 * la siguiente ejecución.
 */
export function parseExpoReceipts(out: unknown): ReceiptResult[] {
  const data = (out as { data?: unknown } | null)?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const results: ReceiptResult[] = [];
  for (const [ticketId, r] of Object.entries(data as Record<string, unknown>)) {
    const rec = r as { status?: string; message?: string; details?: { error?: string } } | null;
    if (rec?.status === 'ok') results.push({ ticketId, status: 'ok', error: null });
    else if (rec?.status === 'error') {
      const errType = rec.details?.error;
      const msg = rec.message ?? 'error';
      results.push({ ticketId, status: 'error', error: clip(errType ? `${errType}: ${msg}` : msg) });
    }
  }
  return results;
}
