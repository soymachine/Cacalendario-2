// Escenas de los vídeos cortos (ver shorts.js). Reutiliza las piezas del
// vídeo v2 (marco del móvil, navegador, pantallazos, pastillas, pictos) y
// del vídeo v1 (isotipo vectorial, cursor, utilidades).
import { WIDTH as W, HEIGHT as H, XFADE, SHORTS, shotAt } from './shorts.js';
import {
  clamp, lerp, prog, eo, eio, back, win, rgba, rr, fillRR, shadow, noShadow,
  text, measure, layer, cursorArrow, ripple, iconCheck, path, drawLogoMark,
} from '../scene.js';
import {
  setBase, loadAssets as loadV2Assets, BG, BLUE, APP_BLUE, GREEN, RED, INK, INK2, IMG, drawOrig, picto, KINDS, PH,
  phoneFrame, appShot, A, touch, pulse, browser, webImg, highlight, callout,
} from '../v2/scene.js';

const END_BG = '#EEEFDF';
let SH = SHORTS.recordatorios, C = SH.cues;
export async function loadAssets(id) {
  SH = SHORTS[id]; C = SH.cues;
  setBase('../v2/');
  await loadV2Assets();
}

// ----------------------------------------------------------------- piezas
function bellIcon(ctx, cx, cy, s, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 40, s / 40);
  ctx.strokeStyle = color; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, 9); ctx.quadraticCurveTo(-10, 4, -10, -3); ctx.arc(0, -3, 10, Math.PI, 0); ctx.quadraticCurveTo(10, 4, 13, 9); ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, 13); ctx.quadraticCurveTo(0, 17, 4, 13); ctx.stroke();
  ctx.restore();
}
const bellCallout = (x, y) => (ctx) => bellIcon(ctx, x, y, 30, APP_BLUE);
function titlePill(ctx, t) {
  const a = prog(t, C.title, C.title + 0.5) * (1 - prog(t, 2.6, 3.1));
  callout(ctx, W / 2, 92, SH.title, BLUE, a, { size: 30 });
}
// Toast dentro de la pantalla del móvil.
function phoneToast(ctx, label, a) {
  if (a <= 0) return;
  layer(ctx, a, () => {
    const y = 64 + (1 - a) * -16;
    shadow(ctx, 16, 6, 'rgba(0,0,0,0.18)');
    fillRR(ctx, 40, y, PH.sw - 80, 46, 23, '#fff'); noShadow(ctx);
    ctx.beginPath(); ctx.arc(66, y + 23, 12, 0, Math.PI * 2); ctx.fillStyle = GREEN; ctx.fill();
    iconCheck(ctx, 66, y + 23, 13, '#fff', 2.6, 1);
    text(ctx, label, 88, y + 29, { size: 15, weight: 600, color: INK });
  });
}
// Ajuste de texto en varias líneas.
function wrapText(ctx, s, x, y, maxW, lh, o) {
  ctx.font = `${o.weight} ${o.size}px Lexend`;
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { text(ctx, line, x, yy, o); line = w; yy += lh; } else line = test;
  }
  if (line) text(ctx, line, x, yy, o);
}

// --------------------------------------------------------------- cierre
function sceneCierre(ctx, t) {
  ctx.fillStyle = END_BG; ctx.fillRect(0, 0, W, H);
  const mh = 168, mx = 646, my = 412;
  const mw = drawLogoMark(ctx, mx, my, mh, eio(prog(t, C.logoDraw, C.logoDraw + 1.5)));
  const fs = 132, wy = 551; let x = mx + mw + 38;
  [...'Fluxia'].forEach((ch, i) => {
    layer(ctx, prog(t, C.letters + i * 0.13, C.letters + i * 0.13 + 0.45), () => text(ctx, ch, x, wy, { size: fs, weight: 600, color: '#383838' }));
    ctx.font = `600 ${fs}px Lexend`; x += ctx.measureText(ch).width;
  });
  layer(ctx, eo(prog(t, C.tagline, C.tagline + 0.8)), () =>
    text(ctx, 'Datos reales. Decisiones mejores.', W / 2, 650, { size: 44, weight: 300, color: '#3D3F3A', align: 'center' }));
  if (C.endChips) {
    const a = eo(prog(t, C.endChips, C.endChips + 0.5)) * (1 - prog(t, SH.duration - 0.5, SH.duration));
    callout(ctx, W / 2, 760, SH.title, BLUE, a, { size: 26 });
  }
}

// ======================================================= 1 · RECORDATORIOS
function lockScreen(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, PH.sw, PH.sh);
  g.addColorStop(0, '#2F6EA8'); g.addColorStop(0.55, '#3E9497'); g.addColorStop(1, '#9BC45A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, PH.sw, PH.sh);
  text(ctx, 'sábado, 17 de octubre', PH.sw / 2, 112, { size: 17, weight: 500, color: 'rgba(255,255,255,0.9)', align: 'center' });
  text(ctx, '20:30', PH.sw / 2, 200, { size: 86, weight: 600, color: '#fff', align: 'center' });
  const notes = [
    { at: C.notif1, body: '¿Hay algo nuevo que registrar hoy? Puedes añadirlo en Fluxia cuando quieras.' },
    { at: C.notif2, body: 'Todavía no has registrado la merienda.' },
  ];
  const push = eio(prog(t, C.notif2, C.notif2 + 0.45));
  notes.forEach((n, i) => {
    const e = back(prog(t, n.at, n.at + 0.5));
    if (e <= 0) return;
    const y = 300 + (i === 0 ? push * 112 : 0) + (1 - e) * -60;
    const h = i === 0 ? 100 : 84;
    const sel = i === 1 ? pulse(t, C.tapNotif, 0.3) : 0;
    layer(ctx, clamp(e), () => {
      ctx.save(); ctx.translate(PH.sw / 2, y + h / 2); ctx.scale(1 - sel * 0.04, 1 - sel * 0.04); ctx.translate(-PH.sw / 2, -(y + h / 2));
      fillRR(ctx, 14, y, PH.sw - 28, h, 22, 'rgba(255,255,255,0.9)');
      fillRR(ctx, 28, y + 14, 34, 34, 9, '#fff');
      drawLogoMark(ctx, 31, y + 20, 22, 1);
      text(ctx, 'Fluxia', 74, y + 30, { size: 15, weight: 700, color: INK });
      text(ctx, 'ahora', PH.sw - 34, y + 30, { size: 13, weight: 400, color: INK2, align: 'right' });
      wrapText(ctx, n.body, 74, y + 52, PH.sw - 120, 19, { size: 14, weight: 400, color: INK });
      ctx.restore();
    });
  });
  const ta = win(t, C.tapNotif - 0.5, C.tapNotif + 0.6, 0.25, 0.25);
  touch(ctx, 230, 345, pulse(t, C.tapNotif, 0.3), ta);
  ripple(ctx, 230, 345, t, C.tapNotif, '#fff', 8, 40);
}
function sceneBloqueo(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const s0 = 4.6, enter = eo(prog(t, s0, s0 + 0.6));
  layer(ctx, eo(prog(t, s0 + 0.2, s0 + 0.8)), () => text(ctx, 'Recordatorios automáticos', 200, 330, { size: 30, weight: 300, color: INK2 }));
  const rows = [[C.notif1 + 0.3, 'Si deja de registrar unos días'], [C.notif2 + 0.3, 'Si falta una comida de su pauta']];
  rows.forEach(([c, s], i) => {
    const e = eo(prog(t, c, c + 0.5));
    if (e <= 0) return;
    const y = 430 + i * 140;
    layer(ctx, e, () => {
      ctx.translate((1 - e) * -40, 0);
      shadow(ctx, 24, 8, 'rgba(40,45,30,0.16)');
      ctx.beginPath(); ctx.arc(250, y, 48, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
      bellIcon(ctx, 250, y, 46, APP_BLUE);
      text(ctx, s, 322, y + 14, { size: 40, weight: 600, color: INK, spacing: -0.6 });
    });
  });
  phoneFrame(ctx, 1380, 540 + (1 - enter) * 60, 1.0, () => lockScreen(ctx, t));
}

// Panel: activar los recordatorios del paciente.
function sceneAvisoConfig(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const z = lerp(1.0, 1.35, eio(prog(t, 9.6, 10.4)));
  const cam = { x: lerp(1000, 1250, eio(prog(t, 9.6, 10.4))), y: lerp(537, 345, eio(prog(t, 9.6, 10.4))), z };
  browser(ctx, (W - 1520) / 2, 70, 1520, () => {
    webImg(ctx, IMG.webDetail);
    const on = eio(prog(t, C.config, C.config + 0.25));
    // interruptor y textos del bloque "Notificaciones al paciente"
    if (on > 0) {
      fillRR(ctx, 1770, 222, 182, 34, 6, '#fff');
      fillRR(ctx, 1774, 226, 50, 26, 13, lerp(0, 1, on) > 0.5 ? GREEN : '#D5D9DD');
      ctx.beginPath(); ctx.arc(1787 + on * 24, 239, 10, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      text(ctx, 'Activadas', 1838, 245, { size: 15, weight: 600, color: INK });
      layer(ctx, on, () => {
        fillRR(ctx, 554, 256, 700, 24, 0, '#fff');
        text(ctx, 'Se enviará un recordatorio si pasa 1 día sin registros.', 558, 273, { size: 13, weight: 400, color: INK2 });
        fillRR(ctx, 554, 298, 420, 28, 0, '#fff');
        text(ctx, 'Días sin registro para notificar', 558, 318, { size: 15, weight: 600, color: INK });
      });
    }
    highlight(ctx, 540, 212, 1420, 236, BLUE, win(t, 10.2, 12.2, 0.3, 0.3), 18);
    // aviso de prueba enviado
    const ok = eo(prog(t, C.testPush + 0.2, C.testPush + 0.6));
    if (ok > 0) layer(ctx, ok, () => {
      fillRR(ctx, 860, 394, 300, 38, 19, '#E7F5EE');
      iconCheck(ctx, 884, 413, 14, GREEN, 2.6, 1);
      text(ctx, 'Notificación enviada', 902, 419, { size: 15, weight: 600, color: GREEN });
    });
    const keys = [[9.6, 1300, 600], [9.85, 1799, 239], [10.3, 1799, 239], [10.9, 700, 412], [11.5, 700, 412], [12.2, 900, 600]];
    const [x, y] = path(t, keys);
    layer(ctx, win(t, 9.6, 12.2, 0.2, 0.3), () => {
      ripple(ctx, x, y, t, C.config, BLUE, 6, 30); ripple(ctx, x, y, t, C.testPush, BLUE, 6, 30);
      cursorArrow(ctx, x, y, 1.9 / z, Math.max(pulse(t, C.config), pulse(t, C.testPush)));
    });
  }, cam);
  callout(ctx, W / 2, 1012, 'Tú decides cuándo avisar a cada paciente', BLUE, prog(t, 10.3, 10.7) * (1 - prog(t, 11.8, 12.2)), { size: 26 });
}

// El paciente registra en unos toques.
function sceneRegistro(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  layer(ctx, eo(prog(t, 12.2, 12.8)), () => text(ctx, 'Desde el aviso, directo al registro', 200, 330, { size: 30, weight: 300, color: INK2 }));
  KINDS.forEach((k, i) => {
    const e = eo(prog(t, 12.5 + i * 0.18, 12.9 + i * 0.18)), y = 430 + i * 140;
    if (e <= 0) return;
    layer(ctx, e, () => {
      shadow(ctx, 24, 8, 'rgba(40,45,30,0.16)');
      ctx.beginPath(); ctx.arc(250, y, 48, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
      picto(ctx, k.kind, 250, y, 64, APP_BLUE);
      text(ctx, k.label, 322, y + 15, { size: 44, weight: 600, color: INK, spacing: -0.6 });
    });
  });
  phoneFrame(ctx, 1380, 540, 1.0, () => {
    appShot(ctx, IMG.appPoop);
    appShot(ctx, IMG.appSymptoms, prog(t, 13.4, 13.7));
    const sel = prog(t, C.tapTile, C.tapTile + 0.2) * (1 - prog(t, 13.4, 13.6));
    if (sel > 0) layer(ctx, sel, () => { ctx.strokeStyle = APP_BLUE; ctx.lineWidth = 3.5; rr(ctx, A(172), A(1462), A(262), A(256), 12); ctx.stroke(); });
    const keys = [[12.0, 600, 2300], [12.75, 301, 1587], [13.3, 301, 1587], [13.9, 590, 1994], [14.5, 590, 1994], [15.2, 800, 2400]];
    const [x, y] = path(t, keys);
    touch(ctx, A(x), A(y), Math.max(pulse(t, C.tapTile), pulse(t, C.tapRegister)), win(t, 12.2, 15.0, 0.3, 0.3));
    ripple(ctx, A(x), A(y), t, C.tapTile, '#fff', 8, 40); ripple(ctx, A(x), A(y), t, C.tapRegister, '#fff', 8, 40);
    phoneToast(ctx, 'Registro guardado', eo(prog(t, C.tapRegister + 0.3, C.tapRegister + 0.7)));
  });
}

// El registro llega al panel y el semáforo vuelve a verde.
function sceneLlega(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const zp = eio(prog(t, 17.6, 18.5));
  const bw = lerp(1080, 1520, zp), bx = lerp(760, (W - 1520) / 2, zp), by = lerp(250, 70, zp);
  const arrived = prog(t, C.arrive, C.arrive + 0.35);
  const b = browser(ctx, bx, by, bw, () => {
    webImg(ctx, IMG.webList);
    if (arrived > 0) {
      layer(ctx, arrived, () => {
        ctx.fillStyle = rgba(GREEN, 0.07); ctx.fillRect(40, 418, 1920, 94);
        ctx.beginPath(); ctx.arc(71, 463, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(71, 463, 6.5, 0, Math.PI * 2); ctx.fillStyle = GREEN; ctx.fill();
        fillRR(ctx, 1160, 436, 200, 50, 0, '#F6FBF8');
        text(ctx, 'Ahora mismo', 1166, 459, { size: 16, weight: 600, color: GREEN });
        text(ctx, '17 oct 2026', 1166, 479, { size: 12.5, weight: 400, color: INK2 });
      });
      const p = prog(t, C.arrive, C.arrive + 1.0);
      if (p < 1) layer(ctx, 1 - p, () => { ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(71, 463, 8 + p * 40, 0, Math.PI * 2); ctx.stroke(); });
    }
  });
  const px = lerp(420, -300, zp);
  phoneFrame(ctx, px, 560, 0.78, () => { appShot(ctx, IMG.appSymptoms); phoneToast(ctx, 'Registro guardado', 1); });
  // paquete: deposición registrada
  const p = prog(t, C.packet, C.arrive);
  if (p > 0 && p < 1) {
    const from = [px + 150, 470], to = [bx + 71 * b.s, by + 46 + 463 * b.s];
    const e = eio(p), x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(Math.PI * e) * 240;
    const sc = 1 - 0.5 * prog(p, 0.7, 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    shadow(ctx, 22, 8, 'rgba(40,45,30,0.25)');
    fillRR(ctx, -100, -32, 200, 64, 32, '#fff'); noShadow(ctx);
    picto(ctx, 'poop', -66, 0, 42, APP_BLUE);
    text(ctx, 'Deposición', -36, 7, { size: 18, weight: 600, color: INK });
    ctx.restore();
  }
  callout(ctx, W / 2, 1012, 'El semáforo vuelve a verde', GREEN, prog(t, 18.3, 18.7) * (1 - prog(t, 19.2, 19.6)), { size: 26 });
}

// ============================================= 2 · MEMORIA Y PAPEL
function notebook(ctx, t) {
  // hoja de libreta con anotaciones a mano que se van borrando
  const lost = eio(prog(t, C.lost, C.lost + 1.2));
  ctx.save();
  ctx.translate(560 + lost * -700, 560 + lost * 120); ctx.rotate(-0.05 - lost * 0.6);
  ctx.globalAlpha *= 1 - lost * 0.9;
  shadow(ctx, 40, 14, 'rgba(40,45,30,0.22)');
  fillRR(ctx, -290, -340, 580, 680, 10, '#FCFAF3'); noShadow(ctx);
  ctx.strokeStyle = 'rgba(80,130,190,0.25)'; ctx.lineWidth = 2;
  for (let y = -250; y < 330; y += 56) { ctx.beginPath(); ctx.moveTo(-270, y); ctx.lineTo(270, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(220,90,90,0.45)'; ctx.beginPath(); ctx.moveTo(-200, -340); ctx.lineTo(-200, 340); ctx.stroke();
  text(ctx, 'Mi diario', -180, -275, { size: 34, weight: 600, color: '#2E4A7A' });
  const entries = [
    ['Lunes', '2 veces, normal', 1], ['Martes', '¿1? no me acuerdo', 0.75], ['Miércoles', '', 0.2],
    ['Jueves', 'dolor... ¿o era el viernes?', 0.55], ['Viernes', '', 0.15], ['Sábado', '¿?', 0.4],
  ];
  const fade = prog(t, C.memory + 0.4, C.paper + 0.8);
  entries.forEach(([d, s, keep], i) => {
    const y = -206 + i * 56;
    const a = lerp(1, keep, fade);
    layer(ctx, a, () => {
      text(ctx, d, -180, y, { size: 24, weight: 500, color: '#2E4A7A' });
      text(ctx, s, -10, y, { size: 24, weight: 300, color: '#2E4A7A' });
    });
  });
  // tachón y mancha de café
  layer(ctx, prog(t, C.paper, C.paper + 0.5), () => {
    ctx.strokeStyle = '#2E4A7A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-15, -106); ctx.bezierCurveTo(60, -118, 120, -96, 230, -110); ctx.stroke();
    ctx.fillStyle = 'rgba(150,100,50,0.18)'; ctx.beginPath(); ctx.arc(150, 210, 70, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,50,0.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(150, 210, 64, 0.3, 5.6); ctx.stroke();
  });
  ctx.restore();
}
function thoughtCloud(ctx, t) {
  const e = back(prog(t, C.memory - 0.2, C.memory + 0.35));
  if (e <= 0) return;
  ctx.save(); ctx.translate(1340, 420); ctx.scale(e, e);
  shadow(ctx, 30, 10, 'rgba(40,45,30,0.16)');
  ctx.fillStyle = '#fff';
  for (const [x, y, r] of [[-170, 10, 110], [-40, -60, 130], [110, -20, 120], [190, 60, 90], [0, 70, 120], [-130, 90, 90]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  for (const [x, y, r] of [[-170, 230, 26], [-215, 290, 16]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  noShadow(ctx);
  const f = prog(t, C.memory + 0.5, C.lost + 0.8);
  text(ctx, '¿Cuántas veces fue', 10, -20, { size: 34, weight: 600, color: INK, align: 'center' });
  text(ctx, 'la semana pasada?', 10, 26, { size: 34, weight: 600, color: INK, align: 'center' });
  // iconos que se desvanecen: el recuerdo se borra
  layer(ctx, 1 - f * 0.85, () => {
    picto(ctx, 'poop', -110, 100, 56, APP_BLUE); picto(ctx, 'urine', 10, 110, 56, APP_BLUE); picto(ctx, 'food', 130, 100, 56, APP_BLUE);
  });
  ctx.restore();
}
function scenePapel(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  notebook(ctx, t);
  thoughtCloud(ctx, t);
  callout(ctx, 1340, 760, 'La memoria falla', RED, prog(t, C.memory + 0.6, C.memory + 1.0) * (1 - prog(t, 9.0, 9.4)), { size: 28 });
  callout(ctx, 560, 990, 'El papel se pierde', RED, prog(t, C.paper, C.paper + 0.4) * (1 - prog(t, C.lost + 0.6, C.lost + 1.0)), { size: 28 });
}
function dudasOverlay(ctx, t) {
  const items = [[C.d1, 'Detalles que se olvidan', 470], [C.d2, 'Registros incompletos', 960], [C.d3, 'Información difícil de reconstruir', 1450]];
  items.forEach(([c, s, x]) => callout(ctx, x, 1010, s, RED, prog(t, c, c + 0.4) * (1 - prog(t, 14.8, 15.2)), { size: 24 }));
}

function sceneFluxiaApp(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  layer(ctx, eo(prog(t, 15.3, 15.9)), () => text(ctx, 'Cada registro, en el momento', 200, 330, { size: 30, weight: 300, color: INK2 }));
  KINDS.forEach((k, i) => {
    const e = eo(prog(t, C.trio + i * 0.2, C.trio + 0.4 + i * 0.2)), y = 430 + i * 140;
    if (e <= 0) return;
    layer(ctx, e, () => {
      shadow(ctx, 24, 8, 'rgba(40,45,30,0.16)');
      ctx.beginPath(); ctx.arc(250, y, 48, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); noShadow(ctx);
      picto(ctx, k.kind, 250, y, 64, APP_BLUE);
      text(ctx, k.label, 322, y + 15, { size: 44, weight: 600, color: INK, spacing: -0.6 });
    });
  });
  const e = eo(prog(t, 15.2, 15.8));
  phoneFrame(ctx, 1380, 540 + (1 - e) * 60, 1.0, () => {
    appShot(ctx, IMG.appPoop);
    phoneToast(ctx, 'Guardado · 17 oct, 17:24', eo(prog(t, 16.6, 17.0)));
  });
}
function sceneHistorial(ctx, t) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const zi = eio(prog(t, 17.9, 18.9));
  const cam = { x: lerp(1000, 860, zi), y: lerp(537, 760, zi), z: lerp(1, 1.5, zi) };
  browser(ctx, (W - 1520) / 2, 70, 1520, () => {
    webImg(ctx, IMG.webDetail);
    highlight(ctx, 552, 660, 160, 400, BLUE, win(t, C.rows, 20.9, 0.3, 0.3), 12);
    const chip = [[659, 147], [814, 122], [942, 106]];
    chip.forEach(([x, w], i) => highlight(ctx, x - 3, 520, w + 6, 38, [BLUE, '#C9A227', GREEN][i], win(t, C.chips[i], 23.8, 0.25, 0.3), 19));
  }, cam);
  callout(ctx, W / 2, 1012, 'Cada registro, con fecha y hora', BLUE, prog(t, C.rows, C.rows + 0.4) * (1 - prog(t, 20.6, 21.0)), { size: 26 });
  KINDS.forEach((k, i) => callout(ctx, 560 + i * 400, 1012, k.label.replace('Alimentación', 'Comidas'), BLUE, prog(t, C.chips[i], C.chips[i] + 0.4) * (1 - prog(t, 23.4, 23.8)),
    { size: 26, icon: (x, y) => picto(ctx, k.kind, x, y, 40, APP_BLUE) }));
}

const CANVAS = {
  bloqueo: sceneBloqueo, avisoConfig: sceneAvisoConfig, registro: sceneRegistro, llega: sceneLlega,
  papel: scenePapel, fluxiaApp: sceneFluxiaApp, historial: sceneHistorial, cierre: sceneCierre,
};

async function drawShot(ctx, shot, t) {
  if (shot.kind === 'orig') {
    const tt = clamp(t, shot.start, shot.end);
    await drawOrig(ctx, shot, tt);
    if (shot === SH.shots[0]) titlePill(ctx, t);
    if (shot.id === 'dudas') dudasOverlay(ctx, t);
  } else {
    CANVAS[shot.id](ctx, clamp(t, shot.start - XFADE, shot.end + XFADE));
    if (shot === SH.shots[0]) titlePill(ctx, t);
  }
}
export async function renderFrame(ctx, t) {
  ctx.save();
  const i = SH.shots.indexOf(shotAt(SH, t));
  const shot = SH.shots[i];
  await drawShot(ctx, shot, t);
  const next = SH.shots[i + 1];
  if (next && t > shot.end - XFADE) {
    ctx.save(); ctx.globalAlpha = eio(prog(t, shot.end - XFADE, shot.end));
    await drawShot(ctx, next, t);
    ctx.restore();
  }
  ctx.restore();
}
