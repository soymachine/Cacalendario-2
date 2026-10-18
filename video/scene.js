// Fluxia — vídeo explicativo de 30 s (1920×1080) dibujado en <canvas>.
// renderFrame(ctx, t) es una función pura del tiempo: el mismo t produce
// siempre el mismo frame, lo que permite renderizar frame a frame con
// Playwright sin depender del reloj real.
import { WIDTH as W, HEIGHT as H, SCENES, CUES } from './timeline.js';

// ---------------------------------------------------------------- utilidades
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const spring = (x) => (x >= 1 ? 1 : x <= 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(9 * x));
// Envolvente de visibilidad de una ventana [a, b] con fundidos de entrada/salida.
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));

const C = {
  ink: '#1D2733', ink2: '#5B6675', ink3: '#97A1AD', line: '#E5E9EF',
  bg: '#F5F7FA', card: '#FFFFFF',
  blue: '#3C7DB8', blueApp: '#4F7FC0', blueL: '#EEF4FB',
  green: '#3F9E6E', greenL: '#E7F5EE', orange: '#E09F3C', orangeL: '#FCF2E2',
  red: '#D9534F', redL: '#FCE9E8', teal: '#4DA0A2', lime: '#D4D62F', violet: '#8480C9',
  sidebar: '#1C1814', sidebarActive: '#3A2E22',
};
const SEM = { green: C.green, orange: C.orange, red: C.red };
const bristolColor = (n) => (n <= 2 ? C.orange : n <= 5 ? C.green : C.red);

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
}
function rgba(h, a) { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}
function fillRR(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function strokeRR(ctx, x, y, w, h, r, stroke, lw = 1) { rr(ctx, x, y, w, h, r); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
function shadow(ctx, blur, oy, color = 'rgba(20,40,70,0.14)') {
  ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = oy;
}
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

function font(weight, size) { return `${weight} ${size}px Lexend, system-ui, sans-serif`; }
function text(ctx, str, x, y, o = {}) {
  const { size = 16, weight = 400, color = C.ink, align = 'left', baseline = 'alphabetic', maxWidth, spacing = 0 } = o;
  let s = size;
  ctx.letterSpacing = `${spacing}px`;
  ctx.font = font(weight, s);
  if (maxWidth) {
    const m = ctx.measureText(str).width;
    if (m > maxWidth) { s = size * (maxWidth / m); ctx.font = font(weight, s); }
  }
  ctx.textAlign = align; ctx.textBaseline = baseline; ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}
function measure(ctx, str, size, weight = 400) { ctx.font = font(weight, size); return ctx.measureText(str).width; }

// Helper para dibujar con transformaciones/alpha aisladas.
function layer(ctx, alpha, fn) {
  if (alpha <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; fn(); ctx.restore();
}

// ------------------------------------------------------------------- activos
export const ASSETS = { bristol: [] };
export async function loadAssets(base = '../public/') {
  const jobs = [];
  for (let n = 1; n <= 7; n++) {
    jobs.push(new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 200;
        c.getContext('2d').drawImage(img, 0, 0, 400, 200);
        ASSETS.bristol[n] = c; res();
      };
      img.onerror = rej;
      img.src = `${base}fluxia_${n}.svg`;
    }));
  }
  await Promise.all(jobs);
}
function bristolImg(ctx, n, cx, cy, w) {
  const img = ASSETS.bristol[n];
  if (img) ctx.drawImage(img, cx - w / 2, cy - w / 4, w, w / 2);
}

// --------------------------------------------------------------------- logo
// Reconstrucción vectorial del isotipo de Fluxia (public/fluxia-logo.png):
// una cinta en serpentina con degradado lima → verde → turquesa → azul.
const LOGO = (() => {
  const r = 43.25, sw = 86.5;
  const ox = 175.5, oy = 169.25;
  const rows = [212.5, 299, 385.5, 472, 558.5].map((y) => y - oy);
  const X = (x) => x - ox;
  const pieces = [
    { k: 'line', x0: X(262), x1: X(595), y: rows[0], stops: [[0, '#D9D91E', 0], [0.12, '#F0EFB2', 0.35], [0.45, '#E6E67A', 0.85], [1, '#D9D91E', 1]] },
    { k: 'arc', cx: X(595), cy: (rows[0] + rows[1]) / 2, side: 1, c0: '#D9D91E', c1: '#C2CF48' },
    { k: 'line', x0: X(595), x1: X(262), y: rows[1], stops: [[0, '#C2CF48', 1], [1, '#7DAF86', 1]] },
    { k: 'arc', cx: X(262), cy: (rows[1] + rows[2]) / 2, side: -1, c0: '#7DAF86', c1: '#5CA198' },
    { k: 'line', x0: X(262), x1: X(470), y: rows[2], stops: [[0, '#5CA198', 1], [1, '#4E8BAE', 1]] },
    { k: 'arc', cx: X(470), cy: (rows[2] + rows[3]) / 2, side: 1, c0: '#4E8BAE', c1: '#4A86AF' },
    { k: 'line', x0: X(470), x1: X(262), y: rows[3], stops: [[0, '#4A86AF', 1], [0.55, '#4470B6', 1], [1, '#7D99CD', 1]] },
    { k: 'arc', cx: X(262), cy: (rows[3] + rows[4]) / 2, side: -1, c0: '#7D99CD', c1: '#A3B7DE' },
    { k: 'line', x0: X(262), x1: X(370), y: rows[4], stops: [[0, '#A3B7DE', 1], [1, '#C9D6EE', 0]] },
  ];
  let total = 0;
  for (const p of pieces) {
    p.len = p.k === 'line' ? Math.abs(p.x1 - p.x0) : Math.PI * r;
    p.start = total; total += p.len;
  }
  return { pieces, total, r, sw, w: 505.5, h: 432.5 };
})();

function drawLogoMark(ctx, x, y, h, p = 1) {
  const s = h / LOGO.h;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const upto = LOGO.total * clamp(p);
  const half = LOGO.sw / 2;
  for (const pc of LOGO.pieces) {
    if (pc.start >= upto) break;
    const f = clamp((upto - pc.start) / pc.len);
    if (pc.k === 'line') {
      const g = ctx.createLinearGradient(pc.x0, 0, pc.x1, 0);
      for (const [o, col, a] of pc.stops) g.addColorStop(o, rgba(col, a));
      const xe = lerp(pc.x0, pc.x1, f);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(pc.x0, xe) - 0.5, pc.y - half, Math.abs(xe - pc.x0) + 1, LOGO.sw);
    } else {
      // semidisco con degradado cónico (sin costuras entre porciones)
      const R = LOGO.r + half;
      const g = ctx.createConicGradient(pc.side === 1 ? -Math.PI / 2 : Math.PI / 2, pc.cx, pc.cy);
      if (pc.side === 1) { g.addColorStop(0, pc.c0); g.addColorStop(0.5, pc.c1); g.addColorStop(1, pc.c0); }
      else { g.addColorStop(0, pc.c1); g.addColorStop(0.5, pc.c0); g.addColorStop(1, pc.c1); }
      ctx.fillStyle = g;
      // se solapa ~2 px con las franjas rectas para tapar la costura de antialiasing
      const ov = 0.025, end = f >= 1 ? ov : 0;
      ctx.beginPath(); ctx.moveTo(pc.cx - pc.side * 2, pc.cy);
      if (pc.side === 1) ctx.arc(pc.cx, pc.cy, R, -Math.PI / 2 - ov, -Math.PI / 2 + Math.PI * f + end);
      else ctx.arc(pc.cx, pc.cy, R, -Math.PI / 2 + ov, -Math.PI / 2 - Math.PI * f - end, true);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
  return LOGO.w * s;
}

// Logo completo (isotipo + "Fluxia"). Devuelve el ancho total.
function drawLogo(ctx, x, y, h, { p = 1, word = 1, color = '#383838', wordShift = 0 } = {}) {
  const mw = drawLogoMark(ctx, x, y, h, p);
  const fs = h * 0.9;
  layer(ctx, word, () => {
    text(ctx, 'Fluxia', x + mw + h * 0.26 + wordShift, y + h * 0.86, { size: fs, weight: 600, color, spacing: -fs * 0.01 });
  });
  return mw + h * 0.26 + measure(ctx, 'Fluxia', fs, 600);
}

// ------------------------------------------------------------------ fondo
function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#F7FAFC'); g.addColorStop(1, '#EDF2F8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const blobs = [
    [C.lime, 0.20, 260, 180, 520, 0.13, 0],
    ['#78AD89', 0.16, 1650, 260, 560, 0.10, 1.7],
    [C.teal, 0.14, 1500, 930, 620, 0.09, 3.1],
    [C.blue, 0.13, 330, 960, 600, 0.11, 4.4],
    [C.violet, 0.07, 980, 520, 700, 0.07, 2.2],
  ];
  for (const [col, a, bx, by, r, sp, ph] of blobs) {
    const x = bx + Math.sin(t * sp * 2 + ph) * 70;
    const y = by + Math.cos(t * sp * 1.6 + ph) * 50;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(col, a)); rg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  // rejilla de puntos muy sutil
  ctx.fillStyle = 'rgba(40,70,110,0.045)';
  const off = (t * 6) % 40;
  for (let y = -40 + off; y < H; y += 40) for (let x = 20; x < W; x += 40) ctx.fillRect(x, y, 2, 2);
}

// ---------------------------------------------------------------- textos
// Bloque de texto lateral con entrada escalonada.
function drawCaption(ctx, t, a, b, o) {
  const { x, y, eyebrow, color, title, body = [], bullets = [], align = 'left', width = 520 } = o;
  const items = [];
  let cy = y;
  items.push({ kind: 'eyebrow', y: cy }); cy += 64;
  for (const line of title) { cy += 58; items.push({ kind: 'title', y: cy, s: line }); }
  cy += 18;
  for (const line of body) { cy += 34; items.push({ kind: 'body', y: cy, s: line }); }
  if (bullets.length) cy += 22;
  for (const line of bullets) { cy += 44; items.push({ kind: 'bullet', y: cy, s: line }); }
  const out = 1 - eio(prog(t, b - 0.45, b));
  items.forEach((it, i) => {
    const e = eo(prog(t, a + i * 0.09, a + i * 0.09 + 0.6));
    const alpha = e * out;
    if (alpha <= 0) return;
    layer(ctx, alpha, () => {
      ctx.translate(0, (1 - e) * 26 - (1 - out) * 14);
      if (it.kind === 'eyebrow') {
        const w = measure(ctx, eyebrow, 15, 600) + 2.4 * eyebrow.length + 36;
        const ex = align === 'center' ? x - w / 2 : x;
        fillRR(ctx, ex, it.y, w, 38, 19, rgba(color, 0.13));
        ctx.beginPath(); ctx.arc(ex + 18, it.y + 19, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        text(ctx, eyebrow, ex + 32, it.y + 25, { size: 15, weight: 600, color: mix(color, '#1D2733', 0.35), spacing: 2.4 });
      } else if (it.kind === 'title') {
        text(ctx, it.s, x, it.y, { size: 50, weight: 600, color: C.ink, align, maxWidth: width, spacing: -0.8 });
      } else if (it.kind === 'body') {
        text(ctx, it.s, x, it.y, { size: 23, weight: 300, color: C.ink2, align, maxWidth: width });
      } else {
        ctx.beginPath(); ctx.arc(x + 13, it.y - 8, 13, 0, Math.PI * 2); ctx.fillStyle = rgba(color, 0.16); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x + 7.5, it.y - 8); ctx.lineTo(x + 11.5, it.y - 4); ctx.lineTo(x + 18.5, it.y - 12); ctx.stroke();
        text(ctx, it.s, x + 40, it.y, { size: 21, weight: 400, color: C.ink, maxWidth: width - 40 });
      }
    });
  });
}

// --------------------------------------------------------------- iconos
function iconCheck(ctx, cx, cy, s, color, lw = 3, p = 1) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const a = [cx - s * 0.45, cy + s * 0.02], b = [cx - s * 0.12, cy + s * 0.34], c = [cx + s * 0.5, cy - s * 0.32];
  const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const d = (l1 + l2) * clamp(p);
  ctx.beginPath(); ctx.moveTo(...a);
  if (d <= l1) ctx.lineTo(lerp(a[0], b[0], d / l1), lerp(a[1], b[1], d / l1));
  else { ctx.lineTo(...b); const f = (d - l1) / l2; ctx.lineTo(lerp(b[0], c[0], f), lerp(b[1], c[1], f)); }
  ctx.stroke(); ctx.restore();
}
function iconPoop(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.32, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.08, s * 0.38, s * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.02, cy - s * 0.14, s * 0.25, s * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.05, cy - s * 0.25); ctx.quadraticCurveTo(cx + s * 0.15, cy - s * 0.4, cx + s * 0.05, cy - s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.25, cy - s * 0.35, cx + s * 0.18, cy - s * 0.2); ctx.fill();
}
function iconDrop(ctx, cx, cy, s, color, lw = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 0.1, cy - s * 0.3, cx + s * 0.35, cy - s * 0.05, cx + s * 0.35, cy + s * 0.15);
  ctx.arc(cx, cy + s * 0.15, s * 0.35, 0, Math.PI);
  ctx.bezierCurveTo(cx - s * 0.35, cy - s * 0.05, cx - s * 0.1, cy - s * 0.3, cx, cy - s * 0.5);
  ctx.stroke();
}
function iconBell(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy + s * 0.25);
  ctx.quadraticCurveTo(cx - s * 0.3, cy + s * 0.1, cx - s * 0.3, cy - s * 0.1);
  ctx.arc(cx, cy - s * 0.1, s * 0.3, Math.PI, 0);
  ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.1, cx + s * 0.42, cy + s * 0.25);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy + s * 0.34, s * 0.1, 0, Math.PI * 2); ctx.fill();
}
function iconPdf(ctx, x, y, w, h) {
  const f = w * 0.28;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - f, y); ctx.lineTo(x + w, y + f); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#D5DBE3'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#E9EDF2'; ctx.beginPath(); ctx.moveTo(x + w - f, y); ctx.lineTo(x + w - f, y + f); ctx.lineTo(x + w, y + f); ctx.closePath(); ctx.fill();
  fillRR(ctx, x - w * 0.12, y + h * 0.52, w * 0.78, h * 0.26, 5, C.red);
  text(ctx, 'PDF', x + w * 0.27, y + h * 0.71, { size: h * 0.17, weight: 700, color: '#fff', align: 'center' });
  ctx.fillStyle = '#E3E8EE';
  for (let i = 0; i < 3; i++) ctx.fillRect(x + w * 0.14, y + h * (0.2 + i * 0.1), w * (0.55 - i * 0.1), 3);
}
function cursorArrow(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - press * 0.12), s * (1 - press * 0.12));
  shadow(ctx, 8, 3, 'rgba(0,0,0,0.25)');
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 23); ctx.lineTo(5.6, 17.6); ctx.lineTo(9.6, 26.4); ctx.lineTo(13.4, 24.8); ctx.lineTo(9.6, 16.2); ctx.lineTo(17, 16.2); ctx.closePath();
  ctx.fillStyle = '#111'; ctx.fill(); noShadow(ctx);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function ripple(ctx, x, y, t, t0, color, r0 = 10, r1 = 46) {
  const p = prog(t, t0, t0 + 0.55);
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha *= (1 - p);
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, lerp(r0, r1, eo(p)), 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = rgba('#FFFFFF', 0); ctx.restore();
}

// Interpolación por tramos de una trayectoria [[t, x, y], ...]
function path(t, keys) {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i];
      const e = eio((t - t0) / (t1 - t0));
      return [lerp(x0, x1, e), lerp(y0, y1, e)];
    }
  }
  const k = keys[keys.length - 1];
  return [k[1], k[2]];
}

// ============================================================ APP PACIENTE
const PHONE = { w: 440, h: 900, sw: 412, sh: 872 };
const TILE = { size: 96, gap: 10, x0: 52, y0: 352 };
function tilePos(n) {
  // posiciones 1..7 en rejilla de 3 columnas (el 7 centrado en la 3ª fila)
  const i = n - 1;
  const col = n === 7 ? 1 : i % 3, row = Math.floor(i / 3);
  return [TILE.x0 + col * (TILE.size + TILE.gap), TILE.y0 + row * (TILE.size + TILE.gap)];
}
const SAVE_BTN = { x: 28, y: 690, w: 356, h: 58 };
const TOUCH_KEYS = [
  [4.7, 330, 900], [5.3, 100, 506], [6.5, 100, 506], [7.1, 206, 719], [7.6, 206, 719], [8.2, 300, 900],
];

function drawPatientScreen(ctx, t) {
  const sw = PHONE.sw, sh = PHONE.sh;
  ctx.fillStyle = '#F2F2F5'; ctx.fillRect(0, 0, sw, sh);

  // barra de estado + isla
  text(ctx, '09:12', 44, 46, { size: 17, weight: 600, color: '#111' });
  fillRR(ctx, sw / 2 - 62, 16, 124, 36, 18, '#000');
  ctx.fillStyle = '#111';
  for (let i = 0; i < 4; i++) ctx.fillRect(300 + i * 6, 44 - (i + 1) * 3.2, 4, (i + 1) * 3.2);
  strokeRR(ctx, 336, 32, 30, 14, 4, '#111', 1.4); fillRR(ctx, 338.5, 34.5, 20, 9, 2, '#111');

  // cabecera con logo
  const lw = drawLogo(ctx, -1000, -1000, 34); // sólo para medir
  drawLogo(ctx, (sw - lw) / 2, 82, 34);

  text(ctx, 'Registro', 28, 172, { size: 30, weight: 700, color: '#111' });
  text(ctx, 'VIERNES, 17 de octubre 09:12', 28, 204, { size: 14, weight: 600, color: '#333' });
  ctx.beginPath(); ctx.arc(370, 199, 16, 0, Math.PI * 2); ctx.fillStyle = '#E7ECF5'; ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(364, 205); ctx.lineTo(375, 194); ctx.stroke();

  // selector deposición / micción
  fillRR(ctx, 24, 228, 364, 62, 31, C.blueApp);
  fillRR(ctx, 28, 232, 180, 54, 27, '#fff');
  ctx.beginPath(); ctx.arc(118, 259, 19, 0, Math.PI * 2); ctx.strokeStyle = C.blueApp; ctx.lineWidth = 2; ctx.stroke();
  iconPoop(ctx, 118, 260, 24, C.blueApp);
  ctx.beginPath(); ctx.arc(297, 259, 19, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  iconDrop(ctx, 297, 257, 20, '#fff', 2);

  text(ctx, 'Forma', 36, 332, { size: 15, weight: 600, color: '#111' });

  // rejilla escala de Bristol
  const sel = prog(t, CUES.tapBristol, CUES.tapBristol + 0.25);
  for (let n = 1; n <= 7; n++) {
    const [x, y] = tilePos(n);
    const isSel = n === 4 && sel > 0;
    const pop = isSel ? 1 + 0.08 * Math.sin(Math.PI * sel) : 1;
    const press = n === 4 ? (1 - 0.06 * Math.sin(Math.PI * prog(t, CUES.tapBristol - 0.12, CUES.tapBristol + 0.08))) : 1;
    ctx.save();
    ctx.translate(x + TILE.size / 2, y + TILE.size / 2); ctx.scale(pop * press, pop * press);
    fillRR(ctx, -48, -48, 96, 96, 14, isSel ? mix('#DEDEE2', '#DCE8F6', sel) : '#DEDEE2');
    if (isSel) strokeRR(ctx, -46.5, -46.5, 93, 93, 13, rgba(C.blueApp, sel), 3);
    bristolImg(ctx, n, 0, 0, 74);
    ctx.restore();
    // etiqueta del tipo seleccionado
    if (isSel) layer(ctx, sel, () => {
      fillRR(ctx, x + 62, y - 8, 40, 24, 12, C.blueApp);
      text(ctx, 'T4', x + 82, y + 9, { size: 12, weight: 700, color: '#fff', align: 'center' });
    });
  }

  // botón guardar (aparece tras elegir)
  const bIn = back(prog(t, 5.9, 6.4));
  const bPress = 1 - 0.05 * Math.sin(Math.PI * prog(t, CUES.tapSave - 0.12, CUES.tapSave + 0.1));
  layer(ctx, clamp(bIn * 1.4), () => {
    ctx.save();
    const { x, y, w, h } = SAVE_BTN;
    ctx.translate(x + w / 2, y + h / 2 + (1 - bIn) * 30); ctx.scale(bPress, bPress);
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, '#4DA078'); g.addColorStop(1, C.blue);
    shadow(ctx, 16, 6, 'rgba(60,125,184,0.35)');
    fillRR(ctx, -w / 2, -h / 2, w, h, h / 2, g); noShadow(ctx);
    text(ctx, 'Guardar registro', 0, 7, { size: 18, weight: 600, color: '#fff', align: 'center' });
    ctx.restore();
  });

  // barra de pestañas
  fillRR(ctx, 20, 772, 372, 72, 36, '#0D1117');
  ctx.fillStyle = '#fff';
  [[60, 10], [69, 18], [78, 26]].forEach(([x, hh]) => ctx.fillRect(x, 820 - hh, 6, hh));
  ctx.fillRect(56, 822, 32, 2.5);
  strokeRR(ctx, 330, 793, 30, 30, 8, '#fff', 2.2);
  ctx.beginPath(); ctx.arc(345, 804, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(345, 820, 9, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(206, 808, 42, 0, Math.PI * 2); ctx.fillStyle = '#0D1117'; ctx.fill();
  ctx.beginPath(); ctx.arc(206, 808, 36, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  strokeRR(ctx, 194, 788, 24, 18, 5, C.blueApp, 2.4);
  ctx.beginPath(); ctx.ellipse(206, 816, 14, 9, 0, 0, Math.PI * 2); ctx.strokeStyle = C.blueApp; ctx.stroke();
  fillRR(ctx, 146, 856, 120, 5, 3, '#111');

  // dedo / indicador de toque
  const touchA = win(t, 4.7, 8.2, 0.3, 0.4);
  if (touchA > 0) {
    const [tx, ty] = path(t, TOUCH_KEYS);
    const pressing = Math.max(
      Math.sin(Math.PI * prog(t, CUES.tapBristol - 0.12, CUES.tapBristol + 0.12)),
      Math.sin(Math.PI * prog(t, CUES.tapSave - 0.12, CUES.tapSave + 0.12)));
    layer(ctx, touchA, () => {
      ctx.beginPath(); ctx.arc(tx, ty, 26 - pressing * 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(30,40,60,${0.18 + pressing * 0.14})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      ripple(ctx, tx, ty, t, CUES.tapBristol, C.blueApp);
      ripple(ctx, tx, ty, t, CUES.tapSave, '#ffffff');
    });
  }

  // confirmación de guardado
  const ov = prog(t, CUES.saved, CUES.saved + 0.35);
  if (ov > 0) {
    ctx.fillStyle = `rgba(246,248,251,${0.97 * ov})`; ctx.fillRect(0, 60, sw, sh - 60);
    const c = back(prog(t, CUES.saved + 0.05, CUES.saved + 0.5));
    layer(ctx, ov, () => {
      ctx.beginPath(); ctx.arc(sw / 2, 330, 96 * c, 0, Math.PI * 2); ctx.fillStyle = rgba(C.green, 0.12); ctx.fill();
      ctx.beginPath(); ctx.arc(sw / 2, 330, 64 * c, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
      iconCheck(ctx, sw / 2, 330, 56, '#fff', 8, prog(t, CUES.saved + 0.3, CUES.saved + 0.65));
    });
    const tx1 = eo(prog(t, CUES.saved + 0.35, CUES.saved + 0.8));
    layer(ctx, tx1, () => {
      ctx.translate(0, (1 - tx1) * 14);
      text(ctx, '¡Registro guardado!', sw / 2, 470, { size: 26, weight: 700, color: C.ink, align: 'center' });
      text(ctx, 'Tu profesional ya puede verlo', sw / 2, 504, { size: 16, weight: 400, color: C.ink2, align: 'center' });
    });
    const tx2 = eo(prog(t, CUES.saved + 0.65, CUES.saved + 1.1));
    layer(ctx, tx2, () => {
      ctx.translate(0, (1 - tx2) * 18);
      shadow(ctx, 18, 6, 'rgba(20,40,70,0.08)');
      fillRR(ctx, 40, 548, sw - 80, 112, 20, '#fff'); noShadow(ctx);
      text(ctx, 'Racha actual', 64, 584, { size: 14, weight: 500, color: C.ink2 });
      text(ctx, '7 días seguidos', sw - 64, 584, { size: 14, weight: 700, color: C.green, align: 'right' });
      const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      for (let i = 0; i < 7; i++) {
        const cx = 76 + i * 43, f = back(prog(t, CUES.saved + 0.8 + i * 0.08, CUES.saved + 1.1 + i * 0.08));
        ctx.beginPath(); ctx.arc(cx, 620, 14, 0, Math.PI * 2); ctx.fillStyle = '#EEF1F5'; ctx.fill();
        if (f > 0) { ctx.beginPath(); ctx.arc(cx, 620, 14 * f, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); }
        text(ctx, days[i], cx, 625, { size: 11, weight: 600, color: f > 0.5 ? '#fff' : C.ink3, align: 'center' });
      }
      text(ctx, 'Te recordaremos si se te olvida un día', sw / 2, 650, { size: 11, weight: 400, color: C.ink3, align: 'center' });
    });
  }
}

function drawPhone(ctx, t, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s);
  const { w, h, sw, sh } = PHONE;
  shadow(ctx, 70, 34, 'rgba(15,30,55,0.28)');
  fillRR(ctx, -w / 2, -h / 2, w, h, 72, '#1A1C20'); noShadow(ctx);
  strokeRR(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 70, '#4A4E56', 2.5);
  // botones laterales
  fillRR(ctx, -w / 2 - 4, -h / 2 + 190, 5, 60, 2, '#2A2C31');
  fillRR(ctx, -w / 2 - 4, -h / 2 + 270, 5, 60, 2, '#2A2C31');
  fillRR(ctx, w / 2 - 1, -h / 2 + 230, 5, 96, 2, '#2A2C31');
  ctx.save();
  rr(ctx, -sw / 2, -sh / 2, sw, sh, 58); ctx.clip();
  ctx.translate(-sw / 2, -sh / 2);
  drawPatientScreen(ctx, t);
  ctx.restore();
  ctx.restore();
}

// Tarjeta flotante de anotación junto al móvil.
function annotation(ctx, t, t0, t1, x, y, title, sub, iconFn, color, ax, ay) {
  const e = back(prog(t, t0, t0 + 0.5)), a = win(t, t0, t1, 0.3, 0.35);
  if (a <= 0) return;
  layer(ctx, a, () => {
    if (ax !== undefined) {
      ctx.strokeStyle = rgba(color, 0.6); ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.lineTo(lerp(x, ax, eo(prog(t, t0, t0 + 0.6))), lerp(y + 40, ay, eo(prog(t, t0, t0 + 0.6)))); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(ax, ay, 6 * eo(prog(t, t0 + 0.4, t0 + 0.7)), 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    }
    ctx.translate(x, y + 40); ctx.scale(e, e);
    const w = 300, hh = 80;
    shadow(ctx, 30, 12, 'rgba(20,40,70,0.13)');
    fillRR(ctx, 0, -hh / 2, w, hh, 20, 'rgba(255,255,255,0.96)'); noShadow(ctx);
    ctx.beginPath(); ctx.arc(40, 0, 22, 0, Math.PI * 2); ctx.fillStyle = rgba(color, 0.14); ctx.fill();
    iconFn(40, 0);
    text(ctx, title, 76, -4, { size: 18, weight: 600, color: C.ink });
    text(ctx, sub, 76, 20, { size: 14, weight: 400, color: C.ink2 });
  });
}

// ========================================================== PANEL MÉDICO
const VW = 1280, VH = 768;
const PATIENTS = [
  { name: 'José Gil', mail: 'jose.gil@gmail.com', last: 'Hace 18 días', sem: 'red', tags: ['en tratamiento'], trend: [4, 5, 6, 6, 7, 6, 7] },
  { name: 'Laura Gómez', mail: 'laura.gomez@gmail.com', last: 'Hace 3 días', sem: 'orange', tags: ['nuevo'], trend: [3, 2, 3, 3, 4, 3, 4], live: true },
  { name: 'Antonio Pérez', mail: 'a.perez@outlook.es', last: 'Hace 4 días', sem: 'orange', tags: ['post-cirugía'], trend: [2, 2, 3, 2, 2, 3, 2] },
  { name: 'Carmen Ruiz', mail: 'carmen.ruiz@gmail.com', last: 'Hoy, 08:40', sem: 'green', tags: ['suelo pélvico'], trend: [4, 4, 5, 4, 4, 4, 5] },
  { name: 'Lucía Martín', mail: 'lucia.m@gmail.com', last: 'Ayer, 21:15', sem: 'green', tags: [], trend: [3, 4, 4, 5, 4, 4, 4] },
  { name: 'Pedro Sanz', mail: 'pedro.sanz@yahoo.es', last: 'Hace 2 días', sem: 'green', tags: ['dieta FODMAP'], trend: [5, 4, 4, 3, 4, 4, 3] },
];
const ROW = { y0: 268, h: 74 };
const rowY = (i) => ROW.y0 + i * ROW.h;
const SEM_LABEL = { green: 'Al día', orange: 'Atención', red: 'Sin registros' };
const avatarColors = ['#8480C9', '#4DA0A2', '#E09F3C', '#3C7DB8', '#4DA078', '#C2689B'];

function drawSidebar(ctx) {
  ctx.fillStyle = C.sidebar; ctx.fillRect(0, 0, 230, VH);
  fillRR(ctx, 16, 16, 198, 70, 12, '#fff');
  const lw = drawLogo(ctx, -999, -999, 32);
  drawLogo(ctx, 16 + (198 - lw) / 2, 35, 32);
  text(ctx, 'Clínica Santa Clara', 115, 112, { size: 13, weight: 600, color: C.orange, align: 'center' });
  text(ctx, 'Dra. Marta Ruiz', 115, 130, { size: 11, weight: 400, color: '#A39A90', align: 'center' });
  text(ctx, 'MENÚ PRINCIPAL', 22, 170, { size: 10, weight: 500, color: '#7A7068', spacing: 1.2 });
  const items = ['Inicio', 'Pacientes', 'Invitar paciente', 'Configuración', 'Guía de uso'];
  items.forEach((s, i) => {
    const y = 186 + i * 42;
    if (i === 1) fillRR(ctx, 12, y, 206, 36, 8, C.sidebarActive);
    fillRR(ctx, 26, y + 11, 14, 14, 4, i === 1 ? C.orange : '#8D8378');
    text(ctx, s, 52, y + 23, { size: 14, weight: i === 1 ? 600 : 400, color: i === 1 ? C.orange : '#E8E2DA' });
  });
  ctx.fillStyle = '#2C2620'; ctx.fillRect(16, 688, 198, 1);
  ctx.beginPath(); ctx.arc(38, 724, 16, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
  text(ctx, 'M', 38, 729, { size: 14, weight: 700, color: '#fff', align: 'center' });
  text(ctx, 'Dra. Marta Ruiz', 62, 721, { size: 12, weight: 600, color: '#F2ECE4' });
  text(ctx, 'Digestivo', 62, 737, { size: 11, weight: 400, color: '#8D8378' });
  fillRR(ctx, 168, 708, 34, 18, 9, C.lime);
  text(ctx, 'PRO', 185, 721, { size: 10, weight: 700, color: '#2B2B10', align: 'center' });
}

function sparkline(ctx, x, y, w, h, vals, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  vals.forEach((v, i) => {
    const px = x + (i / (vals.length - 1)) * w, py = y + h - ((v - 1) / 6) * h;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.stroke();
  const lv = vals[vals.length - 1];
  ctx.beginPath(); ctx.arc(x + w, y + h - ((lv - 1) / 6) * h, 3.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}

function semPill(ctx, x, y, sem, label, pulse = 0) {
  const col = SEM[sem];
  const w = measure(ctx, label, 12, 600) + 38;
  fillRR(ctx, x, y - 14, w, 28, 14, rgba(col, 0.13));
  if (pulse > 0 && pulse < 1) {
    ctx.beginPath(); ctx.arc(x + 15, y, 5 + pulse * 16, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, 0.35 * (1 - pulse)); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x + 15, y, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  text(ctx, label, x + 27, y + 4.5, { size: 12, weight: 600, color: mix(col, '#1D2733', 0.25) });
}

function tag(ctx, x, y, s) {
  const w = measure(ctx, s, 11, 500) + 20;
  fillRR(ctx, x, y - 12, w, 24, 12, '#F0EEFB');
  text(ctx, s, x + 10, y + 4, { size: 11, weight: 500, color: '#5B55A8' });
  return w;
}

function drawPatientList(ctx, t) {
  const arrived = prog(t, CUES.packetArrive, CUES.packetArrive + 0.4);
  // cabecera
  text(ctx, 'Pacientes', 262, 60, { size: 28, weight: 700, color: C.ink });
  text(ctx, '12 pacientes vinculados · actualizado en tiempo real', 262, 86, { size: 13, weight: 400, color: '#6B7280' });
  fillRR(ctx, 1066, 36, 184, 40, 20, C.ink);
  text(ctx, '+  Invitar paciente', 1158, 61, { size: 13, weight: 600, color: '#fff', align: 'center' });

  // tarjetas resumen
  const cards = [
    { label: 'Al día', v0: 8, v1: 9, col: C.green },
    { label: 'Atención', v0: 3, v1: 2, col: C.orange },
    { label: 'Sin registrar +7 días', v0: 1, v1: 1, col: C.red },
    { label: 'Registros hoy', v0: 14, v1: 15, col: C.blue },
  ];
  cards.forEach((c, i) => {
    const x = 262 + i * 250, y = 108;
    shadow(ctx, 14, 3, 'rgba(20,40,70,0.06)');
    fillRR(ctx, x, y, 234, 88, 14, '#fff'); noShadow(ctx);
    fillRR(ctx, x, y + 16, 4, 56, 2, c.col);
    text(ctx, c.label, x + 22, y + 32, { size: 12, weight: 500, color: '#6B7280' });
    const changed = c.v0 !== c.v1;
    const v = changed && arrived > 0.5 ? c.v1 : c.v0;
    const bump = changed ? Math.sin(Math.PI * arrived) : 0;
    ctx.save(); ctx.translate(x + 22, y + 70); ctx.scale(1 + bump * 0.18, 1 + bump * 0.18);
    text(ctx, String(v), 0, 0, { size: 30, weight: 700, color: changed && arrived > 0 ? mix(C.ink, c.col, bump) : C.ink });
    ctx.restore();
  });

  // tabla
  shadow(ctx, 18, 4, 'rgba(20,40,70,0.06)');
  fillRR(ctx, 262, 214, 988, 530, 16, '#fff'); noShadow(ctx);
  const hy = 248;
  [['PACIENTE', 290], ['ÚLTIMO REGISTRO', 580], ['TENDENCIA BRISTOL', 770], ['ESTADO', 950], ['ETIQUETAS', 1090]].forEach(([s, x]) =>
    text(ctx, s, x, hy, { size: 10, weight: 600, color: '#9AA3AE', spacing: 1 }));
  ctx.fillStyle = C.line; ctx.fillRect(262, 260, 988, 1);

  const hoverRed = win(t, CUES.hoverRed, 18.3, 0.2, 0.3);
  const hoverLaura = win(t, 18.9, 20.2, 0.2, 0.2);
  PATIENTS.forEach((p, i) => {
    const y = rowY(i), cy = y + ROW.h / 2;
    const live = p.live && arrived > 0;
    if (i === 0 && hoverRed > 0) { ctx.fillStyle = rgba(C.red, 0.06 * hoverRed); ctx.fillRect(263, y, 986, ROW.h); }
    if (p.live && hoverLaura > 0) { ctx.fillStyle = rgba(C.blue, 0.06 * hoverLaura); ctx.fillRect(263, y, 986, ROW.h); }
    if (live) {
      const flash = 1 - prog(t, CUES.packetArrive + 0.2, CUES.packetArrive + 2.6);
      ctx.fillStyle = rgba(C.green, 0.13 * flash * arrived); ctx.fillRect(263, y, 986, ROW.h);
      fillRR(ctx, 263, y + 8, 4, ROW.h - 16, 2, rgba(C.green, flash));
    }
    if (i < PATIENTS.length - 1) { ctx.fillStyle = '#F0F2F5'; ctx.fillRect(282, y + ROW.h, 948, 1); }
    ctx.beginPath(); ctx.arc(306, cy, 18, 0, Math.PI * 2); ctx.fillStyle = rgba(avatarColors[i], 0.18); ctx.fill();
    const ini = p.name.split(' ').map((w) => w[0]).join('');
    text(ctx, ini, 306, cy + 4.5, { size: 12, weight: 700, color: avatarColors[i], align: 'center' });
    text(ctx, p.name, 336, cy - 2, { size: 14, weight: 600, color: C.ink });
    text(ctx, p.mail, 336, cy + 16, { size: 11, weight: 400, color: '#8A94A0' });
    // último registro (con cambio en directo para Laura)
    if (p.live) {
      layer(ctx, 1 - arrived, () => text(ctx, p.last, 580, cy + 5, { size: 13, weight: 500, color: C.ink2 }));
      layer(ctx, arrived, () => {
        text(ctx, 'Ahora mismo', 580, cy + 5 - (1 - arrived) * 8, { size: 13, weight: 700, color: C.green });
      });
    } else text(ctx, p.last, 580, cy + 5, { size: 13, weight: 500, color: p.sem === 'red' ? C.red : C.ink2 });
    const trend = live ? [...p.trend.slice(1), 4] : p.trend;
    sparkline(ctx, 770, cy - 14, 120, 28, trend, '#7B8794');
    const sem = live && arrived > 0.5 ? 'green' : p.sem;
    semPill(ctx, 950, cy, sem, SEM_LABEL[sem], live ? prog(t, CUES.packetArrive, CUES.packetArrive + 1.0) : (i === 0 ? (t * 0.8) % 1 : 0));
    let tx = 1090;
    for (const s of p.tags) tx += tag(ctx, tx, cy, s) + 6;
  });

  // tooltip sobre el paciente en rojo
  if (hoverRed > 0) layer(ctx, hoverRed, () => {
    const x = 760, y = rowY(0) + 66;
    shadow(ctx, 20, 6, 'rgba(0,0,0,0.18)');
    fillRR(ctx, x, y, 300, 62, 12, C.ink); noShadow(ctx);
    ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + 50, y - 9); ctx.lineTo(x + 60, y); ctx.fillStyle = C.ink; ctx.fill();
    text(ctx, '18 días sin registrar', x + 18, y + 26, { size: 14, weight: 600, color: '#fff' });
    text(ctx, 'Umbral rojo: 7 días · recordatorio enviado', x + 18, y + 46, { size: 11, weight: 400, color: '#B8C2CE' });
  });

  // aviso "nuevo registro"
  const ty = eo(prog(t, CUES.packetArrive + 0.05, CUES.packetArrive + 0.5)) - eio(prog(t, CUES.packetArrive + 3.0, CUES.packetArrive + 3.4));
  if (ty > 0) layer(ctx, clamp(ty * 1.5), () => {
    const x = 900, y = lerp(-80, 18, ty);
    shadow(ctx, 26, 10, 'rgba(20,40,70,0.18)');
    fillRR(ctx, x, y, 350, 70, 14, '#fff'); noShadow(ctx);
    fillRR(ctx, x, y, 6, 70, 3, C.green);
    ctx.beginPath(); ctx.arc(x + 40, y + 35, 18, 0, Math.PI * 2); ctx.fillStyle = C.greenL; ctx.fill();
    iconBell(ctx, x + 40, y + 35, 22, C.green);
    text(ctx, 'Nuevo registro', x + 70, y + 30, { size: 14, weight: 700, color: C.ink });
    text(ctx, 'Laura Gómez · Bristol tipo 4 · 09:12', x + 70, y + 50, { size: 12, weight: 400, color: C.ink2 });
  });
}

const CAL_LOGGED = { 1: 4, 2: 3, 3: 4, 5: 2, 6: 3, 7: 4, 8: 4, 9: 5, 10: 4, 11: 2, 12: 3, 13: 4, 14: 3, 15: 4, 16: 4, 17: 4 };
const HIST = [
  ['17 oct 2026', '09:12', 4, [], true],
  ['16 oct 2026', '20:47', 4, ['Sin dolor']],
  ['15 oct 2026', '08:31', 4, []],
  ['14 oct 2026', '21:05', 3, ['Hinchazón']],
  ['13 oct 2026', '09:40', 4, []],
];
const TREND = [3, 2, 3, 2, 2, 3, 4, 3, 3, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4, 4, 4];

function card(ctx, x, y, w, h, title) {
  shadow(ctx, 18, 4, 'rgba(20,40,70,0.06)');
  fillRR(ctx, x, y, w, h, 16, '#fff'); noShadow(ctx);
  if (title) text(ctx, title, x + 20, y + 32, { size: 14, weight: 700, color: C.ink });
}

function drawPatientDetail(ctx, t) {
  const t0 = SCENES.detail[0] + 0.4; // inicio de las animaciones internas
  text(ctx, '←  Pacientes', 262, 34, { size: 12, weight: 500, color: '#8A94A0' });
  text(ctx, 'Laura Gómez', 262, 70, { size: 28, weight: 700, color: C.ink });
  text(ctx, 'laura.gomez@gmail.com · Vinculada 2 sep 2026', 262, 94, { size: 12, weight: 400, color: '#8A94A0' });
  const press = Math.sin(Math.PI * prog(t, CUES.exportPdf - 0.1, CUES.exportPdf + 0.12));
  ctx.save(); ctx.translate(1155, 66); ctx.scale(1 - press * 0.06, 1 - press * 0.06);
  fillRR(ctx, -95, -20, 190, 40, 20, C.ink);
  iconPdf(ctx, -80, -10, 14, 19);
  text(ctx, 'Exportar informe PDF', 10, 5, { size: 12, weight: 600, color: '#fff', align: 'center' });
  ctx.restore();
  strokeRR(ctx, 920, 46, 120, 40, 20, '#D3D9E1', 1.5);
  text(ctx, 'Configuración', 980, 71, { size: 12, weight: 500, color: C.ink, align: 'center' });

  // estado
  card(ctx, 262, 112, 988, 52);
  ctx.beginPath(); ctx.arc(290, 138, 9, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
  const pr = (t * 0.9) % 1;
  ctx.beginPath(); ctx.arc(290, 138, 9 + pr * 10, 0, Math.PI * 2); ctx.fillStyle = rgba(C.green, 0.3 * (1 - pr)); ctx.fill();
  text(ctx, 'Ahora mismo', 310, 143, { size: 14, weight: 700, color: C.ink });
  text(ctx, '· 17 oct 2026, 09:12', 410, 143, { size: 12, weight: 400, color: '#8A94A0' });
  text(ctx, 'Registro al día · 7 días seguidos', 560, 143, { size: 12, weight: 600, color: C.green });
  tag(ctx, 1110, 138, 'nuevo');
  tag(ctx, 1170, 138, 'SII');

  // estadísticas
  card(ctx, 262, 178, 380, 240, 'Estadísticas');
  const cu = eo(prog(t, t0, t0 + 1.4));
  [['34', Math.round(34 * cu), 'Registros'], ['3.9', (3.9 * cu).toFixed(1), 'Bristol medio'], ['0', '0', 'Días sin reg.']].forEach(([, v, l], i) => {
    const x = 282 + i * 118;
    fillRR(ctx, x, 200 + 18, 104, 66, 10, '#F5F7FA');
    text(ctx, String(v), x + 52, 256, { size: 24, weight: 700, color: C.ink, align: 'center' });
    text(ctx, l, x + 52, 274, { size: 10, weight: 400, color: '#8A94A0', align: 'center' });
  });
  fillRR(ctx, 282, 296, 340, 26, 8, C.greenL);
  text(ctx, 'Estable · últimas 10 deposiciones en rango normal', 452, 313, { size: 11, weight: 600, color: C.green, align: 'center', maxWidth: 320 });
  text(ctx, 'FRECUENCIA SEMANAL', 282, 344, { size: 9.5, weight: 600, color: '#9AA3AE', spacing: 1 });
  const bars = [5, 6, 4, 7, 6, 7, 7, 7];
  bars.forEach((v, i) => {
    const g = back(prog(t, t0 + 0.3 + i * 0.07, t0 + 0.8 + i * 0.07));
    const bh = (v / 7) * 52 * g, x = 286 + i * 42;
    fillRR(ctx, x, 404 - bh, 28, Math.max(bh, 0.1), 5, i === bars.length - 1 ? C.green : '#A9D9BF');
  });

  // calendario
  card(ctx, 262, 432, 380, 312, 'Octubre 2026');
  const dn = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  dn.forEach((d, i) => text(ctx, d, 296 + i * 50, 488, { size: 10, weight: 600, color: '#9AA3AE', align: 'center' }));
  for (let d = 1; d <= 31; d++) {
    const idx = d + 2; // 1 oct 2026 = jueves
    const col = idx % 7, row = Math.floor(idx / 7);
    const x = 296 + col * 50, y = 516 + row * 44;
    if (d === 17) {
      const e = back(prog(t, t0 + 1.4, t0 + 1.8));
      ctx.beginPath(); ctx.arc(x, y - 4, 17 * e, 0, Math.PI * 2); ctx.fillStyle = rgba(C.green, 0.15); ctx.fill();
      strokeRR(ctx, x - 17, y - 21, 34, 34, 10, rgba(C.green, e), 1.8);
    }
    text(ctx, String(d), x, y, { size: 12, weight: d === 17 ? 700 : 500, color: d > 17 ? '#C4CBD4' : C.ink, align: 'center' });
    const b = CAL_LOGGED[d];
    if (b) {
      const e = prog(t, t0 + d * 0.06, t0 + d * 0.06 + 0.25);
      ctx.beginPath(); ctx.arc(x, y + 10, 3.5 * e, 0, Math.PI * 2); ctx.fillStyle = bristolColor(b); ctx.fill();
    }
  }

  // gráfico de tendencia
  card(ctx, 658, 178, 592, 270, 'Tendencia Bristol · últimas 22 deposiciones');
  const gx = 700, gy = 236, gw = 520, gh = 184;
  const yv = (v) => gy + gh - ((v - 1) / 6) * gh;
  ctx.fillStyle = rgba(C.green, 0.08); ctx.fillRect(gx, yv(5.5), gw, yv(2.5) - yv(5.5));
  for (let v = 1; v <= 7; v++) {
    ctx.fillStyle = '#EEF1F5'; ctx.fillRect(gx, yv(v), gw, 1);
    text(ctx, `T${v}`, gx - 12, yv(v) + 4, { size: 10, weight: 500, color: '#9AA3AE', align: 'right' });
  }
  text(ctx, 'Normal', gx + 4, yv(5.5) + 14, { size: 10, weight: 600, color: C.green });
  const lp = eio(prog(t, t0 + 0.3, t0 + 2.6));
  const n = TREND.length, tx = (i) => gx + 10 + (i / (n - 1)) * (gw - 20);
  const upto = lp * (n - 1);
  ctx.strokeStyle = '#4C8BB0'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= Math.floor(upto); i++) i ? ctx.lineTo(tx(i), yv(TREND[i])) : ctx.moveTo(tx(i), yv(TREND[i]));
  const fi = Math.floor(upto), ff = upto - fi;
  if (fi < n - 1) ctx.lineTo(lerp(tx(fi), tx(fi + 1), ff), lerp(yv(TREND[fi]), yv(TREND[fi + 1]), ff));
  ctx.stroke();
  for (let i = 0; i <= Math.floor(upto); i++) {
    ctx.beginPath(); ctx.arc(tx(i), yv(TREND[i]), 4, 0, Math.PI * 2); ctx.fillStyle = bristolColor(TREND[i]); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (lp >= 1) {
    const pp = ((t - (t0 + 2.6)) * 0.9) % 1;
    const lx = tx(n - 1), ly = yv(TREND[n - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 6 + pp * 14, 0, Math.PI * 2); ctx.fillStyle = rgba(C.green, 0.35 * (1 - pp)); ctx.fill();
  }
  // tooltip en el último punto
  const tip = win(t, 22.6, 24.3, 0.25, 0.3);
  if (tip > 0) layer(ctx, tip, () => {
    const lx = tx(n - 1), ly = yv(TREND[n - 1]);
    shadow(ctx, 16, 5, 'rgba(0,0,0,0.18)');
    fillRR(ctx, lx - 150, ly - 70, 140, 52, 10, C.ink); noShadow(ctx);
    text(ctx, 'Hoy · 09:12', lx - 136, ly - 48, { size: 12, weight: 600, color: '#fff' });
    text(ctx, 'Tipo 4 · normal', lx - 136, ly - 29, { size: 11, weight: 400, color: '#9BE0BC' });
  });

  // historial
  card(ctx, 658, 462, 592, 282, 'Historial (34)');
  text(ctx, 'FECHA / HORA', 680, 516, { size: 9.5, weight: 600, color: '#9AA3AE', spacing: 1 });
  text(ctx, 'DATOS', 860, 516, { size: 9.5, weight: 600, color: '#9AA3AE', spacing: 1 });
  const ins = eo(prog(t, t0 + 0.6, t0 + 1.2));
  ctx.save();
  ctx.beginPath(); ctx.rect(659, 526, 590, 214); ctx.clip();
  HIST.forEach(([d, h, b, tags, isNew], i) => {
    const y = 526 + (isNew ? 0 : (i - 1 + ins) * 42) ;
    const a = isNew ? ins : 1;
    layer(ctx, a, () => {
      const yy = y + (isNew ? (1 - ins) * -20 : 0);
      if (isNew) { ctx.fillStyle = rgba(C.green, 0.09); ctx.fillRect(659, yy, 590, 42); fillRR(ctx, 659, yy + 6, 4, 30, 2, C.green); }
      bristolImg(ctx, b, 693, yy + 21, 26);
      text(ctx, d, 716, yy + 26, { size: 12, weight: 600, color: C.ink });
      text(ctx, h, 806, yy + 26, { size: 11, weight: 400, color: '#8A94A0' });
      let x = 860;
      const w0 = measure(ctx, `T${b}`, 11, 700) + 16;
      fillRR(ctx, x, yy + 10, w0, 22, 6, rgba(bristolColor(b), 0.14));
      text(ctx, `T${b}`, x + w0 / 2, yy + 25, { size: 11, weight: 700, color: bristolColor(b), align: 'center' });
      x += w0 + 8;
      for (const s of tags) {
        const tw = measure(ctx, s, 11, 500) + 16;
        fillRR(ctx, x, yy + 10, tw, 22, 6, '#FCEAEA');
        text(ctx, s, x + 8, yy + 25, { size: 11, weight: 500, color: '#C0504D' });
        x += tw + 6;
      }
      if (isNew) text(ctx, 'NUEVO', 1226, yy + 26, { size: 10, weight: 700, color: C.green, align: 'right', spacing: 1 });
      ctx.fillStyle = '#F0F2F5'; ctx.fillRect(680, yy + 42, 550, 1);
    });
  });
  ctx.restore();

  // PDF generado
  const pe = back(prog(t, CUES.exportPdf + 0.15, CUES.exportPdf + 0.65));
  const pa = win(t, CUES.exportPdf + 0.15, 26.6, 0.2, 0.3);
  if (pa > 0) layer(ctx, pa, () => {
    ctx.translate(1060, 100); ctx.scale(pe, pe);
    shadow(ctx, 30, 12, 'rgba(20,40,70,0.22)');
    fillRR(ctx, 0, 0, 200, 86, 14, '#fff'); noShadow(ctx);
    iconPdf(ctx, 22, 16, 40, 54);
    text(ctx, 'Informe_Laura_', 78, 36, { size: 12, weight: 600, color: C.ink });
    text(ctx, 'Gomez.pdf', 78, 52, { size: 12, weight: 600, color: C.ink });
    iconCheck(ctx, 86, 66, 12, C.green, 2.5, prog(t, CUES.exportPdf + 0.5, CUES.exportPdf + 0.8));
    text(ctx, 'Listo', 98, 71, { size: 11, weight: 600, color: C.green });
  });
}

// Contenido del navegador en coordenadas virtuales (VW×VH).
function drawDashboard(ctx, t) {
  ctx.fillStyle = '#F4F5F7'; ctx.fillRect(0, 0, VW, VH);
  // transición lista → detalle (desplazamiento horizontal del área principal)
  const sw = eio(prog(t, CUES.clickPatient + 0.15, CUES.clickPatient + 0.75));
  ctx.save();
  ctx.beginPath(); ctx.rect(230, 0, VW - 230, VH); ctx.clip();
  if (sw < 1) layer(ctx, 1 - sw, () => { ctx.translate(-sw * 220, 0); drawPatientList(ctx, t); });
  if (sw > 0) layer(ctx, sw, () => { ctx.translate((1 - sw) * 220, 0); drawPatientDetail(ctx, t); });
  ctx.restore();
  drawSidebar(ctx);

  // cursor del profesional
  const ca = win(t, 15.0, 26.2, 0.3, 0.4);
  if (ca > 0) {
    const keys = [
      [15.0, 1180, 740], [16.0, 700, rowY(0) + 30], [18.3, 720, rowY(0) + 40],
      [19.2, 452, rowY(1) + 40], [19.8, 452, rowY(1) + 40], [21.6, 980, 600],
      [22.5, 1196, 368], [24.1, 1200, 372], [24.6, 1190, 72], [26.2, 1190, 72],
    ];
    const [cx, cy] = path(t, keys);
    const press = Math.max(
      Math.sin(Math.PI * prog(t, CUES.clickPatient - 0.1, CUES.clickPatient + 0.12)),
      Math.sin(Math.PI * prog(t, CUES.exportPdf - 0.1, CUES.exportPdf + 0.12)));
    layer(ctx, ca, () => {
      ripple(ctx, cx, cy, t, CUES.clickPatient, C.blue, 6, 34);
      ripple(ctx, cx, cy, t, CUES.exportPdf, C.blue, 6, 34);
      cursorArrow(ctx, cx, cy, 1.5, press);
    });
  }
}

function drawBrowser(ctx, t, x, y, w) {
  const s = w / VW, bh = 52, h = bh + VH * s;
  shadow(ctx, 80, 36, 'rgba(15,30,55,0.22)');
  fillRR(ctx, x, y, w, h, 18, '#fff'); noShadow(ctx);
  ctx.save();
  rr(ctx, x, y, w, h, 18); ctx.clip();
  ctx.fillStyle = '#EEF1F5'; ctx.fillRect(x, y, w, bh);
  ['#F26B5B', '#F5BE4F', '#5CC468'].forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 26 + i * 22, y + bh / 2, 6.5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
  const uw = Math.min(520, w * 0.45);
  fillRR(ctx, x + (w - uw) / 2, y + 11, uw, 30, 15, '#fff');
  ctx.strokeStyle = C.green; ctx.lineWidth = 1.8;
  strokeRR(ctx, x + (w - uw) / 2 + 16, y + 25, 10, 8, 2, C.green, 1.8);
  ctx.beginPath(); ctx.arc(x + (w - uw) / 2 + 21, y + 25, 3.5, Math.PI, 0); ctx.stroke();
  text(ctx, 'fluxia-health.com/medics', x + w / 2, y + 31, { size: 13, weight: 400, color: C.ink2, align: 'center' });
  ctx.translate(x, y + bh); ctx.scale(s, s);
  drawDashboard(ctx, t);
  ctx.restore();
  return { s, h };
}
// Convierte coordenadas virtuales del panel en coordenadas de pantalla.
function browserToScreen(b, vx, vy) { const s = b.w / VW; return [b.x + vx * s, b.y + 52 + vy * s]; }

// =================================================================== ESCENAS
function browserRect(t) {
  const A = { x: 760, y: 300, w: 1040 };   // escena sincronización
  const B = { x: 690, y: 152, w: 1150 };   // escena panel/detalle
  const enter = eo(prog(t, 10.7, 11.7));
  const move = eio(prog(t, 13.5, 14.4));
  return {
    x: lerp(A.x, B.x, move) + (1 - enter) * 1100,
    y: lerp(A.y, B.y, move),
    w: lerp(A.w, B.w, move),
    a: clamp(enter * 1.3),
  };
}

function phoneState(t) {
  const shrink = eio(prog(t, 10.3, 11.3));
  const exit = eio(prog(t, 13.4, 14.2));
  const enter = spring(prog(t, 3.4, 4.6));
  return {
    x: lerp(1230, 400, shrink) - exit * 700,
    y: lerp(540, 610, shrink) + (1 - enter) * 1000,
    s: lerp(0.98, 0.68, shrink),
    a: 1 - exit,
  };
}

function sceneIntro(ctx, t) {
  const [a, b] = SCENES.intro;
  if (t > b) return;
  const out = eio(prog(t, 3.0, 3.7));
  const h = 150;
  const mw = LOGO.w * h / LOGO.h;
  const ww = mw + h * 0.26 + measure(ctx, 'Fluxia', h * 0.9, 600);
  const word = eo(prog(t, 1.15, 1.9));
  ctx.save();
  ctx.globalAlpha = 1 - out;
  ctx.translate(W / 2, 470); ctx.scale(1 - out * 0.12, 1 - out * 0.12); ctx.translate(-W / 2, -470);
  const x = (W - ww) / 2 + (1 - word) * (ww - mw) / 2;
  const x0 = x;
  drawLogoMark(ctx, x0, 470 - h / 2 - 20, h, eio(prog(t, CUES.logoDraw, 1.5)));
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 + mw + 10, 0, W, H); ctx.clip();
  layer(ctx, word, () => text(ctx, 'Fluxia', x0 + mw + h * 0.26 - (1 - word) * 60, 470 - h / 2 - 20 + h * 0.86, { size: h * 0.9, weight: 600, color: '#383838', spacing: -1.4 }));
  ctx.restore();
  const tg = eo(prog(t, 1.7, 2.4));
  layer(ctx, tg, () => {
    ctx.translate(0, (1 - tg) * 20);
    text(ctx, 'Del móvil del paciente al panel del profesional,', W / 2, 640, { size: 38, weight: 300, color: C.ink2, align: 'center' });
    text(ctx, 'en tiempo real.', W / 2, 692, { size: 38, weight: 600, color: C.ink, align: 'center' });
  });
  ctx.restore();
}

function scenePatient(ctx, t) {
  const [a, b] = SCENES.patient;
  if (t < a || t > SCENES.sync[1]) return;
  drawCaption(ctx, t, 3.9, 10.6, {
    x: 150, y: 330, color: C.green, eyebrow: 'PASO 1 · PACIENTE',
    title: ['El paciente registra', 'en segundos'],
    body: ['Escala de Bristol, síntomas y notas', 'desde la app gratuita (iOS y Android).'],
    bullets: ['Sin formación previa', 'Recordatorios automáticos'],
    width: 600,
  });
  // anotaciones junto al teléfono
  const ps = phoneState(t);
  if (ps.a > 0) layer(ctx, ps.a, () => drawPhone(ctx, t, ps.x, ps.y, ps.s));
  annotation(ctx, t, 4.6, 7.4, 1480, 380, 'Escala de Bristol', '7 tipos, con ilustraciones', (x, y) => bristolImg(ctx, 4, x, y, 34), C.blueApp, 1362, 505);
  annotation(ctx, t, 8.3, 10.3, 1480, 600, 'Racha y recordatorios', 'Para no olvidar ningún día', (x, y) => iconBell(ctx, x, y, 24, C.green), C.green, 1393, 705);
}

function sceneSync(ctx, t) {
  const [a, b] = SCENES.sync;
  if (t < a || t > b + 0.2) return;
  // título centrado
  const cap = win(t, 10.9, 13.7, 0.5, 0.4);
  layer(ctx, cap, () => {
    const e = eo(prog(t, 10.9, 11.5));
    ctx.translate(0, (1 - e) * 20);
    const lbl = 'PASO 2 · SINCRONIZACIÓN';
    const w = measure(ctx, lbl, 15, 600) + 2.4 * lbl.length + 36;
    fillRR(ctx, W / 2 - w / 2, 70, w, 38, 19, rgba(C.teal, 0.14));
    ctx.beginPath(); ctx.arc(W / 2 - w / 2 + 18, 89, 5, 0, Math.PI * 2); ctx.fillStyle = C.teal; ctx.fill();
    text(ctx, lbl, W / 2 - w / 2 + 32, 95, { size: 15, weight: 600, color: mix(C.teal, C.ink, 0.35), spacing: 2.4 });
    text(ctx, 'Llega al instante al panel del profesional', W / 2, 172, { size: 50, weight: 600, color: C.ink, align: 'center', spacing: -0.8 });
    text(ctx, 'Sin exportar, sin correos, sin papeles.', W / 2, 220, { size: 23, weight: 300, color: C.ink2, align: 'center' });
  });
  // etiquetas de dispositivo
  const lab = win(t, 11.4, 13.5, 0.4, 0.3);
  layer(ctx, lab, () => {
    const ps = phoneState(t);
    text(ctx, 'App del paciente', ps.x, ps.y + 450 * ps.s + 46, { size: 16, weight: 500, color: C.ink2, align: 'center' });
  });

  // paquete de datos viajando del móvil al panel
  const br = browserRect(t);
  const ps = phoneState(t);
  const p = prog(t, 11.7, CUES.packetArrive);
  const from = [ps.x + 200 * ps.s, ps.y - 60 * ps.s];
  const to = browserToScreen(br, 470, rowY(1) + 37);
  const c1 = [from[0] + 240, from[1] - 300], c2 = [to[0] - 220, to[1] - 300];
  const bez = (u) => {
    const v = 1 - u;
    return [v * v * v * from[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * to[0],
      v * v * v * from[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * to[1]];
  };
  const trailA = win(t, 11.6, 13.4, 0.2, 0.5);
  if (p > 0 && trailA > 0) layer(ctx, trailA, () => {
    // trazo discontinuo
    ctx.setLineDash([3, 12]); ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(C.teal, 0.55); ctx.lineWidth = 4;
    ctx.beginPath();
    const ep = eio(p);
    for (let i = 0; i <= 60; i++) { const q = bez((i / 60) * ep); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }
    ctx.stroke(); ctx.setLineDash([]);
    // estela
    const cols = ['#D9D91E', '#7DAF86', '#4DA0A2', '#3C7DB8'];
    for (let k = 0; k < 14; k++) {
      const u = ep - k * 0.018;
      if (u < 0 || p >= 1) continue;
      const q = bez(u);
      ctx.beginPath(); ctx.arc(q[0], q[1], 9 * (1 - k / 14), 0, Math.PI * 2);
      ctx.fillStyle = rgba(cols[k % 4], 0.7 * (1 - k / 14)); ctx.fill();
    }
    if (p < 1) {
      const q = bez(ep);
      const sc = 1 - 0.45 * eio(prog(t, CUES.packetArrive - 0.35, CUES.packetArrive));
      ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(sc, sc);
      shadow(ctx, 24, 8, 'rgba(20,40,70,0.25)');
      fillRR(ctx, -92, -30, 184, 60, 30, '#fff'); noShadow(ctx);
      ctx.beginPath(); ctx.arc(-62, 0, 21, 0, Math.PI * 2); ctx.fillStyle = C.blueL; ctx.fill();
      bristolImg(ctx, 4, -62, 0, 34);
      text(ctx, 'Tipo 4', -32, -3, { size: 15, weight: 700, color: C.ink });
      text(ctx, 'Laura · 09:12', -32, 16, { size: 12, weight: 400, color: C.ink2 });
      ctx.restore();
    }
    // explosión al llegar
    const burst = prog(t, CUES.packetArrive, CUES.packetArrive + 0.7);
    if (burst > 0 && burst < 1) {
      ctx.strokeStyle = rgba(C.green, 1 - burst); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(to[0], to[1], 10 + eo(burst) * 70, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2, r = 20 + eo(burst) * 90;
        ctx.beginPath(); ctx.arc(to[0] + Math.cos(ang) * r, to[1] + Math.sin(ang) * r, 5 * (1 - burst), 0, Math.PI * 2);
        ctx.fillStyle = rgba(['#D9D91E', '#4DA0A2', '#3C7DB8', '#4DA078'][k % 4], 1 - burst); ctx.fill();
      }
    }
  });
}

function sceneDoctor(ctx, t) {
  const br = browserRect(t);
  const out = eio(prog(t, 26.3, 27.0));
  if (br.a <= 0 || t > 27.1) return;
  layer(ctx, br.a * (1 - out), () => {
    ctx.translate(W / 2, H / 2); ctx.scale(1 - out * 0.08, 1 - out * 0.08); ctx.translate(-W / 2, -H / 2);
    drawBrowser(ctx, t, br.x, br.y, br.w);
  });
  // etiqueta bajo el navegador en la escena de sincronización
  const lab = win(t, 11.6, 13.5, 0.4, 0.3);
  layer(ctx, lab, () => text(ctx, 'Panel web del profesional', br.x + br.w / 2, br.y + 52 + VH * br.w / VW + 46, { size: 16, weight: 500, color: C.ink2, align: 'center' }));

  drawCaption(ctx, t, 14.3, 20.1, {
    x: 110, y: 300, color: C.orange, eyebrow: 'PASO 3 · PROFESIONAL',
    title: ['Todos sus pacientes,', 'priorizados'],
    body: ['Semáforo verde, ámbar y rojo según', 'los días sin registrar.'],
    bullets: ['Umbrales configurables', 'Alertas de inactividad', '100% web, sin instalar nada'],
    width: 530,
  });
  drawCaption(ctx, t, 20.4, 26.5, {
    x: 110, y: 330, color: C.blue, eyebrow: 'PASO 4 · SEGUIMIENTO',
    title: ['Tendencias e', 'informes en PDF'],
    body: ['Historial completo, gráficas y', 'calendario listos para la consulta.'],
    bullets: ['Exportación para la historia clínica'],
    width: 530,
  });
}

function sceneOutro(ctx, t) {
  const [a] = SCENES.outro;
  if (t < a) return;
  const h = 120;
  const mw = LOGO.w * h / LOGO.h;
  const ww = mw + h * 0.26 + measure(ctx, 'Fluxia', h * 0.9, 600);
  const x = (W - ww) / 2, y = 330;
  drawLogoMark(ctx, x, y, h, eio(prog(t, CUES.outroLogo, CUES.outroLogo + 1.1)));
  const word = eo(prog(t, 27.4, 28.0));
  layer(ctx, word, () => text(ctx, 'Fluxia', x + mw + h * 0.26 + (1 - word) * 30, y + h * 0.86, { size: h * 0.9, weight: 600, color: '#383838', spacing: -1.2 }));
  const t1 = eo(prog(t, 27.8, 28.4));
  layer(ctx, t1, () => {
    ctx.translate(0, (1 - t1) * 18);
    text(ctx, 'Pacientes y profesionales, conectados en tiempo real.', W / 2, 560, { size: 34, weight: 300, color: C.ink2, align: 'center' });
  });
  const t2 = back(prog(t, 28.2, 28.8));
  layer(ctx, clamp(t2), () => {
    ctx.translate(W / 2, 660); ctx.scale(t2, t2);
    const g = ctx.createLinearGradient(-230, 0, 230, 0);
    g.addColorStop(0, '#4DA078'); g.addColorStop(1, C.blue);
    shadow(ctx, 30, 12, 'rgba(60,125,184,0.35)');
    fillRR(ctx, -230, -36, 460, 72, 36, g); noShadow(ctx);
    text(ctx, 'Empieza gratis · fluxia-health.com', 0, 8, { size: 24, weight: 600, color: '#fff', align: 'center' });
  });
  const t3 = eo(prog(t, 28.6, 29.2));
  layer(ctx, t3, () => {
    const items = [['App gratuita para pacientes', C.green], ['Panel web para profesionales', C.blue]];
    items.forEach(([s, col], i) => {
      const cx = W / 2 + (i ? 1 : -1) * 220;
      ctx.beginPath(); ctx.arc(cx - measure(ctx, s, 19, 400) / 2 - 18, 768, 6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      text(ctx, s, cx, 775, { size: 19, weight: 400, color: C.ink2, align: 'center' });
    });
  });
}

function cornerLogo(ctx, t) {
  const a = win(t, 3.6, 26.5, 0.5, 0.4);
  if (a > 0) layer(ctx, a, () => drawLogo(ctx, 64, 50, 38));
}

export function renderFrame(ctx, t) {
  ctx.save();
  drawBackground(ctx, t);
  cornerLogo(ctx, t);
  sceneIntro(ctx, t);
  sceneDoctor(ctx, t);
  scenePatient(ctx, t);
  sceneSync(ctx, t);
  sceneOutro(ctx, t);
  ctx.restore();
}
