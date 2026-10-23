// Fluxia — vídeo de marketing infográfico (50 s, 1920×1080) en <canvas>.
// Cuenta qué hace Fluxia y qué gana cada parte: el paciente registra en
// unos toques y recibe recordatorios (más adherencia) y el profesional
// recibe información más completa y precisa para decidir mejor.
// Como en el vídeo explicativo, renderFrame(ctx, t) es una función pura del
// tiempo y reutiliza las utilidades, el isotipo y el fondo de ../scene.js.
import {
  clamp, lerp, prog, eo, eio, back, win, C, SEM, mix, rgba, rr, fillRR, strokeRR, shadow, noShadow,
  text, measure, layer, bristolImg, LOGO, drawLogoMark, drawLogo, drawBackground, iconCheck, ripple,
  loadAssets as loadBaseAssets,
} from '../scene.js';
import { WIDTH as W, HEIGHT as H, SCENES, CUES } from './timeline.js';

const BRAND = ['#D4D62F', '#78AD89', '#539D9F', '#467CB3'];
function brandGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  BRAND.forEach((c, i) => g.addColorStop(i / (BRAND.length - 1), c));
  return g;
}
const SEM_LABEL = { green: 'Al día', orange: 'Se demora', red: 'Sin registros' };

// ------------------------------------------------------------------ iconos
// Los mismos iconos (Lucide, 24×24, trazo 2) que usa la landing
// (src/pages/index.astro), convertidos a Path2D.
const ICON_SRC = {
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  zap: '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
  stethoscope: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  droplets: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  calendarCheck: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trending: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
};
const ICONS = {};
for (const [name, src] of Object.entries(ICON_SRC)) {
  const p = new Path2D();
  for (const m of src.matchAll(/<(path|rect|circle)([^>]*)\/>/g)) {
    const a = Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
    if (m[1] === 'path') p.addPath(new Path2D(a.d));
    else if (m[1] === 'rect') p.roundRect(+(a.x || 0), +(a.y || 0), +a.width, +a.height, +(a.rx || 0));
    else { p.moveTo(+a.cx + +a.r, +a.cy); p.arc(+a.cx, +a.cy, +a.r, 0, Math.PI * 2); }
  }
  ICONS[name] = p;
}
function icon(ctx, name, cx, cy, size, color, lw = 2) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke(ICONS[name]);
  ctx.restore();
}
// Icono dentro de un círculo tintado.
function badge(ctx, name, cx, cy, r, color, s = 1) {
  ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.fillStyle = rgba(color, 0.14); ctx.fill();
  icon(ctx, name, cx, cy, r * 1.05 * s, color, 2.1);
}

// ------------------------------------------------------------------ activos
// Capturas reales de la app del paciente (animacion/IMG_2335…2338).
const SHOTS = [];
export async function loadAssets(publicBase, shotsBase) {
  await loadBaseAssets(publicBase);
  await Promise.all([2335, 2336, 2337, 2338].map((n, i) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      // Se reescala una vez a 2× el tamaño de pantalla para que no haya aliasing.
      const c = document.createElement('canvas');
      c.width = 824; c.height = Math.round(824 * img.height / img.width);
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, c.width, c.height);
      SHOTS[i] = c; res();
    };
    img.onerror = rej;
    img.src = `${shotsBase}IMG_${n}.PNG`;
  })));
}

// --------------------------------------------------------------- móvil
const PH = { w: 440, h: 900, sw: 412, sh: 872 };
// Pasa coordenadas de las capturas (vistas a 923 px de ancho) a la pantalla.
const shotPt = (x, y) => [x * PH.sw / 923, y * PH.sw / 923];

function phone(ctx, cx, cy, s, drawScreen) {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s);
  const { w, h, sw, sh } = PH;
  shadow(ctx, 70, 34, 'rgba(15,30,55,0.28)');
  fillRR(ctx, -w / 2, -h / 2, w, h, 72, '#1A1C20'); noShadow(ctx);
  strokeRR(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 70, '#4A4E56', 2.5);
  fillRR(ctx, -w / 2 - 4, -h / 2 + 190, 5, 60, 2, '#2A2C31');
  fillRR(ctx, -w / 2 - 4, -h / 2 + 270, 5, 60, 2, '#2A2C31');
  fillRR(ctx, w / 2 - 1, -h / 2 + 230, 5, 96, 2, '#2A2C31');
  ctx.save();
  rr(ctx, -sw / 2, -sh / 2, sw, sh, 58); ctx.clip();
  ctx.translate(-sw / 2, -sh / 2);
  ctx.fillStyle = '#F4F6F3'; ctx.fillRect(0, 0, sw, sh);
  drawScreen(ctx);
  fillRR(ctx, sw / 2 - 62, 12, 124, 36, 18, '#0B0C0E'); // isla dinámica
  ctx.restore();
  ctx.restore();
}
function shot(ctx, i, x = 0) {
  const c = SHOTS[i];
  if (c) ctx.drawImage(c, x, 0, PH.sw, PH.sw * c.height / c.width);
}

// ------------------------------------------------------------- textos
function eyebrowPill(ctx, s, cx, y, color) {
  const w = measure(ctx, s, 15, 600) + 2.4 * s.length + 40;
  const x = cx - w / 2;
  fillRR(ctx, x, y, w, 38, 19, rgba(color, 0.14));
  ctx.beginPath(); ctx.arc(x + 19, y + 19, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  text(ctx, s, x + 33, y + 25, { size: 15, weight: 600, color: mix(color, '#1D2733', 0.35), spacing: 2.4 });
}
// Cabecera de sección (etiqueta + titular) con entrada escalonada.
function heading(ctx, t, a, b, { eyebrow, color, title }) {
  const out = 1 - eio(prog(t, b - 0.5, b));
  const e1 = eo(prog(t, a + 0.1, a + 0.7)), e2 = eo(prog(t, a + 0.25, a + 0.9));
  layer(ctx, e1 * out, () => { ctx.translate(0, (1 - e1) * 20 - (1 - out) * 12); eyebrowPill(ctx, eyebrow, W / 2, 92, color); });
  layer(ctx, e2 * out, () => {
    ctx.translate(0, (1 - e2) * 26 - (1 - out) * 12);
    text(ctx, title, W / 2, 200, { size: 54, weight: 600, color: C.ink, align: 'center', maxWidth: 1600, spacing: -1 });
  });
}
function lines(ctx, arr, x, y, lh, o) { arr.forEach((s, i) => text(ctx, s, x, y + i * lh, o)); }

// Píldora de semáforo (mismos colores y textos que el panel MW).
function semPill(ctx, x, y, sem, { pulse = 0, align = 'left', size = 13 } = {}) {
  const col = SEM[sem], label = SEM_LABEL[sem];
  const w = measure(ctx, label, size, 600) + 40;
  const x0 = align === 'right' ? x - w : x;
  fillRR(ctx, x0, y - 15, w, 30, 15, rgba(col, 0.13));
  if (pulse > 0 && pulse < 1) {
    ctx.beginPath(); ctx.arc(x0 + 16, y, 5 + pulse * 18, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, 0.35 * (1 - pulse)); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x0 + 16, y, 5.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  text(ctx, label, x0 + 29, y + 4.5, { size, weight: 600, color: mix(col, '#1D2733', 0.25) });
  return w;
}
function avatar(ctx, x, y, r, initials, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = rgba(color, 0.16); ctx.fill();
  text(ctx, initials, x, y + r * 0.36, { size: r * 0.9, weight: 600, color: mix(color, '#1D2733', 0.2), align: 'center' });
}

// ================================================================ ESCENAS
// 1 · Intro: el isotipo se dibuja y aparece el mensaje.
function sceneIntro(ctx, t) {
  const [, b] = SCENES.intro;
  if (t > b) return;
  const out = eio(prog(t, 3.7, 4.3));
  const h = 150, cy = 450;
  const mw = LOGO.w * h / LOGO.h;
  const ww = mw + h * 0.26 + measure(ctx, 'Fluxia', h * 0.9, 600);
  const word = eo(prog(t, 1.15, 1.9));
  ctx.save();
  ctx.globalAlpha = 1 - out;
  ctx.translate(W / 2, cy); ctx.scale(1 - out * 0.12, 1 - out * 0.12); ctx.translate(-W / 2, -cy);
  const x0 = (W - ww) / 2 + (1 - word) * (ww - mw) / 2;
  drawLogoMark(ctx, x0, cy - h / 2 - 20, h, eio(prog(t, CUES.logoDraw, 1.5)));
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 + mw + 10, 0, W, H); ctx.clip();
  layer(ctx, word, () => text(ctx, 'Fluxia', x0 + mw + h * 0.26 - (1 - word) * 60, cy - h / 2 - 20 + h * 0.86, { size: h * 0.9, weight: 600, color: '#383838', spacing: -1.4 }));
  ctx.restore();
  const tg = eo(prog(t, 1.8, 2.5));
  layer(ctx, tg, () => {
    ctx.translate(0, (1 - tg) * 20);
    text(ctx, 'El seguimiento digestivo y urológico', W / 2, 630, { size: 38, weight: 300, color: C.ink2, align: 'center' });
    text(ctx, 'que une al paciente con su profesional.', W / 2, 684, { size: 38, weight: 600, color: C.ink, align: 'center' });
  });
  ctx.restore();
}

// 2 · El reto: entre visitas la información depende de la memoria.
function sceneProblem(ctx, t) {
  const [a, b] = SCENES.problem;
  if (t < a || t > b) return;
  heading(ctx, t, a, b, { eyebrow: 'EL RETO', color: C.orange, title: 'Entre consulta y consulta, la información se pierde' });
  const out = 1 - eio(prog(t, b - 0.55, b));
  layer(ctx, out, () => {
    const y = 545, x0 = 330, x1 = 1590;
    const lp = eio(prog(t, 4.7, 5.7));
    // nodos de consulta en los extremos
    [[x0, 'Consulta', '3 de marzo', 4.6], [x1, 'Siguiente consulta', '2 de abril', 5.4]].forEach(([x, l1, l2, t0]) => {
      const e = back(prog(t, t0, t0 + 0.5));
      if (e <= 0) return;
      layer(ctx, clamp(e), () => {
        ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
        shadow(ctx, 30, 10, 'rgba(20,40,70,0.14)');
        ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
        ctx.lineWidth = 3; ctx.strokeStyle = rgba(C.blue, 0.35); ctx.stroke();
        icon(ctx, 'stethoscope', 0, 0, 52, C.blue, 2);
        ctx.restore();
        text(ctx, l1, x, y + 104, { size: 22, weight: 600, color: C.ink, align: 'center' });
        text(ctx, l2, x, y + 134, { size: 18, weight: 400, color: C.ink2, align: 'center' });
      });
    });
    // línea de tiempo con los días sin datos
    ctx.save();
    ctx.setLineDash([2, 12]); ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#C6CED8';
    ctx.beginPath(); ctx.moveTo(x0 + 70, y); ctx.lineTo(lerp(x0 + 70, x1 - 70, lp), y); ctx.stroke();
    ctx.restore();
    const N = 28;
    for (let i = 0; i < N; i++) {
      const dx = lerp(x0 + 110, x1 - 110, i / (N - 1));
      const e = eo(prog(t, 4.75 + i * 0.035, 5.05 + i * 0.035));
      if (e <= 0) continue;
      ctx.beginPath(); ctx.arc(dx, y, 9 * e, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#C6CED8'; ctx.stroke();
    }
    // interrogantes sobre los días sin información
    [4, 11, 17, 24].forEach((d, k) => {
      const t0 = CUES.questions[k];
      const e = back(prog(t, t0, t0 + 0.45));
      if (e <= 0) return;
      const dx = lerp(x0 + 110, x1 - 110, d / (N - 1));
      const fy = y - 92 - Math.sin((t - t0) * 2.2 + k) * 6;
      layer(ctx, clamp(e), () => {
        ctx.strokeStyle = rgba(C.orange, 0.5); ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(dx, y - 14); ctx.lineTo(dx, fy + 34); ctx.stroke(); ctx.setLineDash([]);
        ctx.save(); ctx.translate(dx, fy); ctx.scale(e, e);
        shadow(ctx, 20, 8, 'rgba(224,159,60,0.25)');
        ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
        icon(ctx, 'help', 0, 0, 40, C.orange, 2.2);
        ctx.restore();
      });
    });
    // lo que el paciente recuerda en la consulta
    const m = eo(prog(t, CUES.memory, CUES.memory + 0.6));
    layer(ctx, m, () => {
      ctx.translate(0, (1 - m) * 18);
      const s = '«Creo que… ¿unas tres veces por semana?»';
      const tw = measure(ctx, s, 26, 400);
      const bw = tw + 140, bx = W / 2 - bw / 2 + 30, by = 742;
      avatar(ctx, bx - 46, by + 38, 36, '', C.violet);
      icon(ctx, 'user', bx - 46, by + 38, 40, C.violet, 2);
      shadow(ctx, 30, 10, 'rgba(20,40,70,0.12)');
      fillRR(ctx, bx, by, bw, 76, 38, '#fff'); noShadow(ctx);
      text(ctx, s, bx + 40, by + 47, { size: 26, weight: 400, color: C.ink });
    });
    // consecuencias
    ['De memoria', 'Incompleta', 'Imprecisa'].forEach((s, i) => {
      const t0 = CUES.flaws[i];
      const e = back(prog(t, t0, t0 + 0.4));
      if (e <= 0) return;
      const cw = 240, gap = 28, cx = W / 2 + (i - 1) * (cw + gap);
      layer(ctx, clamp(e), () => {
        ctx.save(); ctx.translate(cx, 900); ctx.scale(e, e);
        fillRR(ctx, -cw / 2, -30, cw, 60, 30, rgba('#D26464', 0.1));
        icon(ctx, 'x', -cw / 2 + 36, 0, 24, '#D26464', 2.6);
        text(ctx, s, -cw / 2 + 62, 8, { size: 22, weight: 600, color: mix('#D26464', '#1D2733', 0.3) });
        ctx.restore();
      });
    });
  });
}

// 3 · La solución: registro en la app → panel del profesional en tiempo real.
const SOL = { px: 470, py: 600, ps: 0.74, x: 1060, y: 286, w: 740, h: 620 };
const PANEL_ROWS = [
  { name: 'Laura Gómez', ini: 'LG', col: '#4DA0A2', last: 'Hace 3 días', sem: 'orange', now: 'Ahora · Deposición, Bristol tipo 4' },
  { name: 'Antonio Pérez', ini: 'AP', col: '#E09F3C', last: 'Hace 6 días', sem: 'red', now: 'Ahora · Micción voluntaria' },
  { name: 'Carmen Ruiz', ini: 'CR', col: '#3C7DB8', last: 'Ayer, 21:15', sem: 'green', now: 'Ahora · Merienda, con foto' },
  { name: 'Lucía Martín', ini: 'LM', col: '#4DA078', last: 'Hoy, 08:40', sem: 'green' },
  { name: 'José Gil', ini: 'JG', col: '#8480C9', last: 'Hace 18 días', sem: 'red' },
];
const PKT_ICON = ['bristol', 'droplets', 'utensils'];
const rowCY = (i) => SOL.y + 238 + i * 76;
const arrival = (i) => CUES.packets[i] + CUES.travel;

function drawPanel(ctx, t) {
  const { x, y, w, h } = SOL;
  ctx.save(); ctx.translate(x, y);
  shadow(ctx, 60, 24, 'rgba(15,30,55,0.18)');
  fillRR(ctx, 0, 0, w, h, 26, '#fff'); noShadow(ctx);
  ctx.save(); rr(ctx, 0, 0, w, h, 26); ctx.clip();
  // barra superior con el degradado corporativo (como en MW)
  const g = ctx.createLinearGradient(0, 0, w, 70);
  [['#3E78B5', 0], ['#539D9F', 0.36], ['#78AD89', 0.62], ['#D8DA56', 1]].forEach(([c, o]) => g.addColorStop(o, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, 72);
  fillRR(ctx, 16, 12, 150, 48, 24, '#fff');
  drawLogo(ctx, 34, 23, 26);
  ctx.beginPath(); ctx.arc(w - 40, 36, 20, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  text(ctx, 'M', w - 40, 42, { size: 16, weight: 700, color: C.ink, align: 'center' });
  text(ctx, 'Dra. Marta Ruiz', w - 72, 42, { size: 15, weight: 500, color: '#fff', align: 'right' });
  ctx.restore();
  text(ctx, 'Mis pacientes', 32, 124, { size: 28, weight: 600, color: C.ink });
  // indicador "en directo"
  const live = (Math.sin(t * 4) + 1) / 2;
  ctx.beginPath(); ctx.arc(w - 150, 115, 6 + live * 5, 0, Math.PI * 2); ctx.fillStyle = rgba(C.green, 0.25); ctx.fill();
  ctx.beginPath(); ctx.arc(w - 150, 115, 6, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill();
  text(ctx, 'En directo', w - 134, 121, { size: 16, weight: 500, color: C.ink2 });
  let cx = 32;
  [['Todos', C.blue], ['Al día', C.green], ['Se demora', C.orange], ['Sin registros', C.red]].forEach(([s, col], i) => {
    const cw = measure(ctx, s, 13, 600) + (i ? 40 : 28);
    fillRR(ctx, cx, 152, cw, 30, 15, i ? rgba(col, 0.12) : col);
    if (i) { ctx.beginPath(); ctx.arc(cx + 16, 167, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
    text(ctx, s, cx + (i ? 28 : 14), 172, { size: 13, weight: 600, color: i ? mix(col, '#1D2733', 0.25) : '#fff' });
    cx += cw + 10;
  });
  PANEL_ROWS.forEach((r, i) => {
    const ry = rowCY(i) - y;
    const ta = i < 3 ? arrival(i) : Infinity;
    const upd = clamp((t - ta) / 0.35);
    const flash = t >= ta ? Math.max(0, 1 - (t - ta) / 1.8) : 0;
    if (flash > 0) fillRR(ctx, 12, ry - 36, w - 24, 72, 16, rgba(C.blue, 0.12 * flash + 0.02));
    if (i) { ctx.fillStyle = C.line; ctx.fillRect(32, ry - 38, w - 64, 1); }
    avatar(ctx, 56, ry, 24, r.ini, r.col);
    text(ctx, r.name, 96, ry - 4, { size: 19, weight: 600, color: C.ink });
    layer(ctx, 1 - upd, () => text(ctx, r.last, 96, ry + 22, { size: 15, weight: 400, color: C.ink2 }));
    layer(ctx, upd, () => text(ctx, r.now || '', 96, ry + 22, { size: 15, weight: 500, color: C.blue }));
    const sem = upd > 0.5 ? 'green' : r.sem;
    const pulse = t >= ta ? (t - ta) / 1.1 : 0;
    semPill(ctx, w - 32, ry, sem, { pulse, align: 'right' });
  });
  ctx.restore();
}

function packetPath(i) {
  const p0 = [SOL.px + PH.w * SOL.ps / 2 + 14, SOL.py - 20];
  const p3 = [SOL.x - 6, rowCY(i)];
  return [p0, [p0[0] + 200, p0[1]], [p3[0] - 200, p3[1]], p3];
}
function bez(P, u) {
  const v = 1 - u;
  return [0, 1].map((k) => v * v * v * P[0][k] + 3 * v * v * u * P[1][k] + 3 * v * u * u * P[2][k] + u * u * u * P[3][k]);
}
function packetIcon(ctx, kind, x, y, r) {
  shadow(ctx, 24, 8, 'rgba(60,125,184,0.35)');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
  ctx.lineWidth = 3; ctx.strokeStyle = rgba(C.blue, 0.5); ctx.stroke();
  if (kind === 'bristol') bristolImg(ctx, 4, x, y, r * 1.5);
  else icon(ctx, kind, x, y, r * 1.0, C.blue, 2.2);
}

function sceneSolution(ctx, t) {
  const [a, b] = SCENES.solution;
  if (t < a || t > b) return;
  heading(ctx, t, a, b, { eyebrow: 'QUÉ HACE FLUXIA', color: C.teal, title: 'Conecta el registro del paciente con su profesional' });
  const out = 1 - eio(prog(t, b - 0.55, b));
  layer(ctx, out, () => {
    // móvil con capturas reales
    const pe = eo(prog(t, 10.4, 11.1));
    layer(ctx, pe, () => {
      phone(ctx, SOL.px - (1 - pe) * 120, SOL.py, SOL.ps, (c) => {
        const [s1, s2] = CUES.screens;
        const p1 = eio(prog(t, s1, s1 + 0.5)), p2 = eio(prog(t, s2, s2 + 0.5));
        if (p1 < 1) shot(c, 0, -p1 * PH.sw);
        if (p1 > 0 && p2 < 1) shot(c, 1, (1 - p1) * PH.sw - p2 * PH.sw);
        if (p2 > 0) shot(c, 2, (1 - p2) * PH.sw);
        // toques: tipo 4 → pestaña micción → "Voluntaria" → pestaña comidas → "Merienda"
        [[236, 1243, 11.1], [461, 710, 12.1], [190, 950, 13.0], [741, 710, 14.1], [660, 1668, 15.0]].forEach(([sx, sy, t0]) => {
          const [rx, ry] = shotPt(sx, sy);
          ripple(c, rx, ry, t, t0, C.blue, 16, 70);
          const d = prog(t, t0 - 0.05, t0 + 0.25);
          if (d > 0 && d < 1) { c.beginPath(); c.arc(rx, ry, 26, 0, Math.PI * 2); c.fillStyle = rgba(C.blue, 0.22 * (1 - d)); c.fill(); }
        });
      });
    });
    // rótulo bajo el móvil
    const labels = ['Deposiciones · escala de Bristol', 'Micciones', 'Comidas · con foto del plato'];
    const icons = ['toilet', 'droplets', 'utensils'];
    const k = t < CUES.screens[0] + 0.25 ? 0 : t < CUES.screens[1] + 0.25 ? 1 : 2;
    const ks = [10.9, CUES.screens[0] + 0.25, CUES.screens[1] + 0.25][k];
    const le = eo(prog(t, ks, ks + 0.4));
    layer(ctx, le, () => {
      const s = labels[k], tw = measure(ctx, s, 20, 600) + 84;
      const ly = SOL.py + PH.h * SOL.ps / 2 + 52 + (1 - le) * 10;
      fillRR(ctx, SOL.px - tw / 2, ly - 24, tw, 48, 24, '#fff');
      if (icons[k] === 'toilet') bristolImg(ctx, 4, SOL.px - tw / 2 + 32, ly, 40);
      else icon(ctx, icons[k], SOL.px - tw / 2 + 32, ly, 22, C.blue, 2.2);
      text(ctx, s, SOL.px - tw / 2 + 58, ly + 7, { size: 20, weight: 600, color: C.ink });
    });
    // panel del profesional
    const de = eo(prog(t, 10.7, 11.4));
    layer(ctx, de, () => { ctx.translate((1 - de) * 140, 0); drawPanel(ctx, t); });
    // "en tiempo real"
    const re = eo(prog(t, 11.2, 11.8));
    layer(ctx, re, () => {
      const mx = (SOL.px + PH.w * SOL.ps / 2 + SOL.x) / 2 + 6;
      fillRR(ctx, mx - 112, 352, 224, 50, 25, rgba(C.blue, 0.1));
      icon(ctx, 'zap', mx - 76, 377, 22, C.blue, 2.2);
      text(ctx, 'En tiempo real', mx - 56, 384, { size: 19, weight: 600, color: C.blue });
    });
    // registros viajando del móvil al panel
    CUES.packets.forEach((t0, i) => {
      const P = packetPath(i);
      const tr = win(t, t0 - 0.1, arrival(i) + 0.6, 0.25, 0.6);
      if (tr > 0) layer(ctx, tr * 0.9, () => {
        const g = ctx.createLinearGradient(P[0][0], 0, P[3][0], 0);
        g.addColorStop(0, rgba('#78AD89', 0.0)); g.addColorStop(0.3, rgba('#539D9F', 0.55)); g.addColorStop(1, rgba(C.blue, 0.7));
        ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([2, 10]);
        ctx.lineDashOffset = -t * 60;
        ctx.beginPath(); ctx.moveTo(...P[0]); ctx.bezierCurveTo(...P[1], ...P[2], ...P[3]); ctx.stroke(); ctx.setLineDash([]);
      });
      const u = eio(prog(t, t0, arrival(i)));
      if (u <= 0 || u >= 1) return;
      for (let k2 = 6; k2 >= 1; k2--) {
        const [tx, ty] = bez(P, clamp(u - k2 * 0.025));
        ctx.beginPath(); ctx.arc(tx, ty, 26 * (1 - k2 / 8), 0, Math.PI * 2); ctx.fillStyle = rgba('#539D9F', 0.08 * (7 - k2) / 6); ctx.fill();
      }
      const [px, py] = bez(P, u);
      const s = 1 + Math.sin(u * Math.PI) * 0.15;
      packetIcon(ctx, PKT_ICON[i], px, py, 30 * s);
    });
  });
}

// 4 · Para el paciente: fácil, con recordatorios y gratis → más adherencia.
const PAT = { px: 500, py: 610, ps: 0.74 };
const GAPS = [9, 19];
const NCELLS = 28;
const cellTime = (i) => lerp(CUES.adherence[0], CUES.adherence[1], i / NCELLS);
// Patrón ilustrativo sin recordatorios: la constancia decae con las semanas.
const NO_REMINDER = [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0];

function scenePatient(ctx, t) {
  const [a, b] = SCENES.patient;
  if (t < a || t > b) return;
  heading(ctx, t, a, b, { eyebrow: 'PARA EL PACIENTE', color: C.green, title: 'Registrar es fácil. Y ya no se le olvida.' });
  const out = 1 - eio(prog(t, b - 0.55, b));
  layer(ctx, out, () => {
    const pe = eo(prog(t, 19.3, 20.0));
    const top = PAT.py - PH.h * PAT.ps / 2;
    layer(ctx, pe, () => phone(ctx, PAT.px, PAT.py + (1 - pe) * 60, PAT.ps, (c) => shot(c, 3)));
    // notificación de recordatorio
    const ne = back(prog(t, CUES.notif, CUES.notif + 0.55));
    const nOut = 1 - eio(prog(t, 28.6, 29.1));
    if (ne > 0) layer(ctx, clamp(ne) * nOut, () => {
      const bw = 470, bh = 112, bx = PAT.px - bw / 2, by = top + 54 - (1 - ne) * 60;
      shadow(ctx, 40, 16, 'rgba(15,30,55,0.25)');
      fillRR(ctx, bx, by, bw, bh, 28, 'rgba(255,255,255,0.97)'); noShadow(ctx);
      fillRR(ctx, bx + 20, by + 22, 68, 68, 16, '#fff');
      strokeRR(ctx, bx + 20, by + 22, 68, 68, 16, C.line, 1.5);
      drawLogoMark(ctx, bx + 29, by + 35, 42);
      text(ctx, 'FLUXIA', bx + 106, by + 40, { size: 14, weight: 600, color: C.ink3, spacing: 1.5 });
      text(ctx, 'ahora', bx + bw - 22, by + 40, { size: 14, weight: 400, color: C.ink3, align: 'right' });
      text(ctx, '¿Has hecho hoy tu registro?', bx + 106, by + 68, { size: 20, weight: 600, color: C.ink });
      text(ctx, 'Solo te lleva unos toques.', bx + 106, by + 93, { size: 17, weight: 400, color: C.ink2 });
      const ring = prog(t, CUES.notif + 0.1, CUES.notif + 0.9);
      if (ring > 0 && ring < 1) {
        ctx.save(); ctx.translate(bx + bw - 8, by + 4); ctx.rotate(Math.sin(ring * 30) * 0.35 * (1 - ring));
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
        icon(ctx, 'bell', 0, 0, 24, '#fff', 2.4); ctx.restore();
      }
    });
    // tres ventajas
    const TX = 930, TW = 880;
    const tiles = [
      ['smartphone', C.green, 'Fácil e intuitivo', 'Unos toques, sin formación. Solo ve lo que su profesional activa.'],
      ['bell', C.orange, 'Recordatorios automáticos', 'Si pasa el plazo sin registrar, Fluxia le avisa.'],
      ['heart', C.teal, 'Gratis, siempre', 'La app del paciente no tiene ningún coste.'],
    ];
    tiles.forEach(([ic, col, title, sub], i) => {
      const t0 = CUES.tiles[i];
      const e = eo(prog(t, t0, t0 + 0.55));
      if (e <= 0) return;
      const ty = 262 + i * 128;
      layer(ctx, e, () => {
        ctx.translate((1 - e) * 60, 0);
        shadow(ctx, 30, 10, 'rgba(20,40,70,0.08)');
        fillRR(ctx, TX, ty, TW, 108, 24, 'rgba(255,255,255,0.95)'); noShadow(ctx);
        badge(ctx, ic, TX + 62, ty + 54, 34, col, back(prog(t, t0 + 0.1, t0 + 0.5)));
        text(ctx, title, TX + 118, ty + 46, { size: 26, weight: 600, color: C.ink });
        text(ctx, sub, TX + 118, ty + 80, { size: 19, weight: 300, color: C.ink2, maxWidth: TW - 150 });
      });
    });
    // infografía de adherencia
    const ae = eo(prog(t, 23.6, 24.2));
    layer(ctx, ae, () => {
      const y0 = 660, hh = 290;
      ctx.translate(0, (1 - ae) * 30);
      shadow(ctx, 30, 10, 'rgba(20,40,70,0.08)');
      fillRR(ctx, TX, y0, TW, hh, 24, 'rgba(255,255,255,0.95)'); noShadow(ctx);
      badge(ctx, 'trending', TX + 50, y0 + 50, 26, C.green);
      text(ctx, 'Mayor adherencia', TX + 90, y0 + 59, { size: 26, weight: 600, color: C.ink });
      text(ctx, '4 semanas de registro diario', TX + TW - 32, y0 + 57, { size: 16, weight: 400, color: C.ink3, align: 'right' });
      const cx0 = TX + 236, cs = 18, cg = (TW - 236 - 32 - cs * NCELLS) / (NCELLS - 1);
      const rows = [['Sin recordatorios', C.ink3, y0 + 120], ['Con Fluxia', C.green, y0 + 190]];
      rows.forEach(([label, col, ry], r) => {
        text(ctx, label, TX + 32, ry + 6, { size: 19, weight: r ? 600 : 400, color: r ? mix(C.green, '#1D2733', 0.3) : C.ink2 });
        for (let i = 0; i < NCELLS; i++) {
          const x = cx0 + i * (cs + cg);
          fillRR(ctx, x, ry - cs / 2 - 6, cs, cs + 12, 6, '#EEF1F4');
          let f = 0, col2 = r ? C.green : '#B9C2CC';
          if (!r) f = NO_REMINDER[i] * eo(prog(t, 24.0 + i * 0.012, 24.3 + i * 0.012));
          else {
            const tc = cellTime(i), g = GAPS.indexOf(i);
            if (g < 0) f = eo(prog(t, tc, tc + 0.18));
            else {
              const tr = CUES.recovered[g];
              f = eo(prog(t, tr + 0.3, tr + 0.5));
              // hueco pendiente → aviso → registrado
              if (t >= tc && f < 1) strokeRR(ctx, x - 1, ry - cs / 2 - 7, cs + 2, cs + 14, 7, C.orange, 2);
              const be = back(prog(t, tr, tr + 0.35)), bo = 1 - prog(t, tr + 0.9, tr + 1.3);
              if (be > 0 && bo > 0) layer(ctx, clamp(be) * bo, () => {
                ctx.save(); ctx.translate(x + cs / 2, ry - 44); ctx.scale(be, be);
                ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fillStyle = C.orange; ctx.fill();
                icon(ctx, 'bell', 0, 0, 20, '#fff', 2.4); ctx.restore();
              });
            }
          }
          if (f > 0) {
            const hh2 = (cs + 12) * f;
            fillRR(ctx, x, ry + cs / 2 + 6 - hh2, cs, hh2, 6, col2);
          }
        }
      });
      const le = eo(prog(t, 27.4, 27.9));
      layer(ctx, le, () => {
        icon(ctx, 'bell', TX + 44, y0 + 252, 20, C.orange, 2.2);
        text(ctx, 'Cuando falta un registro, un recordatorio ayuda a no perder el día.', TX + 66, y0 + 259, { size: 17, weight: 400, color: C.ink2 });
      });
    });
  });
}

// 5 · Para el profesional: más información, más precisa, de un vistazo.
const CARDS = [
  { ic: 'chart', col: C.blue, title: 'Más información', body: ['Cada registro queda guardado', 'con su fecha y hora: semanas', 'de datos entre visitas.'] },
  { ic: 'target', col: C.teal, title: 'Más precisa', body: ['Escala de Bristol, síntomas', 'y cantidades estructurados.', 'Nada depende de la memoria.'] },
  { ic: 'gauge', col: C.orange, title: 'Prioriza de un vistazo', body: ['Semáforo con tus propios', 'umbrales: sabes quién', 'necesita atención.'] },
  { ic: 'clipboard', col: C.green, title: 'Consultas preparadas', body: ['Tendencias e informe PDF', 'listo para la historia clínica,', 'antes o durante la visita.'] },
];
const CW = 830, CH = 305;
const cardPos = (i) => [110 + (i % 2) * (CW + 40), 262 + Math.floor(i / 2) * (CH + 30)];
const BARS = [3, 5, 4, 6, 5, 6, 4, 6];
const TREND = [2, 2, 3, 2, 2, 3, 3, 3, 4, 3, 4, 4, 4, 4, 5, 4, 4, 4, 4, 5, 4, 4];
const SORT_ROWS = [
  { n: 'Carmen Ruiz', sem: 'green', ini: 'CR', col: '#3C7DB8' },
  { n: 'José Gil', sem: 'red', ini: 'JG', col: '#8480C9' },
  { n: 'Lucía Martín', sem: 'green', ini: 'LM', col: '#4DA078' },
  { n: 'Antonio Pérez', sem: 'orange', ini: 'AP', col: '#E09F3C' },
];
const SORTED = [1, 3, 0, 2]; // rojo → naranja → verdes

function vizInfo(ctx, t, c0, f) {
  // contador de registros y barras semanales
  const n = Math.round(34 * eo(prog(t, c0 + 0.2, c0 + 1.6))) + (t >= f + 0.5 ? 1 : 0);
  const bump = back(prog(t, f + 0.5, f + 0.8));
  text(ctx, String(n), 470, 92, { size: 58, weight: 700, color: C.blue });
  text(ctx, 'registros este mes', 470 + measure(ctx, String(n), 58, 700) + 14, 88, { size: 18, weight: 400, color: C.ink2 });
  const bx = 470, by = 270, bw = 34, gap = 10.5, mh = 24;
  BARS.forEach((v, i) => {
    const last = i === BARS.length - 1;
    const g = eo(prog(t, c0 + 0.3 + i * 0.06, c0 + 0.9 + i * 0.06));
    const hv = (v + (last && t >= f + 0.5 ? bump : 0)) * mh * g;
    fillRR(ctx, bx + i * (bw + gap), by - hv, bw, hv, 8, last ? C.blue : rgba(C.blue, 0.3));
  });
  const pe = back(prog(t, f + 0.4, f + 0.75)), po = 1 - prog(t, f + 1.3, f + 1.6);
  if (pe > 0 && po > 0) layer(ctx, clamp(pe) * po, () => {
    const x = bx + 7 * (bw + gap) + bw / 2, y = by - 7 * mh - 40;
    fillRR(ctx, x - 26, y - 18, 52, 34, 17, C.blue);
    text(ctx, '+1', x, y + 6, { size: 17, weight: 700, color: '#fff', align: 'center' });
  });
}
function vizPrecise(ctx, t, c0, f) {
  const hi = eo(prog(t, f + 0.1, f + 0.5));
  for (let n = 1; n <= 7; n++) {
    const e = eo(prog(t, c0 + 0.2 + n * 0.05, c0 + 0.6 + n * 0.05));
    const x = 470 + (n - 1) * 48 + 20;
    layer(ctx, e * (n === 4 ? 1 : 1 - 0.55 * hi), () => {
      if (n === 4 && hi > 0) fillRR(ctx, x - 24, 40, 48, 72, 14, rgba(C.teal, 0.16 * hi));
      bristolImg(ctx, n, x, 66, 42);
      text(ctx, String(n), x, 100, { size: 13, weight: 600, color: n === 4 ? mix(C.teal, '#1D2733', 0.3) : C.ink3, align: 'center' });
    });
  }
  const re = eo(prog(t, f + 0.3, f + 0.8));
  layer(ctx, re, () => {
    ctx.translate((1 - re) * 30, 0);
    fillRR(ctx, 456, 130, 350, 140, 18, '#F6F8FA');
    bristolImg(ctx, 4, 500, 172, 56);
    text(ctx, '27 abr · 19:57', 540, 166, { size: 19, weight: 600, color: C.ink });
    text(ctx, 'Tipo 4 · Normal · Flota', 540, 190, { size: 14, weight: 400, color: C.ink2 });
    let cx = 476;
    ['Hinchazón', 'Gases', 'Sin dolor'].forEach((s, i) => {
      const ce = back(prog(t, f + 0.6 + i * 0.12, f + 0.9 + i * 0.12));
      if (ce <= 0) return;
      const cw = measure(ctx, s, 14, 500) + 26;
      layer(ctx, clamp(ce), () => {
        fillRR(ctx, cx, 222, cw, 30, 15, i === 2 ? rgba(C.green, 0.14) : '#F0EEFB');
        text(ctx, s, cx + 13, 242, { size: 14, weight: 500, color: i === 2 ? mix(C.green, '#1D2733', 0.3) : '#5B55A8' });
      });
      cx += cw + 8;
    });
  });
  layer(ctx, 1 - re, () => text(ctx, 'Escala de Bristol (1–7)', 470, 180, { size: 17, weight: 400, color: C.ink3 }));
}
function vizTriage(ctx, t, c0, f) {
  const s = eio(prog(t, f + 0.2, f + 1.0));
  SORT_ROWS.forEach((r, i) => {
    const e = eo(prog(t, c0 + 0.2 + i * 0.08, c0 + 0.7 + i * 0.08));
    const y = lerp(56 + i * 58, 56 + SORTED.indexOf(i) * 58, s);
    layer(ctx, e, () => {
      fillRR(ctx, 456, y - 24, 350, 48, 14, '#F6F8FA');
      avatar(ctx, 484, y, 16, r.ini, r.col);
      text(ctx, r.n, 510, y + 6, { size: 16, weight: 500, color: C.ink });
      const pulse = r.sem === 'red' && t > f + 1.0 ? ((t - f - 1.0) % 1.1) / 1.1 : 0;
      semPill(ctx, 794, y, r.sem, { pulse, align: 'right', size: 12 });
    });
  });
}
function pdfDoc(ctx, x, y, w, h) {
  const fo = w * 0.28;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - fo, y); ctx.lineTo(x + w, y + fo); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#D5DBE3'; ctx.lineWidth = 2; ctx.stroke();
  fillRR(ctx, x - w * 0.12, y + h * 0.52, w * 0.78, h * 0.26, 5, '#D26464');
  text(ctx, 'PDF', x + w * 0.27, y + h * 0.71, { size: h * 0.17, weight: 700, color: '#fff', align: 'center' });
  ctx.fillStyle = '#E3E8EE';
  for (let i = 0; i < 3; i++) ctx.fillRect(x + w * 0.14, y + h * (0.2 + i * 0.1), w * (0.55 - i * 0.1), 3);
}
function vizPrepared(ctx, t, c0, f) {
  const gx = 460, gy = 56, gw = 250, gh = 170;
  const yv = (v) => gy + gh - (v - 1) / 6 * gh;
  fillRR(ctx, gx, yv(5) - 4, gw, yv(3) - yv(5) + 8, 8, rgba(C.green, 0.12));
  text(ctx, 'Rango normal (3–5)', gx, yv(5) - 14, { size: 12, weight: 600, color: mix(C.green, '#1D2733', 0.3) });
  const p = eio(prog(t, c0 + 0.3, c0 + 1.8));
  const n = TREND.length, upto = p * (n - 1);
  ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= Math.floor(upto); i++) {
    const x = gx + i / (n - 1) * gw, y = yv(TREND[i]);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  if (upto < n - 1) {
    const i = Math.floor(upto), fr = upto - i;
    ctx.lineTo(gx + (i + fr) / (n - 1) * gw, yv(lerp(TREND[i], TREND[i + 1], fr)));
  }
  ctx.stroke();
  text(ctx, 'Tendencia Bristol', gx, gy + gh + 30, { size: 14, weight: 500, color: C.ink3 });
  const pe = back(prog(t, f + 0.2, f + 0.7));
  if (pe > 0) layer(ctx, clamp(pe), () => {
    ctx.save(); ctx.translate(762, 150); ctx.scale(pe, pe); ctx.rotate((1 - pe) * 0.3);
    shadow(ctx, 20, 8, 'rgba(20,40,70,0.18)');
    pdfDoc(ctx, -36, -48, 72, 96); noShadow(ctx);
    ctx.restore();
    text(ctx, 'Informe', 762, 238, { size: 14, weight: 600, color: C.ink2, align: 'center' });
  });
}
const VIZ = [vizInfo, vizPrecise, vizTriage, vizPrepared];

function sceneDoctor(ctx, t) {
  const [a, b] = SCENES.doctor;
  if (t < a || t > b) return;
  heading(ctx, t, a, b, { eyebrow: 'PARA EL PROFESIONAL SANITARIO', color: C.blue, title: 'Más información, más precisa, para decidir mejor' });
  const out = 1 - eio(prog(t, b - 0.55, b));
  layer(ctx, out, () => {
    CARDS.forEach((cd, i) => {
      const c0 = CUES.cards[i], f = CUES.focus[i];
      const e = eo(prog(t, c0, c0 + 0.6));
      if (e <= 0) return;
      const [x, y] = cardPos(i);
      const foc = Math.min(eo(prog(t, f, f + 0.35)), 1 - eo(prog(t, f + 1.5, f + 1.85)));
      layer(ctx, e, () => {
        ctx.translate(x + CW / 2, y + CH / 2 + (1 - e) * 40);
        const s = 1 + 0.025 * foc;
        ctx.scale(s, s);
        ctx.translate(-CW / 2, -CH / 2);
        shadow(ctx, 30 + 20 * foc, 10 + 8 * foc, `rgba(20,40,70,${0.08 + 0.08 * foc})`);
        fillRR(ctx, 0, 0, CW, CH, 26, 'rgba(255,255,255,0.96)'); noShadow(ctx);
        if (foc > 0) strokeRR(ctx, 1, 1, CW - 2, CH - 2, 25, rgba(cd.col, 0.6 * foc), 3);
        badge(ctx, cd.ic, 72, 76, 36, cd.col, back(prog(t, c0 + 0.1, c0 + 0.5)));
        text(ctx, cd.title, 40, 160, { size: 30, weight: 600, color: C.ink });
        lines(ctx, cd.body, 40, 200, 30, { size: 19, weight: 300, color: C.ink2 });
        VIZ[i](ctx, t, c0, f);
      });
    });
  });
}

// 6 · El resultado: la cadena que lleva a mejores decisiones.
const NODES = [
  { ic: 'smartphone', col: C.green, l: ['Fácil y con', 'recordatorios'] },
  { ic: 'calendarCheck', col: C.teal, l: ['Mayor', 'adherencia'] },
  { ic: 'chart', col: C.blue, l: ['Información completa', 'y precisa'] },
  { ic: 'check', col: C.blue, l: ['Mejores decisiones', 'clínicas'], final: true },
];
const NX = [330, 750, 1170, 1590], NY = 520;

function sceneDecision(ctx, t) {
  const [a, b] = SCENES.decision;
  if (t < a || t > b) return;
  heading(ctx, t, a, b, { eyebrow: 'EL RESULTADO', color: C.violet, title: 'Mejores datos, mejores decisiones' });
  const out = 1 - eio(prog(t, b - 0.55, b));
  layer(ctx, out, () => {
    // conectores con el degradado de la marca
    for (let i = 0; i < 3; i++) {
      const r0 = NODES[i].final ? 104 : 84, r1 = NODES[i + 1].final ? 104 : 84;
      const xa = NX[i] + r0 + 18, xb = NX[i + 1] - r1 - 18;
      const p = eio(prog(t, CUES.nodes[i] + 0.25, CUES.nodes[i + 1]));
      if (p <= 0) continue;
      const xe = lerp(xa, xb, p);
      const g = ctx.createLinearGradient(xa, 0, xb, 0);
      g.addColorStop(0, BRAND[Math.min(i, 3)]); g.addColorStop(1, BRAND[Math.min(i + 1, 3)]);
      ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xa, NY); ctx.lineTo(xe, NY); ctx.stroke();
      ctx.fillStyle = BRAND[Math.min(i + 1, 3)];
      ctx.beginPath(); ctx.moveTo(xe + 12, NY); ctx.lineTo(xe - 8, NY - 13); ctx.lineTo(xe - 8, NY + 13); ctx.closePath(); ctx.fill();
    }
    NODES.forEach((n, i) => {
      const t0 = CUES.nodes[i];
      const e = back(prog(t, t0, t0 + 0.5));
      if (e <= 0) return;
      const r = n.final ? 104 : 84;
      layer(ctx, clamp(e), () => {
        ctx.save(); ctx.translate(NX[i], NY); ctx.scale(e, e);
        if (n.final) {
          const glow = (Math.sin((t - t0) * 3) + 1) / 2;
          ctx.beginPath(); ctx.arc(0, 0, r + 14 + glow * 10, 0, Math.PI * 2); ctx.fillStyle = rgba('#78AD89', 0.12); ctx.fill();
          shadow(ctx, 40, 14, 'rgba(60,125,184,0.35)');
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = brandGradient(ctx, -r, -r, r, r); ctx.fill(); noShadow(ctx);
          iconCheck(ctx, 0, 4, 92, '#fff', 11, eo(prog(t, t0 + 0.2, t0 + 0.7)));
        } else {
          shadow(ctx, 30, 10, 'rgba(20,40,70,0.14)');
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
          ctx.lineWidth = 4; ctx.strokeStyle = rgba(n.col, 0.35); ctx.stroke();
          icon(ctx, n.ic, 0, 0, 70, n.col, 2);
        }
        ctx.restore();
        const ly = NY + r + 58;
        text(ctx, n.l[0], NX[i], ly, { size: n.final ? 27 : 24, weight: n.final ? 600 : 500, color: C.ink, align: 'center' });
        text(ctx, n.l[1], NX[i], ly + 34, { size: n.final ? 27 : 24, weight: n.final ? 600 : 500, color: n.final ? C.blue : C.ink, align: 'center' });
      });
    });
    const fe = eo(prog(t, 43.9, 44.4));
    layer(ctx, fe, () => {
      ctx.translate(0, (1 - fe) * 14);
      text(ctx, 'Un seguimiento más cercano para el paciente y decisiones basadas en datos reales para el profesional.', W / 2, 880, { size: 23, weight: 300, color: C.ink2, align: 'center' });
    });
  });
}

// 7 · Cierre con logo y llamada a la acción.
function sceneOutro(ctx, t) {
  const [a] = SCENES.outro;
  if (t < a) return;
  const h = 120;
  const mw = LOGO.w * h / LOGO.h;
  const ww = mw + h * 0.26 + measure(ctx, 'Fluxia', h * 0.9, 600);
  const x = (W - ww) / 2, y = 300;
  drawLogoMark(ctx, x, y, h, eio(prog(t, CUES.outroLogo, CUES.outroLogo + 1.1)));
  const word = eo(prog(t, 45.8, 46.4));
  layer(ctx, word, () => text(ctx, 'Fluxia', x + mw + h * 0.26 + (1 - word) * 30, y + h * 0.86, { size: h * 0.9, weight: 600, color: '#383838', spacing: -1.2 }));
  const t1 = eo(prog(t, 46.2, 46.8));
  layer(ctx, t1, () => {
    ctx.translate(0, (1 - t1) * 18);
    text(ctx, 'Más adherencia. Mejores datos. Mejores decisiones.', W / 2, 530, { size: 38, weight: 500, color: C.ink, align: 'center' });
  });
  const t2 = back(prog(t, 46.7, 47.3));
  layer(ctx, clamp(t2), () => {
    ctx.translate(W / 2, 640); ctx.scale(t2, t2);
    shadow(ctx, 30, 12, 'rgba(60,125,184,0.35)');
    const g = ctx.createLinearGradient(-250, 0, 250, 0);
    g.addColorStop(0, '#4DA078'); g.addColorStop(1, C.blue);
    fillRR(ctx, -250, -38, 500, 76, 38, g); noShadow(ctx);
    text(ctx, 'Empieza gratis · fluxia-health.com', 0, 9, { size: 25, weight: 600, color: '#fff', align: 'center' });
  });
  const t3 = eo(prog(t, 47.2, 47.8));
  layer(ctx, t3, () => {
    [['App gratuita para pacientes', C.green], ['Panel web y app para profesionales', C.blue]].forEach(([s, col], i) => {
      const cx = W / 2 + (i ? 1 : -1) * 250;
      ctx.beginPath(); ctx.arc(cx - measure(ctx, s, 20, 400) / 2 - 18, 753, 6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      text(ctx, s, cx, 760, { size: 20, weight: 400, color: C.ink2, align: 'center' });
    });
  });
}

function cornerLogo(ctx, t) {
  const a = win(t, 4.0, 45.0, 0.5, 0.5);
  if (a > 0) layer(ctx, a, () => drawLogo(ctx, 64, 50, 38));
}

export function renderFrame(ctx, t) {
  ctx.save();
  drawBackground(ctx, t);
  cornerLogo(ctx, t);
  sceneIntro(ctx, t);
  sceneProblem(ctx, t);
  sceneSolution(ctx, t);
  scenePatient(ctx, t);
  sceneDoctor(ctx, t);
  sceneDecision(ctx, t);
  sceneOutro(ctx, t);
  ctx.restore();
}
