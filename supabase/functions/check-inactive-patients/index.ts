// Supabase Edge Function: check-inactive-patients
// Runs as a cron job (every hour) to send push reminders to inactive patients,
// and the meal reminders configured by the professional (food tracking module).
// Deploy via: supabase functions deploy check-inactive-patients
// Schedule via Supabase Dashboard → Edge Functions → check-inactive-patients → Schedule: 0 * * * *

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { selectFoodReminders } from '../_shared/foodReminderJob.ts';

// ── Base64url helpers ─────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// ── VAPID JWT (RFC 8292) ──────────────────────────────────────────────────────

async function buildVapidHeader(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const jwtHeader = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const jwtPayload = b64url(new TextEncoder().encode(JSON.stringify({ aud: audience, exp, sub: 'mailto:noreply@fluxia-health.com' })));
  const signingInput = `${jwtHeader}.${jwtPayload}`;

  const pubBytes = b64urlDecode(vapidPublicKey);
  if (pubBytes[0] !== 0x04 || pubBytes.length !== 65) throw new Error('VAPID_PUBLIC_KEY must be a 65-byte uncompressed P-256 point');

  const ecKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: b64url(pubBytes.slice(1, 33)), y: b64url(pubBytes.slice(33, 65)), d: b64url(b64urlDecode(vapidPrivateKey)) },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, ecKey, new TextEncoder().encode(signingInput));
  return `vapid t=${signingInput}.${b64url(sig)},k=${vapidPublicKey}`;
}

// ── Web Push encryption (RFC 8291 + RFC 8188 aes128gcm) ──────────────────────

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function encryptPayload(subscription: PushSubscription, plaintext: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const uaPubBytes = b64urlDecode(subscription.keys.p256dh);
  const authSecret = b64urlDecode(subscription.keys.auth);

  const serverKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey));

  const uaPub = await crypto.subtle.importKey('raw', uaPubBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPub }, serverKP.privateKey, 256);

  const ikmKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits']);
  const prkBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: new Uint8Array([...enc.encode('WebPush: info\x00'), ...uaPubBytes, ...asPubRaw]) },
    ikmKey, 256,
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prkKey = await crypto.subtle.importKey('raw', prkBits, 'HKDF', false, ['deriveBits']);

  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: aes128gcm\x00') }, prkKey, 128,
  );
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: nonce\x00') }, prkKey, 96,
  );

  const cek = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt']);
  const nonce = new Uint8Array(nonceBits);

  const ptBytes = enc.encode(plaintext);
  const padded = new Uint8Array(ptBytes.length + 1);
  padded.set(ptBytes);
  padded[ptBytes.length] = 0x02;

  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, padded));

  const header = new Uint8Array(16 + 4 + 1 + asPubRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = asPubRaw.length;
  header.set(asPubRaw, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);
  return body;
}

async function sendWebPush(subscription: PushSubscription, notifPayload: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const body = await encryptPayload(subscription, notifPayload);
  const authHeader = await buildVapidHeader(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', TTL: '86400' },
    body,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: candidates, error } = await supabase.rpc('get_patients_needing_push');

  if (error) {
    console.error('RPC error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // A doctor can disable automatic reminders for a patient regardless of the
  // patient's own push preference. Filter those out before sending.
  const candidatePatientIds = [...new Set((candidates ?? []).map((p: { patient_id: string }) => p.patient_id))];
  let disabledPatientIds = new Set<string>();
  if (candidatePatientIds.length > 0) {
    const { data: disabledLinks, error: linksError } = await supabase
      .from('patient_links')
      .select('patient_id')
      .eq('status', 'accepted')
      .eq('push_disabled', true)
      .in('patient_id', candidatePatientIds);
    if (linksError) {
      console.error('patient_links lookup error:', linksError);
    } else {
      disabledPatientIds = new Set((disabledLinks ?? []).map((l) => l.patient_id));
    }
  }
  const patients = (candidates ?? []).filter((p: { patient_id: string }) => !disabledPatientIds.has(p.patient_id));

  let sent = 0;
  let failed = 0;

  const reminderTitle = 'Fluxia';
  const reminderBody = 'No has registrado nada hoy. Tu médico necesita esta información 🩺';

  // Pacientes que ya reciben el aviso general en esta ejecución: no se les
  // manda además un recordatorio de comida (evita notificaciones de más).
  const remindedNow = new Set<string>();

  for (const patient of patients ?? []) {
    const ok = await deliver(supabase, patient.patient_id, patient.subscription, reminderTitle, reminderBody, vapidPublicKey, vapidPrivateKey);
    if (ok) {
      await supabase.from('push_subscriptions').update({ last_push_sent_at: new Date().toISOString() }).eq('user_id', patient.patient_id);
      remindedNow.add(patient.patient_id);
      sent++;
    } else {
      failed++;
    }
  }

  // ── Recordatorios de comida (pauta del profesional en patient_links.food_config) ──
  let foodSent = 0;
  let foodFailed = 0;
  try {
    ({ sent: foodSent, failed: foodFailed } = await sendFoodReminders(supabase, remindedNow, vapidPublicKey, vapidPrivateKey));
  } catch (err: unknown) {
    console.error('Food reminders error:', err instanceof Error ? err.message : String(err));
  }

  return new Response(JSON.stringify({ success: true, sent, failed, food_sent: foodSent, food_failed: foodFailed }), { status: 200 });
});

// ── Envío (Expo para la app nativa, Web Push para la web) ─────────────────────

// deno-lint-ignore no-explicit-any
type ServiceClient = SupabaseClient<any, 'public', any>;

async function deliver(
  supabase: ServiceClient,
  patientId: string,
  subscription: any,
  title: string,
  body: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<boolean> {
  try {
    // Native app subscriptions ({ type: 'expo', token }) go through Expo's push API
    if (subscription?.type === 'expo' && typeof subscription.token === 'string') {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: subscription.token, title, body, sound: 'default' }),
      });
      const out = await res.json().catch(() => null);
      const status = out?.data?.status;
      if (status !== 'ok') {
        if (out?.data?.details?.error === 'DeviceNotRegistered') {
          await supabase.from('push_subscriptions').delete().eq('user_id', patientId);
        } else {
          console.error(`Expo push failed for ${patientId}:`, out?.data?.message ?? res.status);
        }
        return false;
      }
      return true;
    }

    const res = await sendWebPush(subscription, JSON.stringify({ title, body }), vapidPublicKey, vapidPrivateKey);

    if (res.status === 410 || res.status === 404) {
      await supabase.from('push_subscriptions').delete().eq('user_id', patientId);
      return false;
    }

    if (!res.ok) {
      console.error(`Push failed for ${patientId}: ${res.status}`);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.error(`Push exception for ${patientId}:`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

// ── Recordatorios de comida ───────────────────────────────────────────────────
// La decisión (qué comida, si toca, tope diario, horas de descanso) vive en
// _shared/foodReminderJob.ts + _shared/food.ts, que tienen tests. Aquí solo se
// consulta, se reserva el hueco en food_reminder_log y se envía. No se registra
// en logs el contenido del mensaje (dato clínico), solo ids y errores.

async function sendFoodReminders(
  supabase: ServiceClient,
  skipPatients: Set<string>,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<{ sent: number; failed: number }> {
  const { data: links, error: linksErr } = await supabase
    .from('patient_links')
    .select('patient_id, food_config, push_disabled, doctor_unlinked')
    .eq('status', 'accepted')
    .not('patient_id', 'is', null)
    .not('food_config', 'is', null);
  if (linksErr) throw new Error(`patient_links: ${linksErr.message}`);

  const candidates = (links ?? []).filter((l: any) => l.food_config?.enabled === true && l.food_config?.reminders?.enabled === true);
  if (candidates.length === 0) return { sent: 0, failed: 0 };
  const ids = [...new Set(candidates.map((l: any) => l.patient_id as string))];

  const now = new Date();
  // Margen de ±1 día UTC: la fecha local de cada paciente cae dentro.
  const from = new Date(now.getTime() - 36 * 3600 * 1000).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 36 * 3600 * 1000).toISOString().slice(0, 10);

  const [subsRes, entriesRes, logRes] = await Promise.all([
    supabase.from('push_subscriptions').select('user_id, subscription').in('user_id', ids),
    supabase.from('entries').select('user_id, date, food_meal_type')
      .eq('entry_type', 'food').in('user_id', ids).gte('date', from).lte('date', to),
    supabase.from('food_reminder_log').select('patient_id, local_date, slot')
      .in('patient_id', ids).gte('local_date', from),
  ]);
  if (subsRes.error) throw new Error(`push_subscriptions: ${subsRes.error.message}`);
  if (entriesRes.error) throw new Error(`entries: ${entriesRes.error.message}`);
  if (logRes.error) throw new Error(`food_reminder_log: ${logRes.error.message}`);

  const subscriptions = new Map<string, unknown>((subsRes.data ?? []).map((s: any) => [s.user_id, s.subscription]));
  const toSend = selectFoodReminders({
    links: candidates,
    subscriptions,
    foodEntries: entriesRes.data ?? [],
    sentLog: logRes.data ?? [],
    skipPatients,
    now,
  });

  let sent = 0;
  let failed = 0;
  for (const item of toSend) {
    // Reservar antes de enviar: si otra ejecución ya lo reservó (clave
    // primaria patient_id + local_date + slot), no se duplica.
    const { error: claimErr } = await supabase
      .from('food_reminder_log')
      .insert({ patient_id: item.patient_id, local_date: item.local_date, slot: item.reminder.slot });
    if (claimErr) continue;

    const ok = await deliver(supabase, item.patient_id, subscriptions.get(item.patient_id), item.reminder.title, item.reminder.body, vapidPublicKey, vapidPrivateKey);
    if (ok) sent++; else failed++;
  }
  return { sent, failed };
}
