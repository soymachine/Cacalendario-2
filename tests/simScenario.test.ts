// Tests del generador del mes virtual del simulador (tests/sim/scenario.ts).
// No tocan la red: la simulación completa se lanza con `npm run sim`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAS } from './sim/personas.ts';
import { generateScenario, SIM_DAYS, type SimEntry } from './sim/scenario.ts';

const today = '2026-10-30';
const now = new Date(2026, 9, 30, 13, 0).getTime();
const gen = (seed = 1) => generateScenario({ seed, personas: PERSONAS, today, now });

test('misma semilla, mismo mes; otra semilla, otro mes', () => {
  const ids = (s: ReturnType<typeof gen>) => [...s.expected.values()].flatMap((m) => [...m.keys()]).sort();
  assert.deepEqual(ids(gen(1)), ids(gen(1)));
  assert.notDeepEqual(ids(gen(1)), ids(gen(2)));
});

test('el mes va de hace 29 días a hoy y nunca hay registros en el futuro', () => {
  const s = gen();
  assert.equal(s.startDate, '2026-10-01');
  assert.equal(s.days.length, SIM_DAYS);
  for (const day of s.days) {
    for (const a of day) {
      if (a.kind === 'delete') continue;
      assert.ok(a.entry.timestamp <= now, `${a.entry.date} ${a.entry.time} está en el futuro`);
      assert.ok(a.entry.date >= s.startDate && a.entry.date <= today);
    }
  }
});

test('reproducir las acciones da exactamente los registros esperados', () => {
  const s = gen(7);
  const replay = new Map<string, Map<string, SimEntry>>();
  for (const a of s.days.flat()) {
    const m = replay.get(a.persona) ?? new Map<string, SimEntry>();
    replay.set(a.persona, m);
    if (a.kind === 'delete') m.delete(a.entryId);
    else m.set(a.entry.id, a.entry);
  }
  for (const p of PERSONAS) {
    assert.deepEqual([...(replay.get(p.key) ?? new Map()).entries()].sort(), [...s.expected.get(p.key)!.entries()].sort(), p.key);
  }
});

test('cada perfil se comporta como dice', () => {
  const s = gen(3);
  const entries = (k: string) => [...s.expected.get(k)!.values()];
  assert.ok(entries('carmen').every((e) => e.date <= '2026-10-10'), 'carmen deja de registrar el día 9');
  assert.ok(entries('pablo').length > 0 && entries('pablo').every((e) => e.entry_type === 'urine'), 'pablo solo orina');
  assert.ok(entries('laura').some((e) => e.entry_type === 'food' && e.withPhoto), 'laura sube fotos de comida');
  assert.ok(entries('javier').some((e) => (e.bristol ?? 0) >= 6), 'javier tiene un brote');
  assert.ok(entries('elena').every((e) => (e.bristol ?? 0) <= 3), 'elena, estreñimiento');
  const sofia = s.days.flat().filter((a) => a.persona === 'sofia');
  for (const kind of ['edit', 'delete', 'resend']) assert.ok(sofia.some((a) => a.kind === kind), `sofia hace ${kind}`);
});

test('los registros respetan las restricciones de la tabla entries', () => {
  for (const e of [...gen(5).expected.values()].flatMap((m) => [...m.values()])) {
    assert.match(e.id, /^\d+_[a-z0-9]{6}$/);
    if (e.entry_type !== 'food') assert.equal(e.food_meal_type, null);
    if (e.urine_urgency !== null) assert.ok(e.urine_urgency >= 1 && e.urine_urgency <= 5);
    if (e.bristol !== null) assert.ok(e.bristol >= 1 && e.bristol <= 7);
  }
});
