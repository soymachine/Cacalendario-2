// Línea temporal del vídeo de marketing, compartida entre la animación
// (scene.js) y la música (music.mjs) para que cada efecto caiga en su frame.
export const DURATION = 50;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BPM = 120;

// Escenas [inicio, fin] en segundos (se solapan para los fundidos).
export const SCENES = {
  intro:    [0.0, 4.4],
  problem:  [4.0, 10.6],
  solution: [10.2, 19.4],
  patient:  [19.0, 29.6],
  doctor:   [29.2, 40.4],
  decision: [40.0, 45.2],
  outro:    [44.8, 50.0],
};

// Momentos clave (en segundos).
export const CUES = {
  logoDraw: 0.25,
  problemIn: 4.2,
  questions: [5.7, 6.2, 6.7, 7.2],
  memory: 7.9,
  flaws: [8.6, 8.85, 9.1],
  solutionIn: 10.3,
  screens: [12.4, 14.4],                 // cambio de captura en el móvil (micción, comidas)
  packets: [11.4, 13.3, 15.3],           // salida de cada registro hacia el panel
  travel: 1.1,                           // duración del viaje móvil → panel
  patientIn: 19.2,
  notif: 20.5,
  tiles: [21.4, 21.9, 22.4],
  adherence: [24.2, 27.4],               // relleno de la fila "con Fluxia"
  recovered: [25.45, 26.6],              // huecos recuperados gracias al recordatorio
  doctorIn: 29.4,
  cards: [30.0, 30.4, 30.8, 31.2],
  focus: [33.6, 35.1, 36.6, 38.1],       // cada tarjeta se destaca por turno
  decisionIn: 40.2,
  nodes: [40.8, 41.6, 42.4, 43.2],
  outroLogo: 45.2,
};
