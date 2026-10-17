// Banda sonora del vídeo v2: música generada por código (sin samples) +
// locución (out/vo/*.wav, ver voice.py) colocada según VO de timeline.js, con
// la música atenuada automáticamente mientras habla la narradora.
//
//   node mix.mjs  → out/soundtrack.wav (44,1 kHz, estéreo, 16 bits)
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURATION, VO, CUES, SHOTS } from './timeline.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SR = 44100, N = Math.ceil(DURATION * SR), TAU = Math.PI * 2;
const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(96400);
const noise = () => rand() * 2 - 1;
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const music = bus(), sfx = bus(), send = bus();
function put(b, i, v, pan = 0, sendAmt = 0) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  b.L[i] += v * l; b.R[i] += v * r;
  if (sendAmt) { send.L[i] += v * l * sendAmt; send.R[i] += v * r * sendAmt; }
}
function adsr(t, dur, a, d, s, r) {
  if (t < 0) return 0;
  let v = t < a ? t / a : t < a + d ? 1 - (1 - s) * ((t - a) / d) : s;
  if (t > dur) v *= Math.max(0, 1 - (t - dur) / r);
  return v;
}

// --------------------------------------------------------------- música
// vi–IV–I–V en Fa mayor (Dm–Bb–F–C), un acorde por compás de 2,5 s.
const CHORDS = [
  { root: 38, notes: [50, 53, 57, 60] }, // Dm7
  { root: 34, notes: [53, 57, 58, 62] }, // Bbmaj7
  { root: 41, notes: [53, 57, 60, 64] }, // Fmaj7
  { root: 36, notes: [52, 55, 60, 62] }, // Cadd9
];
const END_CHORD = 92.6;                       // acorde final con "Fluxia. Datos reales…"
// Intensidad por tramos del montaje (0 = sólo pad … 3 = completo).
function energy(t) {
  if (t < 14) return 0;          // el problema
  if (t < 24) return 1;          // dudas
  if (t < 51) return 2;          // solución: app y configuración
  if (t < 57.6) return 1;        // recordatorios
  if (t < 83) return 3;          // panel
  return t < END_CHORD ? 2 : 0;  // cierre
}
const nBars = Math.ceil(END_CHORD / BAR);
for (let bar = 0; bar <= nBars; bar++) {
  const start = bar * BAR;
  const last = start >= END_CHORD - 0.01 || bar === nBars;
  const t0 = last ? END_CHORD : start;
  if (t0 > DURATION) break;
  const ch = last ? { root: 41, notes: [53, 57, 60, 67] } : CHORDS[bar % 4];
  const dur = last ? DURATION - t0 : Math.min(BAR, END_CHORD - t0);
  // pad
  ch.notes.forEach((m, ni) => {
    for (const det of [-0.1, 0, 0.11]) {
      const f = mtof(m + det); let ph = rand() * TAU;
      const i0 = Math.floor(t0 * SR), i1 = Math.min(N, Math.floor((t0 + dur + 0.8) * SR));
      for (let i = i0; i < i1; i++) {
        const t = i / SR - t0;
        const env = adsr(t, dur, 0.5, 0.5, 0.85, 0.8) * (last ? Math.max(0, Math.min(1, (DURATION - i / SR) / 2.5)) : 1);
        ph += TAU * f / SR;
        let v = 0;
        for (let k = 1; k <= 6; k++) v += Math.sin(ph * k) / Math.pow(k, 1.6);
        put(music, i, v * env * 0.016, (ni / 3 - 0.5) * 0.8 + det * 2, 0.6);
      }
    }
  });
  if (last) break;
  // pulso de piano/pluck
  const steps = 8;
  const pattern = [0, 2, 1, 3, 4, 3, 2, 1];
  const tones = [...ch.notes.map((m) => m + 12), ch.notes[2] + 24];
  for (let s = 0; s < steps; s++) {
    const ts = t0 + s * BEAT / 2, e = energy(ts);
    if (ts >= END_CHORD) break;
    if (e === 0 && s % 2) continue;
    const f = mtof(tones[pattern[s]]), vel = (s % 2 ? 0.65 : 1) * [0.55, 0.7, 0.85, 0.9][e];
    const i0 = Math.floor(ts * SR), len = Math.floor(0.7 * SR); let ph = 0;
    for (let j = 0; j < len; j++) {
      const t = j / SR; ph += TAU * f / SR;
      const env = Math.min(1, t / 0.005) * Math.exp(-t * 6);
      put(music, i0 + j, (Math.sin(ph) + 0.25 * Math.sin(2 * ph) * Math.exp(-t * 12)) * env * 0.04 * vel, Math.sin(s * 1.7) * 0.4, 0.4);
    }
  }
  // bajo
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * BEAT, e = energy(tb);
    if (e < 1 || tb >= END_CHORD) continue;
    const f = mtof(ch.root), i0 = Math.floor(tb * SR), len = Math.floor(BEAT * 0.95 * SR); let ph = 0;
    for (let j = 0; j < len; j++) {
      const t = j / SR; ph += TAU * f / SR;
      put(music, i0 + j, Math.tanh(1.4 * Math.sin(ph)) * adsr(t, BEAT * 0.8, 0.01, 0.2, 0.6, 0.1) * 0.07, 0, 0);
    }
  }
}
// batería suave
let hp1 = 0, hp2 = 0;
for (let b = 0; b * BEAT < END_CHORD; b++) {
  const tb = b * BEAT, e = energy(tb), inBar = b % 4;
  if (e >= 2 && (e === 3 || inBar % 2 === 0)) {
    const i0 = Math.floor(tb * SR); let ph = 0;
    for (let j = 0; j < 0.4 * SR; j++) {
      const t = j / SR; ph += TAU * (48 + 80 * Math.exp(-t * 30)) / SR;
      put(music, i0 + j, Math.sin(ph) * Math.exp(-t * 8) * 0.22, 0, 0);
    }
  }
  if (e >= 2) {
    const i0 = Math.floor((tb + BEAT / 2) * SR);
    for (let j = 0; j < 0.05 * SR; j++) {
      const n = noise(), a = n - hp1; hp1 = n; const h = a - hp2; hp2 = a;
      put(music, i0 + j, h * Math.exp(-j / SR * 80) * 0.012 * (e === 3 ? 1 : 0.7), 0.3, 0.1);
    }
  }
}

// ------------------------------------------------------- efectos sonoros
function tick(t0, amp = 1) {
  const i0 = Math.floor(t0 * SR); let ph = 0;
  for (let j = 0; j < 0.08 * SR; j++) {
    const t = j / SR; ph += TAU * (2100 - 800 * t / 0.08) / SR;
    put(sfx, i0 + j, (Math.sin(ph) * Math.exp(-t * 60) + noise() * 0.25 * Math.exp(-t * 400)) * 0.07 * amp, 0.1, 0.15);
  }
}
function bell(t0, m, amp = 1, pan = 0) {
  const f = mtof(m), i0 = Math.floor(t0 * SR); let ph = 0, pm = 0;
  for (let j = 0; j < 1.4 * SR; j++) {
    const t = j / SR; pm += TAU * f * 3.5 / SR; ph += TAU * f / SR;
    put(sfx, i0 + j, Math.sin(ph + 1.1 * Math.exp(-t * 6) * Math.sin(pm)) * Math.min(1, t / 0.003) * Math.exp(-t * 3.4) * 0.05 * amp, pan, 0.5);
  }
}
function whoosh(t0, dur, amp = 1, f0 = 300, f1 = 4000) {
  const i0 = Math.floor(t0 * SR), len = Math.floor(dur * SR); let a = 0, b = 0;
  for (let j = 0; j < len; j++) {
    const u = j / len, fc = f0 * Math.pow(f1 / f0, u);
    const f = 2 * Math.sin(Math.PI * Math.min(fc, 12000) / SR);
    a += f * b; const hp = noise() - a - 0.6 * b; b += f * hp;
    put(sfx, i0 + j, b * Math.pow(Math.sin(Math.PI * u), 1.6) * 0.07 * amp, Math.sin(u * 3) * 0.5, 0.3);
  }
}
bell(CUES.foodIcon, 84, 0.7);
for (const s of SHOTS) if (s.kind === 'canvas') whoosh(s.start - 0.45, 0.8, 0.6);
CUES.trio.forEach((c, i) => bell(c, [76, 79, 84][i], 0.6, -0.3 + i * 0.3));
for (const c of [CUES.tapBristol, CUES.tabUrine, CUES.tapUrine, CUES.tabFood, CUES.tapPhoto, CUES.clickConfig, CUES.setHidden, CUES.tapRegister, CUES.clickRow, CUES.exportPdf]) tick(c);
CUES.packets.forEach((c, i) => bell(c + 1.0, [81, 84, 88][i], 0.8, 0.3));
[79, 84].forEach((m, i) => bell(CUES.exportPdf + 0.25 + i * 0.1, m, 0.6));
[77, 81, 84, 89].forEach((m, i) => bell(CUES.endChips + i * 0.12, m, 0.5, -0.4 + i * 0.25));

// ------------------------------------------------------------ mezcla
function reverb(input, spread) {
  const out = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ buf: new Float32Array(d + spread), i: 0, lp: 0 }));
  const aps = [556, 441, 341, 225].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
  for (let n = 0; n < N; n++) {
    const x = input[n] * 0.015; let y = 0;
    for (const c of combs) { const o = c.buf[c.i]; c.lp = o * 0.65 + c.lp * 0.35; c.buf[c.i] = x + c.lp * 0.86; c.i = (c.i + 1) % c.buf.length; y += o; }
    for (const a of aps) { const o = a.buf[a.i]; a.buf[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.buf.length; y = o - y; }
    out[n] = y;
  }
  return out;
}
const wetL = reverb(send.L, 0), wetR = reverb(send.R, 23);

// Locución: WAV de voice.py remuestreados a 44,1 kHz con FFmpeg.
const voice = new Float32Array(N);
const speaking = new Float32Array(N);
for (const [id, start] of Object.entries(VO)) {
  const wav = join(HERE, 'out', 'vo', `${id}.wav`);
  if (!existsSync(wav)) throw new Error(`Falta ${wav}: ejecuta antes voice.py`);
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', wav, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
  const s = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const i0 = Math.floor(start * SR);
  for (let j = 0; j < s.length && i0 + j < N; j++) { voice[i0 + j] += s[j]; speaking[i0 + j] = 1; }
}
// envolvente de ducking: ataque 120 ms, relajación 600 ms
const duck = new Float32Array(N);
{
  let g = 1; const att = Math.exp(-1 / (0.12 * SR)), rel = Math.exp(-1 / (0.6 * SR));
  // mirar 150 ms por delante para que la música baje antes de la primera sílaba
  const look = Math.floor(0.15 * SR);
  for (let i = 0; i < N; i++) {
    const target = speaking[Math.min(N - 1, i + look)] ? 0.42 : 1;
    g = target < g ? target + (g - target) * att : target + (g - target) * rel;
    duck[i] = g;
  }
}
let vPeak = 0; for (let i = 0; i < N; i++) vPeak = Math.max(vPeak, Math.abs(voice[i]));
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const m = duck[i];
  const v = voice[i] / vPeak * 0.72;
  L[i] = (music.L[i] + wetL[i] * 1.8) * m * 1.1 + sfx.L[i] + v;
  R[i] = (music.R[i] + wetR[i] * 1.8) * m * 1.1 + sfx.R[i] + v;
}
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.2); R[i] = Math.tanh(R[i] * 1.2); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak;
const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0); data.writeUInt32LE(36 + N * 4, 4); data.write('WAVE', 8); data.write('fmt ', 12);
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, t / 0.05, (DURATION - t) / 0.6);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g * fade)) * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g * fade)) * 32767), 46 + i * 4);
}
writeFileSync(join(HERE, 'out', 'soundtrack.wav'), data);
console.log(join(HERE, 'out', 'soundtrack.wav'));
