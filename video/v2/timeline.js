// Montaje del vídeo v2 (≈96 s, 16:9, 30 fps).
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
  { id: 'detalle',     kind: 'canvas', start: 70.6, end: 83.0 },
  { id: 'tranquila',   kind: 'orig',   start: 83.0, end: 88.6, map: [[83.0, 66.9], [88.6, 73.0]] },
  { id: 'cierre',      kind: 'orig',   start: 88.6, end: 96.4, map: [[88.6, 73.0], [96.3, 80.6]] },
];
export const DURATION = 96.4;

export const VO = {
  L01: 0.6, L02: 3.0, L03: 8.0, L04: 14.4, L05: 21.6, L06: 24.3, L07: 31.2, L08: 36.6,
  L09: 42.4, L10: 51.3, L11: 57.9, L12: 63.7, L13: 70.9, L14: 83.3, L15: 88.9, L16: 92.6,
};

// Momentos clave (s) para animaciones y efectos de sonido.
export const CUES = {
  foodIcon: 12.4,
  trio: [33.45, 34.35, 35.15],       // deposiciones / micciones / alimentación (L07)
  tapBristol: 37.9, tabUrine: 38.7, tapUrine: 39.2, tabFood: 39.75, tapPhoto: 40.3,
  clickConfig: 43.6, drawer: 43.8, zoomDrawer: 44.6, foodToggle: 45.4, campos: 46.6, setHidden: 47.6, zoomOut: 49.6,
  tapRegister: 58.0, packets: [58.3, 58.7, 59.1], zoomPanel: 60.2,
  semDots: 64.3, chips: [67.6, 68.7, 69.3],
  clickRow: 71.4, histChips: [74.8, 75.5, 76.1], scrollDown: 76.5, stats: 77.8, scrollUp: 78.9, exportPdf: 79.6,
  endChips: 92.6,
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
