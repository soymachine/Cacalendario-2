// Tests de Iniciar sesión con Apple: client secret (JWT ES256), canje del
// código, revocación y revokeAppleForUser (supabase/functions/_shared/apple.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appleClientSecret, appleConfigFromEnv, exchangeAppleCode, revokeAppleToken, revokeAppleForUser,
  isAppleClientId, type AppleKeyConfig,
} from '../supabase/functions/_shared/apple.ts';

const b64urlDecode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

async function testKey(): Promise<{ cfg: AppleKeyConfig; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const pem = `-----BEGIN PRIVATE KEY-----\n${der.toString('base64').match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----`;
  return { cfg: { teamId: 'TEAM123456', keyId: 'KEY1234567', privateKey: pem }, publicKey: pair.publicKey };
}

function mockFetch(responses: { ok: boolean; status: number; body: string }[]) {
  const calls: { url: string; body: URLSearchParams }[] = [];
  const fn = async (url: string, init: { body: string }) => {
    calls.push({ url, body: new URLSearchParams(init.body) });
    const r = responses.shift()!;
    return { ok: r.ok, status: r.status, text: async () => r.body };
  };
  return { fn, calls };
}

test('client secret: JWT ES256 con los claims que pide Apple y firma válida', async () => {
  const { cfg, publicKey } = await testKey();
  const now = Date.UTC(2026, 10, 15, 12, 0, 0);
  const jwt = await appleClientSecret(cfg, 'com.fluxiahealth.app', now);
  const [h, p, s] = jwt.split('.');
  assert.deepEqual(JSON.parse(b64urlDecode(h).toString()), { alg: 'ES256', kid: 'KEY1234567', typ: 'JWT' });
  const payload = JSON.parse(b64urlDecode(p).toString());
  assert.equal(payload.iss, 'TEAM123456');
  assert.equal(payload.sub, 'com.fluxiahealth.app');
  assert.equal(payload.aud, 'https://appleid.apple.com');
  assert.equal(payload.iat, now / 1000);
  assert.equal(payload.exp - payload.iat, 300);
  const sig = b64urlDecode(s);
  assert.equal(sig.length, 64, 'firma r||s de 64 bytes');
  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, publicKey, sig, new TextEncoder().encode(`${h}.${p}`),
  );
  assert.ok(valid);
});

test('client secret: admite la clave con saltos de línea escritos como \\n', async () => {
  const { cfg } = await testKey();
  const oneLine = { ...cfg, privateKey: cfg.privateKey.replace(/\n/g, '\\n') };
  assert.equal((await appleClientSecret(oneLine, 'com.fluxiahealth.medics')).split('.').length, 3);
});

test('configuración desde los secretos', () => {
  const env: Record<string, string> = { APPLE_TEAM_ID: ' T ', APPLE_KEY_ID: 'K', APPLE_PRIVATE_KEY: 'P' };
  assert.deepEqual(appleConfigFromEnv((n) => env[n]), { teamId: 'T', keyId: 'K', privateKey: 'P' });
  assert.equal(appleConfigFromEnv(() => undefined), null);
  assert.equal(appleConfigFromEnv((n) => (n === 'APPLE_KEY_ID' ? '' : 'x')), null);
});

test('solo se aceptan los bundle id de PA y MA', () => {
  assert.ok(isAppleClientId('com.fluxiahealth.app'));
  assert.ok(isAppleClientId('com.fluxiahealth.medics'));
  assert.ok(!isAppleClientId('com.otra.app'));
  assert.ok(!isAppleClientId(undefined));
});

test('canje del código y revocación: peticiones a Apple', async () => {
  const { fn, calls } = mockFetch([
    { ok: true, status: 200, body: JSON.stringify({ refresh_token: 'rt-1', access_token: 'at' }) },
    { ok: true, status: 200, body: '' },
  ]);
  assert.equal(await exchangeAppleCode('code-1', 'com.fluxiahealth.app', 'secret', fn), 'rt-1');
  assert.equal(calls[0].url, 'https://appleid.apple.com/auth/token');
  assert.equal(calls[0].body.get('grant_type'), 'authorization_code');
  assert.equal(calls[0].body.get('code'), 'code-1');
  assert.equal(calls[0].body.get('client_secret'), 'secret');

  await revokeAppleToken('rt-1', 'com.fluxiahealth.app', 'secret', fn);
  assert.equal(calls[1].url, 'https://appleid.apple.com/auth/revoke');
  assert.equal(calls[1].body.get('token'), 'rt-1');
  assert.equal(calls[1].body.get('token_type_hint'), 'refresh_token');
});

test('errores de Apple', async () => {
  const { fn } = mockFetch([
    { ok: false, status: 400, body: '{"error":"invalid_grant"}' },
    { ok: true, status: 200, body: '{}' },
    { ok: false, status: 400, body: '{"error":"invalid_client"}' },
  ]);
  await assert.rejects(exchangeAppleCode('c', 'com.fluxiahealth.app', 's', fn), /invalid_grant/);
  await assert.rejects(exchangeAppleCode('c', 'com.fluxiahealth.app', 's', fn), /refresh_token/);
  await assert.rejects(revokeAppleToken('t', 'com.fluxiahealth.app', 's', fn), /invalid_client/);
});

function mockAdmin(rows: { client_id: string; refresh_token: string }[]) {
  const deleted: string[] = [];
  const admin = {
    from: (_table: string) => ({
      select: (_cols: string) => ({ eq: async (_c: string, _v: string) => ({ data: rows, error: null }) }),
      delete: () => ({ eq: (_c: string, _v: string) => ({ eq: async (_c2: string, v2: string) => { deleted.push(v2); return { error: null }; } }) }),
    }),
  };
  return { admin, deleted };
}

test('revokeAppleForUser: revoca cada token y borra su fila', async () => {
  const { cfg } = await testKey();
  const { admin, deleted } = mockAdmin([{ client_id: 'com.fluxiahealth.app', refresh_token: 'rt-1' }]);
  const { fn, calls } = mockFetch([{ ok: true, status: 200, body: '' }]);
  assert.equal(await revokeAppleForUser(admin, 'u1', cfg, fn), 'revoked');
  assert.equal(calls[0].body.get('token'), 'rt-1');
  assert.deepEqual(deleted, ['com.fluxiahealth.app']);
});

test('revokeAppleForUser: sin tokens, sin secretos o con error de Apple', async () => {
  const { cfg } = await testKey();
  assert.equal(await revokeAppleForUser(mockAdmin([]).admin, 'u1', cfg), 'no_tokens');
  assert.equal(await revokeAppleForUser(mockAdmin([{ client_id: 'com.fluxiahealth.app', refresh_token: 'x' }]).admin, 'u1', null), 'not_configured');
  const { admin, deleted } = mockAdmin([{ client_id: 'com.fluxiahealth.app', refresh_token: 'x' }]);
  const { fn } = mockFetch([{ ok: false, status: 500, body: 'boom' }]);
  await assert.rejects(revokeAppleForUser(admin, 'u1', cfg, fn), /500/);
  assert.deepEqual(deleted, [], 'si Apple falla, la fila se conserva');
});
