// Fluxia design tokens — resolved hex values from the web app's
// src/styles/fluxia-tokens.css (React Native has no CSS variables).
export const D = {
  bg: '#F4F7F3', // --fx-ink-50
  card: '#FFFFFF', // --color-surface
  text: '#2D3539', // --fx-ink-800
  textMuted: '#586269', // --fx-ink-600
  chip: '#EEF2EE', // --fx-ink-100
  chipDark: '#DCE2DF', // --fx-ink-200
  chipText: '#2D3539',
  border: '#DCE2DF', // --fx-ink-200
  primary: '#3C7DB8', // --fx-blue-500
  primaryText: '#FFFFFF',
  secondary: '#4DA078', // --fx-green-500
  navBg: '#FFFFFF',
  danger: '#D26464', // --fx-error-500
  dangerBg: '#FBEDED', // --fx-error-50
  success: '#3F9E6E', // --fx-success-500
  accent: '#4DA0A2', // --fx-teal-500
  accentSoft: '#ECF6F6', // --fx-teal-50
  warningSoft: '#FCF4E7', // --fx-warning-50
  warningText: '#C0832B', // --fx-warning-600
} as const;

// Ancho máximo de contenido en pantallas grandes (iPad) — en iPhone el ancho
// de pantalla siempre es menor, así que esto no cambia nada visualmente ahí.
export const CONTENT_MAX_WIDTH = 720; // dashboards/listas
export const FORM_MAX_WIDTH = 480; // formularios de una columna

export const centered = (maxWidth: number) => ({
  width: '100%' as const,
  maxWidth,
  alignSelf: 'center' as const,
});
