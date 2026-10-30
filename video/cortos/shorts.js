// Vídeos cortos de Fluxia (16:9, 30 fps), uno por funcionalidad. Misma
// estética que el vídeo v2: planos de personajes del vídeo original
// (`orig`, con `map` tiempo de salida → tiempo de origen) y demos en canvas
// con los pantallazos actuales. La locución reutiliza frases de la grabación
// de ElevenLabs (voz Marina, ../v2/voz): `vo` = [inicio, frase de PHRASES].
//
// Cada corto empieza con una intro breve (`intro`: cabecera con el logo y el
// título + una frase de contexto). Los tiempos de `shots`, `vo` y `cues` del
// cuerpo son relativos al final de la intro (`intro.offset`).
export const FPS = 30, WIDTH = 1920, HEIGHT = 1080, SRC_FPS = 25, XFADE = 0.4;

// Frases de la grabación (s), medidas por silencios + transcripción.
export const PHRASES = {
  problema: [2.51, 8.00],      // El problema es que, muchas veces, los detalles de esa historia se pierden entre visitas.
  detalles: [15.56, 21.22],    // Detalles que se olvidan, registros incompletos, información difícil de reconstruir.
  cambiar: [21.45, 23.56],     // Fluxia te ayuda a cambiar eso.
  toques: [35.82, 37.30],      // Bastan unos toques.
  historia: [0.00, 2.19],      // Cada paciente cuenta una historia.
  registra: [30.52, 35.63],    // Desde la app, el paciente registra sus deposiciones, sus micciones y su alimentación.
  dejaDe: [51.38, 52.83],      // ¿El paciente deja de hacerlo?
  recordatorios: [53.06, 57.02], // Fluxia le envía recordatorios automáticos para mantener el seguimiento.
  llega: [57.18, 59.74],       // Cada registro llega al instante a tu panel,
  historial: [72.00, 74.72],   // tienes el historial completo de cada paciente:
  tipos: [74.87, 77.41],       // deposiciones, micciones y comidas,
  fiable: [89.43, 92.90],      // Porque un buen seguimiento empieza con información fiable.
  lema: [93.10, 96.60],        // Fluxia. Datos reales, decisiones mejores.
};

export const SHORTS = {
  // ---------------------------------------------------------------- 1
  recordatorios: {
    title: 'Recordatorios automáticos',
    intro: {
      offset: 7.6,
      shots: [
        { id: 'cabecera', kind: 'canvas', start: 0.0, end: 2.0 },
        { id: 'contexto', kind: 'canvas', start: 2.0, end: 7.6 },
      ],
      vo: [[2.3, 'registra']],
      cues: { logo: 0.05, letters: 0.55, subtitle: 0.95, trio: [4.7, 5.75, 6.55] },
    },
    duration: 24.6,
    shots: [
      { id: 'pacienteDuda', kind: 'orig', start: 0.0, end: 2.3, map: [[0, 39.7], [2.3, 42.0]] },
      { id: 'campana', kind: 'orig', start: 2.3, end: 4.6, map: [[2.3, 42.0], [4.6, 44.6]] },
      { id: 'bloqueo', kind: 'canvas', start: 4.6, end: 9.6 },
      { id: 'avisoConfig', kind: 'canvas', start: 9.6, end: 12.0 },
      { id: 'registro', kind: 'canvas', start: 12.0, end: 15.4 },
      { id: 'llega', kind: 'canvas', start: 15.4, end: 19.4 },
      { id: 'cierre', kind: 'canvas', start: 19.4, end: 24.6 },
    ],
    vo: [[0.35, 'dejaDe'], [2.2, 'recordatorios'], [12.2, 'toques'], [15.6, 'llega'], [20.3, 'lema']],
    cues: {
      notif1: 5.0, notif2: 6.6, tapNotif: 8.6, config: 9.9, testPush: 11.1,
      tapTile: 12.9, tapRegister: 14.1, packet: 15.9, arrive: 17.2,
      logoDraw: 19.5, letters: 20.5, tagline: 21.5, endChips: 22.3,
    },
    energy: [[0, 0], [4.6, 2], [9.6, 1], [12.0, 2], [19.4, 0]],
    endChord: 20.3,
  },
  // ---------------------------------------------------------------- 2
  memoria: {
    title: 'Más fiable que la memoria o el papel',
    intro: {
      offset: 4.6,
      shots: [
        { id: 'cabecera', kind: 'canvas', start: 0.0, end: 2.0 },
        { id: 'consultaIntro', kind: 'orig', start: 2.0, end: 4.6, map: [[2.0, 0.6], [4.6, 2.2]] },
      ],
      vo: [[2.3, 'historia']],
      cues: { logo: 0.05, letters: 0.55, subtitle: 0.95 },
    },
    duration: 31.4,
    shots: [
      { id: 'consulta', kind: 'orig', start: 0.0, end: 3.2, map: [[0, 2.2], [3.2, 6.0]] },
      { id: 'papel', kind: 'canvas', start: 3.2, end: 9.4 },
      { id: 'dudas', kind: 'orig', start: 9.4, end: 15.2, map: [[9.4, 14.0], [15.2, 18.6]] },
      { id: 'fluxiaApp', kind: 'canvas', start: 15.2, end: 17.7 },
      { id: 'historial', kind: 'canvas', start: 17.7, end: 23.8 },
      { id: 'cierre', kind: 'canvas', start: 23.8, end: 31.4 },
    ],
    vo: [[0.4, 'problema'], [9.6, 'detalles'], [15.45, 'cambiar'], [18.0, 'historial'], [20.85, 'tipos'], [23.75, 'fiable'], [27.5, 'lema']],
    cues: {
      memory: 4.4, paper: 6.2, lost: 7.6,
      d1: 9.7, d2: 11.6, d3: 13.4,
      trio: 16.0, rows: 18.6, chips: [21.0, 21.9, 22.7],
      logoDraw: 24.1, letters: 25.6, tagline: 26.6, endChips: 28.4,
    },
    energy: [[0, 0], [9.4, 1], [15.2, 2], [23.8, 0]],
    endChord: 27.5,
  },
};

export function shotAt(shots, t) {
  for (const s of shots) if (t < s.end) return s;
  return shots[shots.length - 1];
}
// Duración total (intro + cuerpo).
export const totalDuration = (sh) => sh.intro.offset + sh.duration;
