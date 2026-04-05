// Supabase Edge Function: check-inactive-patients
// Runs as a cron job (every hour) to send push reminders to inactive patients.
// Deploy via: supabase functions deploy check-inactive-patients
// Schedule via Supabase Dashboard → Edge Functions → check-inactive-patients → Schedule: 0 * * * *

import { createClient } from 'npm:@supabase/supabase-js@2';

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
  const { data: patients, error } = await supabase.rpc('get_patients_needing_push');

  if (error) {
    console.error('RPC error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const patient of patients ?? []) {
    try {
      const res = await sendWebPush(
        patient.subscription,
        JSON.stringify({ title: 'Fluxia', body: 'No has registrado nada hoy. Tu médico necesita esta información 🩺' }),
        vapidPublicKey,
        vapidPrivateKey,
      );

      if (res.status === 410 || res.status === 404) {
        await supabase.from('push_subscriptions').delete().eq('user_id', patient.patient_id);
        failed++;
        continue;
      }

      if (!res.ok) {
        console.error(`Push failed for ${patient.patient_id}: ${res.status}`);
        failed++;
        continue;
      }

      await supabase.from('push_subscriptions').update({ last_push_sent_at: new Date().toISOString() }).eq('user_id', patient.patient_id);
      sent++;
    } catch (err: unknown) {
      console.error(`Push exception for ${patient.patient_id}:`, err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  return new Response(JSON.stringify({ success: true, sent, failed }), { status: 200 });
});
