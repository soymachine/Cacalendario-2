// Montaje del vídeo v2 (≈100 s, 16:9, 30 fps).
//
// Planos "orig": escenas de personajes del vídeo de marketing original
// (public/video/Marketing_Fluxia_Video.mp4). `map` traduce tiempo de salida →
// tiempo de origen por tramos lineales (permite ralentizar o congelar para
// encajar la nueva locución). Planos "canvas": demos animadas con los
// pantallazos actuales de la app del paciente y del panel del profesional.
// `vo`: inicio (s) de cada frase de script.json.
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const SRC_FPS = 25;
export const XFADE = 0.45; // fundido entre planos

export const SHOTS = [
  { id: 'consulta',    kind: 'orig',   start: 0.0,  end: 14.0, map: [[0, 0], [14.0, 13.6]] },
  { id: 'dudas',       kind: 'orig',   start: 14.0, end: 24.0, map: [[14.0, 13.6], [20.6, 18.6], [22.6, 18.6], [24.0, 20.4]] },
  { id: 'invitacion',  kind: 'orig',   start: 24.0, end: 31.0, map: [[24.0, 20.4], [31.0, 27.9]] },
  { id: 'paciente',    kind: 'orig',   start: 31.0, end: 33.2, map: [[31.0, 27.9], [33.2, 30.0]] },
  { id: 'app',         kind: 'canvas', start: 33.2, end: 42.0 },
  { id: 'config',      kind: 'canvas', start: 42.0, end: 51.0 },
  { id: 'recordatorio',kind: 'orig',   start: 51.0, end: 57.6, map: [[51.0, 39.6], [57.6, 47.0]] },
  { id: 'panel',       kind: 'canvas', start: 57.6, end: 63.4 },
  { id: 'semaforo',    kind: 'canvas', start: 63.4, end: 70.6 },
  { id: 'detalle',     kind: 'canvas', start: 70.6, end: 84.6 },
  { id: 'tranquila',   kind: 'orig',   start: 84.6, end: 89.6, map: [[84.6, 66.9], [89.6, 73.0]] },
  { id: 'cierre',      kind: 'canvas', start: 89.6, end: 97.4 },
];
export const BASE_DURATION = 97.4;

// Pantalla de calendario de la app del vídeo original (src 38,05–39,6 s),
// alargada a 2,5 s e insertada en t = 51 s. Todo lo anterior (SHOTS, VO,
// CUES) está en tiempo "base", sin el inserto; toOut/toBase convierten.
export const INSERT = { at: 51.0, dur: 2.5, src: [38.05, 39.6] };
export const DURATION = BASE_DURATION + INSERT.dur;
export const toOut = (t) => (t >= INSERT.at ? t + INSERT.dur : t);
export const toBase = (t) => (t < INSERT.at ? t : t < INSERT.at + INSERT.dur ? INSERT.at : t - INSERT.dur);

export const VO = {
  L01: 0.45, L02: 2.9, L03: 8.5, L04: 13.7, L05: 21.6, L06: 23.95, L07: 30.85, L08: 36.15,
  L09: 42.5, L10: 51.7, L11: 57.7, L12: 63.5, L13: 70.7, L14: 84.75, L15: 89.95, L16: 93.5,
};

// Momentos clave (s) para animaciones y efectos de sonido.
export const CUES = {
  foodIcon: 12.5,
  trio: [33.25, 34.25, 35.05],       // deposiciones / micciones / alimentación (L07)
  tapBristol: 38.1, tabUrine: 39.2, tapUrine: 39.75, tabFood: 40.3, tapPhoto: 40.85,
  clickConfig: 43.6, drawer: 43.8, zoomDrawer: 44.6, foodToggle: 45.4, campos: 47.5, setHidden: 48.6, zoomOut: 50.0,
  tapRegister: 58.0, packets: [58.3, 58.7, 59.1], zoomPanel: 60.4,
  semDots: 64.0, chips: [67.5, 68.8, 69.5],
  clickRow: 71.4, histChips: [75.6, 76.6, 77.4], scrollDown: 78.2, stats: 79.8, scrollUp: 81.0, exportPdf: 81.7,
  logoDraw: 90.1, letters: 91.6, tagline: 92.5, endChips: 93.6,
};

export function shotAt(t) {
  for (const s of SHOTS) if (t < s.end) return s;
  return SHOTS[SHOTS.length - 1];
}
export function srcTime(shot, t) {
  const m = shot.map;
  if (t <= m[0][0]) return m[0][1];
  for (let i = 1; i < m.length; i++) {
    if (t <= m[i][0]) {
      const [a0, b0] = m[i - 1], [a1, b1] = m[i];
      return b0 + (b1 - b0) * (t - a0) / (a1 - a0);
    }
  }
  return m[m.length - 1][1];
}
