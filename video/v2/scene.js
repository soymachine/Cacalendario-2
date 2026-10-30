// Fluxia — vídeo v2 (≈96 s). Mezcla, en un único <canvas>, los planos de
// personajes del vídeo de marketing original (frames JPEG extraídos con
// FFmpeg) con demos animadas construidas sobre los pantallazos actuales de
// la app del paciente (PA) y del panel del profesional (MW).
// renderFrame(ctx, t) es asíncrona sólo porque carga los frames del vídeo
// original; el resultado depende únicamente de t.
import { WIDTH as W, HEIGHT as H, SRC_FPS, XFADE, SHOTS, CUES, INSERT, shotAt, srcTime } from './timeline.js';
import {
  clamp, lerp, prog, eo, eio, back, win, mix, rgba, rr, fillRR, strokeRR, shadow, noShadow,
  text, measure, layer, cursorArrow, ripple, iconCheck, iconPdf, path, drawLogoMark,
} from '../scene.js';

const BG = '#ECEDDD';          // fondo del vídeo original
const NAVY = '#2B2B39';        // marco del móvil del vídeo original
const BLUE = '#3C7DB8', APP_BLUE = '#3F7EC1', GREEN = '#3F9E6E', ORANGE = '#E09F3C', RED = '#D9534F', INK = '#1D2733', INK2 = '#5B6675';

// ------------------------------------------------------------------ activos
const IMG = {};
// Prefijo de rutas (assets y frames) para reutilizar estas escenas desde otra página.
let BASE = '';
export function setBase(b) { BASE = b; }
const ASSET_FILES = {
  appPoop: 'assets/app-deposicion.png', appUrine: 'assets/app-miccion.png', appFood: 'assets/app-comida.png', appSymptoms: 'assets/app-sintomas.png',
  webHome: 'assets/web-inicio.webp', webList: 'assets/web-pacientes.webp', webDetail: 'assets/web-detalle.webp',
  webStats: 'assets/web-detalle-estadisticas.webp', webConfig: 'assets/web-configuracion.webp',
};
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
}
export async function loadAssets() {
  await Promise.all(Object.entries(ASSET_FILES).map(async ([k, f]) => { IMG[k] = await loadImage(BASE + f); }));
}
// Frames del vídeo original (out/src/f00001.jpg …), con una pequeña caché.
const frameCache = new Map();
function srcFrame(n) {
  n = Math.max(1, n);
  if (!frameCache.has(n)) {
    frameCache.set(n, loadImage(`${BASE}out/src/f${String(n).padStart(5, '0')}.jpg`));
    if (frameCache.size > 12) frameCache.delete(frameCache.keys().next().value);
  }
  return frameCache.get(n);
}
async function drawOrig(ctx, shot, t) {
  const st = srcTime(shot, t) * SRC_FPS;           // posición en frames de origen
  const i = Math.floor(st), f = st - i;
  const a = await srcFrame(i + 1);
  ctx.drawImage(a, 0, 0, W, H);
  if (f > 0.02) {                                   // fundido entre frames vecinos (cámara lenta suave)
    const b = await srcFrame(i + 2);
    ctx.save(); ctx.globalAlpha *= f; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
  }
}

// ---------------------------------------------------------- pictogramas PA
// Mismos trazados que mobile/src/components/icons.tsx (viewBox 88×88).
const P_POOP = new Path2D('M30 63H58A6 6 0 0 0 58 51H55A5 5 0 0 0 55 41H51A4.5 4.5 0 0 0 51 32C51 28 48 25.5 45 23C44 27 40.5 29.5 37 32A4.5 4.5 0 0 0 37 41H33A5 5 0 0 0 33 51H30A6 6 0 0 0 30 63Z');
const P_DROP = new Path2D('M44 22C44 22 30.5 37 30.5 48A13.5 13.5 0 0 0 57.5 48C57.5 37 44 22 44 22Z');
function picto(ctx, kind, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 88, size / 88);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 5.1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(44, 44, 41.2, 0, Math.PI * 2); ctx.stroke();
  if (kind === 'poop') ctx.stroke(P_POOP);
  else if (kind === 'urine') ctx.stroke(P_DROP);
  else {
    ctx.save(); ctx.translate(44, 44); ctx.rotate(-Math.PI / 4); ctx.translate(-44, -44);
    for (let i = 0; i < 3; i++) { rr(ctx, 35 + i * 7, 14, 4, 14, 2); ctx.fill(); }
    ctx.fill(new Path2D('M35 26H53V29C53 33.5 48 35.5 46.55 39V44H41.45V39C40 35.5 35 33.5 35 29Z'));
    ctx.beginPath(); ctx.moveTo(44, 40); ctx.lineTo(44, 69); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(44, 44); ctx.rotate(Math.PI / 4); ctx.translate(-44, -44);
    ctx.beginPath(); ctx.ellipse(44, 23, 8.5, 11.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(44, 34.5); ctx.lineTo(44, 69); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
const KINDS = [
  { kind: 'poop', label: 'Deposiciones', color: '#8A5A3C' },
  { kind: 'urine', label: 'Micciones', color: '#C9A227' },
  { kind: 'food', label: 'Alimentación', color: GREEN },
];

// ------------------------------------------------------------------ móvil
// Marco plano como el del vídeo original, con un pantallazo real dentro.
const PH = { sw: 397, sh: 860, pad: 15 };
function phoneFrame(ctx, cx, cy, s, drawScreen) {
  const w = PH.sw + PH.pad * 2, h = PH.sh + PH.pad * 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  shadow(ctx, 60, 26, 'rgba(40,45,30,0.22)');
  fillRR(ctx, -w / 2, -h / 2, w, h, 66, NAVY); noShadow(ctx);
  fillRR(ctx, -w / 2 - 7, -h / 2 + 170, 9, 70, 3, NAVY);
  fillRR(ctx, -w / 2 - 7, -h / 2 + 260, 9, 70, 3, NAVY);
  fillRR(ctx, w / 2 - 2, -h / 2 + 210, 9, 110, 3, NAVY);
  ctx.save();
  rr(ctx, -PH.sw / 2, -PH.sh / 2, PH.sw, PH.sh, 52); ctx.clip();
  ctx.translate(-PH.sw / 2, -PH.sh / 2);
  drawScreen();
  ctx.restore();
  fillRR(ctx, -62, -h / 2 + 26, 124, 34, 17, '#000');
  ctx.restore();
}
// Pantallazo de la app (1179×2556) escalado a la pantalla del marco.
const APP_W = 1179, APP_K = PH.sw / APP_W;
function appShot(ctx, img, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.drawImage(img, 0, 0, PH.sw, PH.sw * img.height / img.width);
  ctx.restore();
}
// Coordenadas en píxeles del pantallazo → pantalla del marco.
const A = (v) => v * APP_K;
function touch(ctx, x, y, pressing, alpha) {
  layer(ctx, alpha, () => {
    ctx.beginPath(); ctx.arc(x, y, 24 - pressing * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30,40,60,${0.2 + pressing * 0.15})`; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.stroke();
  });
}
const pulse = (t, c, d = 0.24) => Math.sin(Math.PI * prog(t, c - d / 2, c + d / 2));

// --------------------------------------------------------------- navegador
// Ventana con el pantallazo del panel (2000×~1075) y una "cámara" para
// acercar y desplazar dentro de la página.
const WEB_W = 2000, WEB_H = 1075, BAR = 46;
function browser(ctx, x, y, w, drawPage, cam = { x: WEB_W / 2, y: WEB_H / 2, z: 1 }) {
  const s = w / WEB_W, h = BAR + WEB_H * s;
  shadow(ctx, 70, 30, 'rgba(40,45,30,0.20)');
  fillRR(ctx, x, y, w, h, 18, '#fff'); noShadow(ctx);
  ctx.save();
  rr(ctx, x, y, w, h, 18); ctx.clip();
  ctx.fillStyle = '#F1F2EC'; ctx.fillRect(x, y, w, BAR);
  ['#F26B5B', '#F5BE4F', '#5CC468'].forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 26 + i * 21, y + BAR / 2, 6.5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); });
  const uw = Math.min(460, w * 0.4);
  fillRR(ctx, x + (w - uw) / 2, y + 9, uw, 28, 14, '#fff');
  text(ctx, 'fluxia-health.com/medics', x + w / 2, y + 28, { size: 13, color: INK2, align: 'center' });
  ctx.beginPath(); ctx.rect(x, y + BAR, w, h - BAR); ctx.clip();
  ctx.translate(x, y + BAR); ctx.scale(s, s);
  // cámara: (cam.x, cam.y) queda en el centro con zoom cam.z
  ctx.translate(WEB_W / 2, WEB_H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  drawPage();
  ctx.restore();
  return { s, h };
}
function webImg(ctx, img, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(img, 0, 0, WEB_W, WEB_W * img.height / img.width); ctx.restore();
}
// Resalte (en coordenadas de pantallazo).
function highlight(ctx, x, y, w, h, color, a, r = 14) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rgba(color, 0.10); rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}
function callout(ctx, x, y, label, color, a, { size = 22, icon } = {}) {
  if (a <= 0) return;
  const e = back(clamp(a));
  layer(ctx, clamp(a), () => {
    ctx.translate(x, y); ctx.scale(e, e);
    const left = icon ? 62 : 40, w = measure(ctx, label, size, 600) + left + size * 1.3, h = size * 2.3;
    shadow(ctx, 24, 8, 'rgba(40,45,30,0.18)');
    fillRR(ctx, -w / 2, -h / 2, w, h, h / 2, '#fff'); noShadow(ctx);
    if (icon) { icon(-w / 2 + 34, 0); }
    else { ctx.beginPath(); ctx.arc(-w / 2 + 24, 0, 7, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
    text(ctx, label, -w / 2 + left, size * 0.36, { size, weight: 600, color: INK });
  });
}

// ================================================================ ESCENAS
// --- Plato (sobre el plano original de la paciente, junto a sus iconos) ---
function foodIconOverlay(ctx, t) {
  const e = back(prog(t, CUES.foodIcon, CUES.foodIcon + 0.45));
  if (e <= 0) return;
  ctx.save(); ctx.translate(610, 840); ctx.scale(e, e);
  const k = 1.15;
  ctx.lineWidth = 7; ctx.strokeStyle = '#151515'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // cubiertos
  ctx.fillStyle = '#C9D33A';
  rr(ctx, -112 * k, -60 * k, 16 * k, 120 * k, 8 * k); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-104 * k, -60 * k); ctx.lineTo(-104 * k, -20 * k); ctx.stroke();
  ctx.fillStyle = '#C9D33A';
  ctx.beginPath(); ctx.moveTo(96 * k, 60 * k); ctx.lineTo(96 * k, -60 * k); ctx.quadraticCurveTo(122 * k, -40 * k, 112 * k, 0); ctx.lineTo(112 * k, 60 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  // plato
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 78 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E8F1C8'; ctx.beginPath(); ctx.arc(0, 0, 54 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // comida: hoja verde + tomate
  ctx.fillStyle = '#4DB06A'; ctx.beginPath(); ctx.ellipse(-12 * k, 6 * k, 26 * k, 15 * k, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F05A5A'; ctx.beginPath(); ctx.arc(20 * k, -12 * k, 15 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// --- App del paciente: deposiciones, micciones y alimentación -------------
function sceneApp(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const [s0] = [33.2];
  // columna de tipos de registro
  const section = t < CUES.tabUrine ? 0 : t < CUES.tabFood ? 1 : 2;
  const inL08 = t >= 36.15;
  const cur = CUES.trio.filter((c) => t >= c - 0.15).length - 1;
  layer(ctx, eo(prog(t, s0 + 0.2, s0 + 0.8)), () => text(ctx, 'Con la app, el paciente registra', 200, 300, { size: 30, weight: 300, color: INK2 }));
  KINDS.forEach((k, i) => {
    const e = eo(prog(t, CUES.trio[i] - 0.15, CUES.trio[i] + 0.35));
    if (e <= 0) return;
    const y = 400 + i * 150;
    const active = inL08 ? section === i : i === cur;
    const dim = inL08 && !active ? 0.45 : 1;
    layer(ctx, e * dim, () => {
      ctx.translate((1 - e) * -40, 0);
      const r = 52 + (active ? 6 * Math.min(1, pulse(t, CUES.trio[i] + 0.1, 0.5) + (inL08 ? 0.6 : 0)) : 0);
      shadow(ctx, 24, 8, 'rgba(40,45,30,0.16)');
      ctx.beginPath(); ctx.arc(260, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
      picto(ctx, k.kind, 260, y, 70, APP_BLUE);
      text(ctx, k.label, 340, y + 17, { size: 52, weight: 600, color: INK, spacing: -0.8 });
    });
  });
  // móvil
  const enter = eo(prog(t, s0, s0 + 0.7));
  phoneFrame(ctx, 1320, 540 + (1 - enter) * 60, 1.02, () => {
    const imgs = [IMG.appPoop, IMG.appUrine, IMG.appFood];
    appShot(ctx, imgs[0]);
    appShot(ctx, imgs[1], prog(t, CUES.tabUrine + 0.05, CUES.tabUrine + 0.3));
    appShot(ctx, imgs[2], prog(t, CUES.tabFood + 0.05, CUES.tabFood + 0.3));
    // anillos sobre las pestañas al nombrar cada tipo (L07)
    const tabs = [[230, 905], [590, 905], [944, 905]];
    tabs.forEach(([x, y], i) => {
      const a = win(t, CUES.trio[i] - 0.1, (CUES.trio[i + 1] ?? 36.2) + 0.1, 0.2, 0.25);
      if (a > 0 && t < 36.15) layer(ctx, a, () => {
        ctx.strokeStyle = '#F2C94C'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(A(x), A(y), A(78) + 4 * pulse(t, CUES.trio[i] + 0.15, 0.5), 0, Math.PI * 2); ctx.stroke();
      });
    });
    // selección: tipo 4 de Bristol
    const sel = prog(t, CUES.tapBristol, CUES.tapBristol + 0.2) * (1 - prog(t, CUES.tabUrine, CUES.tabUrine + 0.2));
    if (sel > 0) layer(ctx, sel, () => { ctx.strokeStyle = APP_BLUE; ctx.lineWidth = 3.5; rr(ctx, A(172), A(1462), A(262), A(256), 12); ctx.stroke(); });
    // selección: micción voluntaria
    const selU = prog(t, CUES.tapUrine, CUES.tapUrine + 0.2) * (1 - prog(t, CUES.tabFood, CUES.tabFood + 0.2));
    if (selU > 0) layer(ctx, selU, () => {
      ctx.fillStyle = rgba(APP_BLUE, 0.14); rr(ctx, A(96), A(1162), A(984), A(106), 10); ctx.fill();
      ctx.strokeStyle = APP_BLUE; ctx.lineWidth = 3; ctx.stroke();
    });
    // foto: destello + aviso
    const fl = 1 - prog(t, CUES.tapPhoto + 0.1, CUES.tapPhoto + 0.5);
    if (t > CUES.tapPhoto + 0.1 && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.85 * fl})`; ctx.fillRect(0, 0, PH.sw, PH.sh); }
    const ok = eo(prog(t, CUES.tapPhoto + 0.4, CUES.tapPhoto + 0.8));
    if (ok > 0) layer(ctx, ok, () => {
      // aviso tipo "toast" bajo la isla dinámica
      const y = 64 + (1 - ok) * -16;
      shadow(ctx, 16, 6, 'rgba(0,0,0,0.18)');
      fillRR(ctx, 40, y, PH.sw - 80, 46, 23, '#fff'); noShadow(ctx);
      ctx.beginPath(); ctx.arc(66, y + 23, 12, 0, Math.PI * 2); ctx.fillStyle = GREEN; ctx.fill();
      iconCheck(ctx, 66, y + 23, 13, '#fff', 2.6, 1);
      text(ctx, 'Foto añadida · Merienda', 88, y + 29, { size: 15, weight: 600, color: INK });
    });
    // dedo
    const keys = [[36.8, 300, 2300], [37.9, 301, 1587], [38.65, 301, 1587], [39.05, 590, 905], [39.3, 590, 905], [39.6, 330, 1215],
      [39.95, 330, 1215], [40.2, 944, 905], [40.4, 944, 905], [40.75, 333, 1500], [41.15, 333, 1500], [41.7, 700, 2300]];
    const ta = win(t, 37.1, 41.8, 0.3, 0.3);
    if (ta > 0) {
      const [x, y] = path(t, keys);
      const pr = Math.max(pulse(t, CUES.tapBristol), pulse(t, CUES.tabUrine), pulse(t, CUES.tapUrine), pulse(t, CUES.tabFood), pulse(t, CUES.tapPhoto));
      touch(ctx, A(x), A(y), pr, ta);
      for (const c of [CUES.tapBristol, CUES.tabUrine, CUES.tapUrine, CUES.tabFood, CUES.tapPhoto]) ripple(ctx, A(x), A(y), t, c, '#ffffff', 8, 40);
    }
  });
}

// --- Configuración del seguimiento (panel) --------------------------------
function sceneConfig(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const zIn = eio(prog(t, CUES.zoomDrawer, CUES.zoomDrawer + 0.9));
  const zOut = eio(prog(t, CUES.zoomOut, CUES.zoomOut + 0.9));
  const z = lerp(1, lerp(1.85, 1, zOut), zIn);
  const cam = { x: lerp(1000, lerp(1745, 1000, zOut), zIn), y: lerp(537, lerp(700, 537, zOut), zIn), z };
  const enter = eo(prog(t, 42.0, 42.6));
  const bw = 1520;
  browser(ctx, (W - bw) / 2, 70 + (1 - enter) * 40, bw, () => {
    webImg(ctx, IMG.webDetail);
    const d = eio(prog(t, CUES.drawer, CUES.drawer + 0.5));
    if (d > 0) {
      // fondo oscurecido + panel lateral que entra desde la derecha
      ctx.save(); ctx.globalAlpha = d; ctx.drawImage(IMG.webConfig, 0, 0, 1500, WEB_H, 0, 0, 1500, WEB_H); ctx.restore();
      ctx.drawImage(IMG.webConfig, 1500, 0, 500, WEB_H, 1500 + (1 - d) * 520, 0, 500, WEB_H);
    }
    // seguimiento de comidas
    highlight(ctx, 1522, 478, 458, 62, GREEN, win(t, CUES.foodToggle, CUES.zoomOut, 0.3, 0.4), 16);
    // campos: obligatorio / opcional / oculto
    highlight(ctx, 1724, 636, 244, 244, BLUE, win(t, CUES.campos, CUES.zoomOut, 0.3, 0.4), 14);
    // "Etiquetas" pasa de Opcional a Oculto
    const sw = prog(t, CUES.setHidden, CUES.setHidden + 0.25);
    if (sw > 0) {
      const y = 811, hh = 26;
      layer(ctx, sw, () => {
        fillRR(ctx, 1825, y, 72, hh, 6, '#F4F1EE');
        text(ctx, 'Opcional', 1861, y + 18, { size: 13, weight: 600, color: INK, align: 'center' });
        fillRR(ctx, 1902, y, 60, hh, 6, '#E86F5C');
        text(ctx, 'Oculto', 1932, y + 18, { size: 13, weight: 600, color: '#fff', align: 'center' });
      });
    }
    // cursor
    const keys = [[42.6, 1100, 700], [43.45, 1594, 152], [43.9, 1594, 152], [44.6, 1700, 600], [45.2, 1600, 505], [46.9, 1640, 700],
      [48.35, 1932, 824], [49.4, 1932, 824], [50.3, 1800, 980]];
    const ca = win(t, 42.6, 50.5, 0.3, 0.3);
    if (ca > 0) {
      const [x, y] = path(t, keys);
      const pr = Math.max(pulse(t, CUES.clickConfig), pulse(t, CUES.setHidden));
      layer(ctx, ca, () => {
        ripple(ctx, x, y, t, CUES.clickConfig, BLUE, 8, 40); ripple(ctx, x, y, t, CUES.setHidden, BLUE, 8, 40);
        cursorArrow(ctx, x, y, 1.9 / z, pr);
      });
    }
  }, cam);
  callout(ctx, 960, 1012, 'Tú decides qué registra cada paciente', BLUE, prog(t, CUES.campos + 0.2, CUES.campos + 0.6) * (1 - prog(t, 50.3, 50.8)), { size: 24 });
}

// --- Del móvil al panel: cada registro llega al instante -------------------
function scenePanel(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const zp = eio(prog(t, CUES.zoomPanel, CUES.zoomPanel + 1.0));
  const bw = lerp(1080, 1520, zp), bx = lerp(760, (W - 1520) / 2, zp), by = lerp(250, 70, zp);
  const b = browser(ctx, bx, by, bw, () => {
    webImg(ctx, IMG.webHome);
    highlight(ctx, 40, 470, 1922, 532, BLUE, win(t, 61.2, 63.4, 0.35, 0.3), 22);
  });
  // móvil (sale por la izquierda al ampliar el panel)
  const pe = eo(prog(t, 57.6, 58.1)), px = lerp(420, -300, zp);
  phoneFrame(ctx, px, 560 + (1 - pe) * 40, 0.78, () => {
    appShot(ctx, IMG.appSymptoms);
    const p = pulse(t, CUES.tapRegister);
    touch(ctx, A(590), A(1994), p, win(t, 57.7, 58.4, 0.15, 0.2));
    ripple(ctx, A(590), A(1994), t, CUES.tapRegister, '#fff', 8, 40);
  });
  // tres registros (deposición, micción, comida) viajan al panel
  const from = [px + 150, 470], to = [bx + bw * 0.33, by + 46 + b.s * 640];
  CUES.packets.forEach((c, i) => {
    const p = prog(t, c, c + 1.0);
    if (p <= 0 || p >= 1) {
      if (p >= 1) { const q = prog(t, c + 1.0, c + 1.6); if (q < 1) layer(ctx, 1 - q, () => { ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(to[0], to[1], 10 + q * 60, 0, Math.PI * 2); ctx.stroke(); }); }
      return;
    }
    const e = eio(p);
    const x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(Math.PI * e) * (260 - i * 40);
    const sc = 1 - 0.4 * prog(p, 0.7, 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    shadow(ctx, 22, 8, 'rgba(40,45,30,0.25)');
    fillRR(ctx, -100, -32, 200, 64, 32, '#fff'); noShadow(ctx);
    picto(ctx, KINDS[i].kind, -66, 0, 42, APP_BLUE);
    text(ctx, ['Deposición', 'Micción', 'Comida'][i], -36, 7, { size: 18, weight: 600, color: INK });
    ctx.restore();
  });
}

// --- Semáforo: lista de pacientes -----------------------------------------
const ROWS = [463, 553, 631, 709, 787, 864];
const ROW_SEM = [RED, ORANGE, ORANGE, RED, RED, RED];
function sceneSemaforo(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const zi = eio(prog(t, 64.0, 65.0)), zo = eio(prog(t, 69.6, 70.6));
  const z = lerp(1, lerp(1.4, 1, zo), zi);
  const cam = { x: lerp(1000, lerp(720, 1000, zo), zi), y: lerp(537, lerp(560, 537, zo), zi), z };
  browser(ctx, (W - 1520) / 2, 70, 1520, () => {
    webImg(ctx, IMG.webList);
    const a = win(t, CUES.semDots, 70.4, 0.3, 0.4);
    if (a > 0) ROWS.forEach((y, i) => {
      const p = ((t - CUES.semDots - i * 0.12) * 0.9) % 1;
      if (t < CUES.semDots + i * 0.12) return;
      layer(ctx, a * (1 - p), () => { ctx.strokeStyle = ROW_SEM[i]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(71, y, 9 + p * 26, 0, Math.PI * 2); ctx.stroke(); });
    });
    const chips = [[146, 230, 72, GREEN], [230, 230, 92, ORANGE], [333, 230, 98, RED]];
    chips.forEach(([x, y, w, c], i) => highlight(ctx, x - 4, y - 4, w + 8, 36, c, win(t, CUES.chips[i], 70.4, 0.25, 0.4), 18));
    // cursor hacia la fila del paciente (continúa en la escena de detalle)
    const ca = win(t, 69.4, 71.0, 0.3, 0.01);
    if (ca > 0) { const [x, y] = path(t, [[69.4, 900, 900], [70.6, 300, 450]]); layer(ctx, ca, () => cursorArrow(ctx, x, y, 1.9 / z)); }
  }, cam);
  const lab = [['Al día', GREEN], ['Atención', ORANGE], ['Inactivo', RED]];
  lab.forEach(([s, c], i) => callout(ctx, 660 + i * 300, 1012, s, c, prog(t, CUES.chips[i], CUES.chips[i] + 0.4) * (1 - prog(t, 70.1, 70.5)), { size: 26 }));
}

// --- Detalle del paciente: historial, estadísticas e informe --------------
const STATS_OFF = 809; // desplazamiento de web-detalle-estadisticas respecto a web-detalle
function detailPage(ctx, scroll) {
  ctx.save(); ctx.translate(0, -scroll);
  ctx.drawImage(IMG.webDetail, 0, 0, WEB_W, WEB_H);
  const k = WEB_W / IMG.webStats.width;
  ctx.drawImage(IMG.webStats, 0, 75 / k, IMG.webStats.width, (WEB_H - 75) / k, 0, STATS_OFF + 75, WEB_W, WEB_H - 75);
  ctx.restore();
  ctx.drawImage(IMG.webDetail, 0, 0, IMG.webDetail.width, 75 * IMG.webDetail.width / WEB_W, 0, 0, WEB_W, 75); // barra superior fija
}
function sceneDetalle(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const scroll = STATS_OFF * (eio(prog(t, CUES.scrollDown, CUES.scrollDown + 0.8)) - eio(prog(t, CUES.scrollUp, CUES.scrollUp + 0.6)));
  browser(ctx, (W - 1520) / 2, 70, 1520, () => {
    const d = eio(prog(t, CUES.clickRow + 0.15, CUES.clickRow + 0.6));
    if (d < 1) {
      webImg(ctx, IMG.webList);
      highlight(ctx, 40, 418, 1922, 94, BLUE, prog(t, 70.9, 71.2) * (1 - d), 0);
    }
    if (d > 0) layer(ctx, d, () => detailPage(ctx, scroll));
    // chips del historial: deposiciones, micciones y comida
    const chip = [[659, 147], [814, 122], [942, 106]];
    chip.forEach(([x, w], i) => {
      const a = win(t, CUES.histChips[i], CUES.scrollDown + 0.2, 0.25, 0.3);
      highlight(ctx, x - 3, 520 - scroll, w + 6, 38, [BLUE, '#C9A227', GREEN][i], a, 19);
    });
    // estadísticas y comidas
    highlight(ctx, 40, STATS_OFF + 268 - scroll, 478, 200, BLUE, win(t, CUES.scrollDown + 0.7, CUES.stats + 0.2, 0.3, 0.3), 16);
    highlight(ctx, 40, STATS_OFF + 110 - scroll, 478, 150, BLUE, win(t, CUES.stats - 0.2, CUES.scrollUp, 0.3, 0.3), 16);
    highlight(ctx, 40, STATS_OFF + 742 - scroll, 478, 295, GREEN, win(t, CUES.stats + 0.1, CUES.scrollUp, 0.3, 0.3), 16);
    // PDF
    const pe = back(prog(t, CUES.exportPdf + 0.15, CUES.exportPdf + 0.6));
    const pa = win(t, CUES.exportPdf + 0.15, 85.0, 0.2, 0.4);
    if (pa > 0) layer(ctx, pa, () => {
      ctx.translate(1300, 210); ctx.scale(pe * 1.6, pe * 1.6);
      shadow(ctx, 30, 12, 'rgba(20,40,70,0.22)');
      fillRR(ctx, 0, 0, 296, 92, 16, '#fff'); noShadow(ctx);
      iconPdf(ctx, 22, 18, 42, 56);
      text(ctx, 'Informe_Lucia_Ferrer.pdf', 82, 42, { size: 14, weight: 600, color: INK });
      iconCheck(ctx, 90, 64, 12, GREEN, 2.5, prog(t, CUES.exportPdf + 0.5, CUES.exportPdf + 0.8));
      text(ctx, 'Listo para la historia clínica', 102, 69, { size: 12, weight: 600, color: GREEN });
    });
    // cursor
    const keys = [[70.6, 300, 450], [71.25, 420, 462], [71.6, 420, 462], [75.0, 760, 600], [77.6, 1000, 560], [77.9, 700, 700],
      [80.6, 520, 900], [81.5, 1437, 152], [82.6, 1437, 152], [84.4, 1300, 600]];
    const [x, y] = path(t, keys);
    const pr = Math.max(pulse(t, CUES.clickRow), pulse(t, CUES.exportPdf));
    layer(ctx, win(t, 70.6, 84.2, 0.01, 0.4), () => {
      ripple(ctx, x, y, t, CUES.clickRow, BLUE, 8, 40); ripple(ctx, x, y, t, CUES.exportPdf, BLUE, 8, 40);
      cursorArrow(ctx, x, y, 1.9, pr);
    });
  });
  const kinds = KINDS.map((k) => k.label.replace('Alimentación', 'Comidas'));
  kinds.forEach((s, i) => callout(ctx, 560 + i * 400, 1012, s, BLUE, prog(t, CUES.histChips[i], CUES.histChips[i] + 0.4) * (1 - prog(t, CUES.scrollDown + 0.2, CUES.scrollDown + 0.6)),
    { size: 26, icon: (x, y) => picto(ctx, KINDS[i].kind, x, y, 40, APP_BLUE) }));
  callout(ctx, 960, 1012, 'Evolución, estadísticas e informes en PDF', BLUE, prog(t, CUES.stats - 0.3, CUES.stats + 0.1) * (1 - prog(t, 84.0, 84.5)), { size: 26 });
}

// --- Cierre: los tres tipos de registro bajo el lema -------------------------
function endChips(ctx, t) {
  KINDS.forEach((k, i) => {
    const a = eo(prog(t, CUES.endChips + i * 0.15, CUES.endChips + i * 0.15 + 0.5)) * (1 - prog(t, 96.9, 97.4));
    callout(ctx, 960 + (i - 1) * 330, 760, k.label, BLUE, a, { size: 26, icon: (x, y) => picto(ctx, k.kind, x, y, 42, APP_BLUE) });
  });
}

// --- Cierre: el isotipo se dibuja siguiendo su forma desde arriba y las
// letras de "Fluxia" aparecen de una en una (sólo opacidad) ---------------
const END_BG = '#EEEFDF';
function sceneCierre(ctx, t) {
  ctx.fillStyle = END_BG; ctx.fillRect(0, 0, W, H);
  // misma composición que el cierre del vídeo original
  const mh = 168, mx = 646, my = 412;
  const mw = drawLogoMark(ctx, mx, my, mh, eio(prog(t, CUES.logoDraw, CUES.logoDraw + 1.5)));
  const word = 'Fluxia', fs = 132, wx = mx + mw + 38, wy = 551;
  ctx.font = `600 ${fs}px Lexend`;
  let x = wx;
  [...word].forEach((ch, i) => {
    const a = prog(t, CUES.letters + i * 0.13, CUES.letters + i * 0.13 + 0.45);
    layer(ctx, a, () => text(ctx, ch, x, wy, { size: fs, weight: 600, color: '#383838' }));
    ctx.font = `600 ${fs}px Lexend`;
    x += ctx.measureText(ch).width;
  });
  layer(ctx, eo(prog(t, CUES.tagline, CUES.tagline + 0.8)), () =>
    text(ctx, 'Datos reales. Decisiones mejores.', W / 2, 650, { size: 44, weight: 300, color: '#3D3F3A', align: 'center' }));
  endChips(ctx, t);
}

const CANVAS = { app: sceneApp, config: sceneConfig, panel: scenePanel, semaforo: sceneSemaforo, detalle: sceneDetalle, cierre: sceneCierre };

async function drawShot(ctx, shot, t) {
  if (shot.kind === 'orig') {
    await drawOrig(ctx, shot, clamp(t, shot.start, shot.end));
    if (shot.id === 'consulta') foodIconOverlay(ctx, t);
  } else {
    CANVAS[shot.id](ctx, clamp(t, shot.start - XFADE, shot.end + XFADE));
  }
}

// Inserto (pantalla de calendario del vídeo original), en tiempo de salida.
const INSERT_SHOT = { kind: 'orig', map: [[INSERT.at, INSERT.src[0]], [INSERT.at + INSERT.dur, INSERT.src[1]]] };

export async function renderFrame(ctx, tOut) {
  const { at, dur } = INSERT;
  if (tOut >= at && tOut < at + dur) { await drawOrig(ctx, INSERT_SHOT, tOut); return; }
  const t = tOut < at ? tOut : tOut - dur;   // tiempo base del montaje
  ctx.save();
  const i = SHOTS.indexOf(shotAt(t));
  const shot = SHOTS[i];
  await drawShot(ctx, shot, t);
  // fundido con el plano siguiente (o con el inserto, si va justo después)
  const next = SHOTS[i + 1];
  if (next && t > shot.end - XFADE) {
    ctx.save(); ctx.globalAlpha = eio(prog(t, shot.end - XFADE, shot.end));
    if (shot.end === at) await drawOrig(ctx, INSERT_SHOT, at);
    else await drawShot(ctx, next, t);
    ctx.restore();
  }
  ctx.restore();
}

// Piezas reutilizadas por los vídeos cortos (video/cortos).
export {
  BG, NAVY, BLUE, APP_BLUE, GREEN, ORANGE, RED, INK, INK2, IMG, drawOrig, picto, KINDS, PH, phoneFrame, appShot, A, touch, pulse,
  browser, webImg, highlight, callout, WEB_W, WEB_H,
};
