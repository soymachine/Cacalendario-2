// Música del vídeo de marketing generada 100% por código (misma base que
// ../music.mjs: síntesis aditiva, filtros, retardo y reverb tipo Freeverb),
// con estructura y efectos alineados con los momentos clave de timeline.js.
// Devuelve un WAV estéreo de 16 bits.
//
//   node marketing/music.mjs  → out/fluxia-marketing-50s.wav
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DURATION, BPM, CUES } from './timeline.js';

const SR = 44100;
const N = Math.ceil(DURATION * SR);
const BEAT = 60 / BPM, BAR = BEAT * 4;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;

// PRNG determinista: el mismo código produce siempre el mismo audio.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261023);
const noise = () => rand() * 2 - 1;

const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const pad = bus(), arp = bus(), bass = bus(), drums = bus(), sfx = bus(), send = bus();

function put(b, i, v, pan = 0, sendAmt = 0) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  b.L[i] += v * l; b.R[i] += v * r;
  if (sendAmt) { send.L[i] += v * l * sendAmt; send.R[i] += v * r * sendAmt; }
}

// Envolvente ADSR (en segundos) evaluada en t relativo al inicio de la nota.
function adsr(t, dur, a, d, s, r) {
  if (t < 0) return 0;
  let v = t < a ? t / a : t < a + d ? 1 - (1 - s) * ((t - a) / d) : s;
  if (t > dur) v *= Math.max(0, 1 - (t - dur) / r);
  return v;
}

// ------------------------------------------------------------- estructura
// Progresión I–V–vi–IV en Fa mayor, un acorde por compás (2 s).
const CHORDS = [
  { root: 41, pad: [53, 57, 60, 64] },  // Fmaj7
  { root: 36, pad: [52, 55, 60, 62] },  // C(add9)
  { root: 38, pad: [50, 53, 57, 60] },  // Dm7
  { root: 34, pad: [53, 57, 58, 62] },  // Bbmaj7
];
const NBARS = Math.ceil(DURATION / BAR);
const LAST = 22; // compás del acorde final (44 s), que se sostiene hasta el final
// El reto (4–12 s) suena en el relativo menor; desde la solución, I–V–vi–IV.
const VERSE = [CHORDS[2], CHORDS[3], CHORDS[2], CHORDS[1]];
const chordAt = (bar) => (bar >= LAST ? CHORDS[0] : bar >= 6 ? CHORDS[(bar - 6) % 4] : bar >= 2 ? VERSE[bar - 2] : CHORDS[bar]);
// Secciones: intro (0–4 s), reto (4–10), subida (10–12), estribillo (12–38),
// subida (38–40), estribillo final (40–44) y cierre (44–50).
const section = (t) => (t < 4 ? 'intro' : t < 10 ? 'verse' : t < 12 ? 'build' : t < 38 ? 'chorus' : t < 40 ? 'build' : t < 44 ? 'chorus' : 'end');
const inRoll = (t) => (t >= 11 && t < 12) || (t >= 39 && t < 40);

// ------------------------------------------------------------------- pad
for (let bar = 0; bar <= LAST; bar++) {
  const ch = chordAt(bar);
  const start = bar * BAR;
  const last = bar === LAST;
  const dur = last ? DURATION - start : BAR;
  ch.pad.forEach((m, ni) => {
    for (const det of [-0.11, 0, 0.12]) {
      const f = mtof(m + det);
      const pan = (ni / 3 - 0.5) * 0.9 + det * 2;
      let ph = rand() * TAU;
      const i0 = Math.floor(start * SR), i1 = Math.min(N, Math.floor((start + dur + 0.6) * SR));
      for (let i = i0; i < i1; i++) {
        const t = i / SR - start;
        const env = adsr(t, dur, 0.35, 0.4, 0.85, 0.6) * (last ? Math.min(1, (DURATION - i / SR) / 1.6) : 1);
        ph += TAU * f * (1 + 0.0015 * Math.sin(TAU * 0.3 * (i / SR) + ni)) / SR;
        let v = 0;
        for (let k = 1; k <= 7; k++) v += Math.sin(ph * k) / Math.pow(k, 1.35);
        put(pad, i, v * env * 0.022, pan, 0.6);
      }
    }
  });
}

// --------------------------------------------------------------- arpegio
for (let bar = 0; bar < NBARS - 1; bar++) {
  const ch = chordAt(bar);
  const notes = [...ch.pad.map((m) => m + 12), ch.pad[1] + 24];
  const pattern = [0, 2, 1, 3, 4, 3, 1, 2, 0, 2, 1, 3, 4, 2, 3, 1];
  for (let s = 0; s < 16; s++) {
    const t0 = bar * BAR + s * BEAT / 4;
    const sec = section(t0);
    if (sec === 'intro' && s % 2) continue;          // corcheas en la intro
    if (sec === 'verse' && s % 2 && s % 4 !== 3) continue;
    if (sec === 'end') continue;
    const m = notes[pattern[s]];
    const f = mtof(m);
    const vel = (s % 4 === 0 ? 1 : 0.7) * (sec === 'intro' ? 0.6 : sec === 'verse' ? 0.8 : 1);
    const pan = Math.sin(s * 1.3) * 0.5;
    const i0 = Math.floor(t0 * SR), len = Math.floor(0.45 * SR);
    let ph = 0;
    for (let j = 0; j < len; j++) {
      const t = j / SR;
      ph += TAU * f / SR;
      const env = Math.min(1, t / 0.004) * Math.exp(-t * 9);
      const v = Math.sin(ph) + 0.35 * Math.sin(2 * ph) * Math.exp(-t * 20) + 0.12 * Math.sin(3 * ph) * Math.exp(-t * 30);
      put(arp, i0 + j, v * env * 0.05 * vel, pan, 0.35);
    }
  }
}
// retardo ping-pong en el arpegio (3/16)
{
  const d = Math.floor(BEAT * 0.75 * SR);
  for (let i = d; i < N; i++) {
    arp.L[i] += arp.R[i - d] * 0.32;
    arp.R[i] += arp.L[i - d] * 0.32;
  }
}

// ----------------------------------------------------------------- bajo
for (let bar = 0; bar < NBARS; bar++) {
  const ch = chordAt(bar);
  for (let e = 0; e < 8; e++) {
    const t0 = bar * BAR + e * BEAT / 2;
    const sec = section(t0);
    if (sec === 'intro') continue;
    if (sec === 'end' && (bar > LAST || e > 0)) continue;
    if (sec === 'build' && e % 2 === 0) continue; // sólo contratiempos al subir
    const f = mtof(ch.root + (e === 7 && sec === 'chorus' ? 12 : 0));
    const dur = sec === 'end' ? 2.0 : BEAT / 2 * 0.85;
    const i0 = Math.floor(t0 * SR), len = Math.floor((dur + 0.08) * SR);
    let ph = 0;
    for (let j = 0; j < len; j++) {
      const t = j / SR;
      ph += TAU * f / SR;
      const env = adsr(t, dur, 0.005, 0.12, 0.6, 0.06);
      const v = Math.tanh(1.8 * (Math.sin(ph) + 0.3 * Math.sin(2 * ph)));
      put(bass, i0 + j, v * env * 0.11, 0, 0);
    }
  }
}

// --------------------------------------------------------------- batería
const kicks = [];
function kick(t0, amp = 1) {
  kicks.push(t0);
  const i0 = Math.floor(t0 * SR), len = Math.floor(0.45 * SR);
  let ph = 0;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    ph += TAU * (46 + 110 * Math.exp(-t * 32)) / SR;
    const v = Math.sin(ph) * Math.exp(-t * 7.5) + noise() * 0.15 * Math.exp(-t * 300);
    put(drums, i0 + j, v * 0.42 * amp, 0, 0.02);
  }
}
let hpPrev = 0, hpPrev2 = 0;
function hat(t0, amp = 1, open = false) {
  const i0 = Math.floor(t0 * SR), len = Math.floor((open ? 0.25 : 0.06) * SR);
  for (let j = 0; j < len; j++) {
    const t = j / SR, n = noise();
    const h1 = n - hpPrev; hpPrev = n; const h2 = h1 - hpPrev2; hpPrev2 = h1;
    put(drums, i0 + j, h2 * Math.exp(-t * (open ? 14 : 70)) * 0.022 * amp, 0.25, 0.1);
  }
}
function clap(t0, amp = 1) {
  const i0 = Math.floor(t0 * SR), len = Math.floor(0.3 * SR);
  let bp1 = 0, bp2 = 0;
  const f = 2 * Math.sin(Math.PI * 1400 / SR), q = 0.9;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    const bursts = [0, 0.011, 0.023].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) * (o === 0.023 ? 18 : 120)) : 0), 0);
    const n = noise();
    bp1 += f * bp2; const hp = n - bp1 - q * bp2; bp2 += f * hp;
    put(drums, i0 + j, bp2 * bursts * 0.16 * amp, -0.1, 0.45);
  }
}
for (let b = 0; b < DURATION / BEAT; b++) {
  const t0 = b * BEAT, sec = section(t0), inBar = b % 4;
  if (sec === 'verse' || sec === 'chorus') kick(t0, sec === 'verse' ? 0.8 : 1);
  if (sec === 'verse' || sec === 'chorus' || sec === 'build') hat(t0 + BEAT / 2, sec === 'build' ? 0.8 : 1, sec === 'chorus' && inBar === 3);
  if (sec === 'chorus') { hat(t0 + BEAT / 4, 0.45); hat(t0 + 3 * BEAT / 4, 0.45); if (inBar % 2 === 1) clap(t0); }
  if (sec === 'build' && inRoll(t0)) { clap(t0, 0.5); clap(t0 + BEAT / 2, 0.6); } // redoble antes del estribillo
}
kick(44.0, 1); // golpe final

// ------------------------------------------------------- efectos sonoros
function tick(t0, amp = 1) {
  const i0 = Math.floor(t0 * SR), len = Math.floor(0.09 * SR);
  let ph = 0;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    ph += TAU * (2200 - 900 * t / 0.09) / SR;
    put(sfx, i0 + j, (Math.sin(ph) * Math.exp(-t * 60) + noise() * 0.3 * Math.exp(-t * 400)) * 0.09 * amp, 0.1, 0.2);
  }
}
function bell(t0, m, amp = 1, pan = 0) {
  const f = mtof(m), i0 = Math.floor(t0 * SR), len = Math.floor(1.6 * SR);
  let ph = 0, pm = 0;
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    pm += TAU * f * 3.5 / SR; ph += TAU * f / SR;
    const v = Math.sin(ph + 1.2 * Math.exp(-t * 6) * Math.sin(pm));
    put(sfx, i0 + j, v * Math.min(1, t / 0.003) * Math.exp(-t * 3.2) * 0.07 * amp, pan, 0.55);
  }
}
function whoosh(t0, dur, amp = 1, f0 = 300, f1 = 5000) {
  const i0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let a = 0, b = 0;
  for (let j = 0; j < len; j++) {
    const u = j / len;
    const fc = f0 * Math.pow(f1 / f0, u);
    const f = 2 * Math.sin(Math.PI * Math.min(fc, 12000) / SR), q = 0.6;
    a += f * b; const hp = noise() - a - q * b; b += f * hp;
    const env = Math.pow(Math.sin(Math.PI * u), 1.6);
    put(sfx, i0 + j, b * env * 0.12 * amp, Math.sin(u * 3) * 0.6, 0.3);
  }
}
// Intro: soplo ascendente mientras se dibuja el logo y destello al aparecer el nombre.
whoosh(CUES.logoDraw, 1.2, 0.45, 200, 3000);
[72, 76, 79, 84].forEach((m, i) => bell(1.15 + i * 0.07, m, 0.6, -0.3 + i * 0.2));
// El reto: interrogantes y consecuencias.
whoosh(CUES.problemIn - 0.2, 0.9, 0.5, 3000, 400);
CUES.questions.forEach((t, k) => bell(t, [74, 77, 72, 76][k], 0.5, -0.4 + k * 0.25));
tick(CUES.memory, 0.7);
CUES.flaws.forEach((t, k) => tick(t, 0.6 + k * 0.1));
// La solución: toques en la app, cambio de pantalla y registros que llegan al panel.
whoosh(CUES.solutionIn - 0.3, 1.0, 0.8, 300, 6000);
[11.1, 12.1, 13.0, 14.1, 15.0].forEach((t) => tick(t, 0.8));
CUES.screens.forEach((t) => whoosh(t, 0.45, 0.35, 1500, 5000));
CUES.packets.forEach((t, i) => {
  whoosh(t, CUES.travel, 0.55, 600, 7000);
  bell(t + CUES.travel, 81 + i * 2, 1.0, 0.3); bell(t + CUES.travel + 0.12, 88 + i * 2, 1.0, 0.4);
});
// Para el paciente: notificación, ventajas y calendario que se completa.
whoosh(CUES.patientIn - 0.3, 0.9, 0.6, 3000, 500);
bell(CUES.notif + 0.1, 88, 1.1, 0.1); bell(CUES.notif + 0.28, 84, 1.1, 0.1);
CUES.tiles.forEach((t, i) => { tick(t, 0.6); bell(t + 0.1, 79 + i * 3, 0.45, -0.3 + i * 0.3); });
for (let i = 0; i < 28; i++) if (i !== 9 && i !== 19) tick(CUES.adherence[0] + i * (CUES.adherence[1] - CUES.adherence[0]) / 28, 0.22);
CUES.recovered.forEach((t) => { bell(t, 86, 0.8, -0.2); bell(t + 0.32, 91, 0.7, 0.2); });
// Para el profesional: tarjetas y foco por turno.
whoosh(CUES.doctorIn - 0.4, 0.9, 0.6, 400, 6000);
CUES.cards.forEach((t) => tick(t, 0.6));
CUES.focus.forEach((t, i) => { tick(t, 0.7); bell(t + 0.15, [84, 86, 88, 91][i], 0.55, -0.3 + i * 0.2); });
bell(CUES.focus[0] + 0.5, 93, 0.5, 0.3); // "+1"
// El resultado: notas ascendentes a cada paso de la cadena.
whoosh(CUES.decisionIn - 0.4, 0.9, 0.6, 3000, 500);
CUES.nodes.forEach((t, i) => bell(t, [72, 76, 79, 84][i], 0.8, -0.45 + i * 0.3));
[84, 88, 91].forEach((m, i) => bell(CUES.nodes[3] + 0.2 + i * 0.08, m, 0.7, -0.2 + i * 0.2));
// Cierre.
whoosh(44.4, 0.9, 0.6, 3000, 400);
[77, 81, 84, 88, 89, 93].forEach((m, i) => bell(CUES.outroLogo + i * 0.11, m, 0.55, -0.5 + i * 0.2));

// -------------------------------------------------------------- mezcla
// Filtro paso-bajo resonante (SVF) con frecuencia de corte automatizada.
function lowpass(b, cutoff) {
  for (const ch of [b.L, b.R]) {
    let low = 0, band = 0;
    for (let i = 0; i < N; i++) {
      const f = 2 * Math.sin(Math.PI * Math.min(cutoff(i / SR), 16000) / SR);
      low += f * band; const high = ch[i] - low - 0.7 * band; band += f * high;
      ch[i] = low;
    }
  }
}
lowpass(pad, (t) => (t < 4 ? 500 + 900 * t / 4 : t < 10 ? 1400 + 500 * (t - 4) / 6 : t < 12 ? 1900 + 2600 * (t - 10) / 2 : t < 44 ? 4500 : 2200));
lowpass(arp, (t) => (t < 4 ? 1500 + 1500 * t / 4 : t < 10 ? 3000 : t < 12 ? 2000 + 7000 * (t - 10) / 2 : t < 38 ? 9000 : t < 40 ? 3000 + 6000 * (t - 38) / 2 : 9000));

// Compresión "sidechain": el pad y el bajo respiran con el bombo.
const duck = new Float32Array(N).fill(1);
for (const tk of kicks) {
  const i0 = Math.floor(tk * SR);
  for (let j = 0; j < 0.4 * SR && i0 + j < N; j++) duck[i0 + j] = Math.min(duck[i0 + j], 1 - 0.6 * Math.exp(-j / SR * 9));
}
for (const b of [pad, bass]) for (let i = 0; i < N; i++) { b.L[i] *= duck[i]; b.R[i] *= duck[i]; }

// Reverb tipo Freeverb (8 peines + 4 pasa-todo por canal).
function reverb(input, spread) {
  const out = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ buf: new Float32Array(d + spread), i: 0, lp: 0 }));
  const aps = [556, 441, 341, 225].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
  const fb = 0.86, damp = 0.35;
  for (let n = 0; n < N; n++) {
    const x = input[n] * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.lp = o * (1 - damp) + c.lp * damp;
      c.buf[c.i] = x + c.lp * fb;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    for (const a of aps) {
      const o = a.buf[a.i];
      a.buf[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = o - y;
    }
    out[n] = y;
  }
  return out;
}
const wetL = reverb(send.L, 0), wetR = reverb(send.R, 23);

// Suma final, saturación suave, normalización y fundidos.
const L = new Float32Array(N), R = new Float32Array(N);
const gains = { pad: 1, arp: 0.9, bass: 1, drums: 1, sfx: 1 };
for (let i = 0; i < N; i++) {
  L[i] = pad.L[i] * gains.pad + arp.L[i] * gains.arp + bass.L[i] + drums.L[i] + sfx.L[i] + wetL[i] * 2.2;
  R[i] = pad.R[i] * gains.pad + arp.R[i] * gains.arp + bass.R[i] + drums.R[i] + sfx.R[i] + wetR[i] * 2.2;
}
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.6); R[i] = Math.tanh(R[i] * 1.6);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.05, (DURATION - t) / 2.0);
  const g = norm * Math.max(0, fade) ** 1.5;
  L[i] *= g; R[i] *= g;
}

export function renderMusic() {
  const data = Buffer.alloc(44 + N * 4);
  data.write('RIFF', 0); data.writeUInt32LE(36 + N * 4, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'fluxia-marketing-50s.wav'), renderMusic());
  console.log(join(out, 'fluxia-marketing-50s.wav'));
}
