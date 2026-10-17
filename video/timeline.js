// Línea temporal compartida entre la animación (scene.js) y la música
// (music.mjs), para que los efectos de sonido caigan en el frame exacto.
export const DURATION = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 120;

// Escenas [inicio, fin] en segundos (se solapan para los fundidos).
export const SCENES = {
  intro:   [0.0, 3.8],
  patient: [3.4, 11.0],
  sync:    [10.4, 14.2],
  doctor:  [13.6, 20.4],
  detail:  [19.8, 26.8],
  outro:   [26.4, 30.0],
};

// Momentos clave (en segundos).
export const CUES = {
  logoDraw: 0.25,
  tapBristol: 5.5,
  tapSave: 7.3,
  saved: 7.55,
  whoosh: 10.5,
  packetArrive: 12.7,
  hoverRed: 16.2,
  clickPatient: 19.5,
  exportPdf: 24.7,
  outroLogo: 26.8,
};
