// Tests de la interpretación de respuestas de Expo / Web Push (registro push_log).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expoSendOutcome, webPushOutcome, parseExpoReceipts, deviceHint, subscriptionChannel,
} from '../supabase/functions/_shared/pushResult.ts';

test('envío Expo aceptado: guarda el ticket', () => {
  assert.deepEqual(expoSendOutcome(200, { data: { status: 'ok', id: 'tk-1' } }), { status: 'sent', error: null, ticketId: 'tk-1' });
  assert.equal(expoSendOutcome(200, { data: [{ status: 'ok', id: 'tk-2' }] }).ticketId, 'tk-2', 'respuesta en array');
});

test('envío Expo con token caducado o con error', () => {
  const expired = expoSendOutcome(200, { data: { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } } });
  assert.equal(expired.status, 'expired');
  const failed = expoSendOutcome(200, { data: { status: 'error', message: 'bad creds', details: { error: 'InvalidCredentials' } } });
  assert.deepEqual(failed, { status: 'failed', error: 'InvalidCredentials: bad creds', ticketId: null });
  assert.equal(expoSendOutcome(500, null).error, 'HTTP 500', 'sin cuerpo JSON');
  assert.equal(expoSendOutcome(400, { errors: [{ message: 'too many' }] }).error, 'too many', 'error de la petición');
});

test('Web Push', () => {
  assert.equal(webPushOutcome(201).status, 'sent');
  assert.equal(webPushOutcome(410).status, 'expired');
  assert.equal(webPushOutcome(403, 'forbidden').error, 'HTTP 403: forbidden');
});

test('receipts de Expo: entregados, con error y pendientes', () => {
  const r = parseExpoReceipts({ data: {
    a: { status: 'ok' },
    b: { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
  } });
  assert.deepEqual(r, [
    { ticketId: 'a', status: 'ok', error: null },
    { ticketId: 'b', status: 'error', error: 'DeviceNotRegistered: gone' },
  ]);
  assert.deepEqual(parseExpoReceipts({ data: {} }), [], 'sin receipts disponibles todavía');
  assert.deepEqual(parseExpoReceipts(null), []);
});

test('canal y pista del dispositivo sin guardar el token entero', () => {
  const expo = { type: 'expo', token: 'ExponentPushToken[TzMIk4JfQDMo]' };
  assert.equal(subscriptionChannel(expo), 'expo');
  assert.equal(deviceHint(expo), 'Ik4JfQDMo]');
  assert.equal(subscriptionChannel({ endpoint: 'https://push/x', keys: {} }), 'webpush');
  assert.equal(deviceHint({ endpoint: 'https://fcm.googleapis.com/abcdef123456' }), 'cdef123456');
  assert.equal(deviceHint(null), null);
});
