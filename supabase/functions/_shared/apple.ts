// Iniciar sesión con Apple: revocación de tokens al borrar la cuenta.
//
// App Store, norma 5.1.1(v): si una cuenta se creó con Sign in with Apple, al
// borrarla hay que revocar sus tokens en Apple. Para revocar hace falta un
// refresh token, que solo se obtiene canjeando el `authorizationCode` que da
// Apple al iniciar sesión (caduca a los 5 minutos). Por eso:
//   1. Al entrar con Apple, la app envía el código a la Edge Function
//      apple-auth (action 'store'), que lo canjea y guarda el refresh token en
//      public.apple_auth_tokens (solo service role).
//   2. Al borrar la cuenta, delete-user (PA) o apple-auth (action 'revoke',
//      MA) lo revoca con /auth/revoke.
//
// Las llamadas a Apple se firman con un "client secret": un JWT ES256 firmado
// con la clave privada (.p8) de Sign in with Apple. Secretos de las Edge
// Functions: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (contenido del .p8).
//
// Sin dependencias de Deno: lo prueban los tests de Node (tests/apple.test.ts).

export const APPLE_CLIENT_IDS = ['com.fluxiahealth.app', 'com.fluxiahealth.medics'];

const APPLE_AUDIENCE = 'https://appleid.apple.com';
const TOKEN_URL = 'https://appleid.apple.com/auth/token';
const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

export interface AppleKeyConfig {
  teamId: string;
  keyId: string;
  /** Contenido del .p8 (PEM PKCS#8). Admite saltos de línea escritos como \n. */
  privateKey: string;
}

type FetchFn = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

/** Configuración desde los secretos; null si falta alguno. */
export function appleConfigFromEnv(get: (name: string) => string | undefined): AppleKeyConfig | null {
  const teamId = get('APPLE_TEAM_ID')?.trim();
  const keyId = get('APPLE_KEY_ID')?.trim();
  const privateKey = get('APPLE_PRIVATE_KEY')?.trim();
  if (!teamId || !keyId || !privateKey) return null;
  return { teamId, keyId, privateKey };
}

export function isAppleClientId(clientId: unknown): clientId is string {
  return typeof clientId === 'string' && APPLE_CLIENT_IDS.includes(clientId);
}

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const base64urlJson = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der;
}

/** Client secret para /auth/token y /auth/revoke (JWT ES256, válido 5 min). */
export async function appleClientSecret(cfg: AppleKeyConfig, clientId: string, now: number = Date.now()): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(cfg.privateKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  );
  const iat = Math.floor(now / 1000);
  const header = { alg: 'ES256', kid: cfg.keyId, typ: 'JWT' };
  const payload = { iss: cfg.teamId, iat, exp: iat + 300, aud: APPLE_AUDIENCE, sub: clientId };
  const signingInput = `${base64urlJson(header)}.${base64urlJson(payload)}`;
  // WebCrypto devuelve la firma ECDSA en formato r||s (64 bytes), el que usa JWT
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

/** Canjea el authorizationCode de la app por un refresh token. */
export async function exchangeAppleCode(
  code: string, clientId: string, clientSecret: string, fetchFn: FetchFn = fetch as unknown as FetchFn,
): Promise<string> {
  const res = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Apple /auth/token ${res.status}: ${text}`);
  const refreshToken = (JSON.parse(text) as { refresh_token?: string }).refresh_token;
  if (!refreshToken) throw new Error('Apple /auth/token no ha devuelto refresh_token');
  return refreshToken;
}

/** Revoca un refresh token en Apple. */
export async function revokeAppleToken(
  refreshToken: string, clientId: string, clientSecret: string, fetchFn: FetchFn = fetch as unknown as FetchFn,
): Promise<void> {
  const res = await fetchFn(REVOKE_URL, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({ client_id: clientId, client_secret: clientSecret, token: refreshToken, token_type_hint: 'refresh_token' }),
  });
  if (!res.ok) throw new Error(`Apple /auth/revoke ${res.status}: ${await res.text()}`);
}

/** Cliente de Supabase (service role); tipado laxo para no atarse a la versión del SDK. */
// deno-lint-ignore no-explicit-any
type TokensTable = { from(table: string): any };

export type RevokeResult = 'no_tokens' | 'not_configured' | 'revoked';

/**
 * Revoca en Apple todos los tokens guardados del usuario y borra las filas.
 * Lanza si Apple rechaza alguno (la fila se conserva para reintentar).
 */
export async function revokeAppleForUser(
  admin: TokensTable, userId: string, cfg: AppleKeyConfig | null, fetchFn: FetchFn = fetch as unknown as FetchFn,
): Promise<RevokeResult> {
  const { data, error } = await admin.from('apple_auth_tokens').select('client_id, refresh_token').eq('user_id', userId);
  if (error) throw new Error(`apple_auth_tokens: ${error.message}`);
  const rows = (data ?? []) as { client_id: string; refresh_token: string }[];
  if (rows.length === 0) return 'no_tokens';
  if (!cfg) return 'not_configured';
  for (const row of rows) {
    const secret = await appleClientSecret(cfg, row.client_id);
    await revokeAppleToken(row.refresh_token, row.client_id, secret, fetchFn);
    const { error: delError } = await admin.from('apple_auth_tokens').delete().eq('user_id', userId).eq('client_id', row.client_id);
    if (delError) throw new Error(`apple_auth_tokens: ${delError.message}`);
  }
  return 'revoked';
}
