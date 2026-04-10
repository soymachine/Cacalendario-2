// Fluxia v2 design tokens
// primary/primaryText use CSS variables so doctor palette overrides work globally
export const D = {
  bg: '#F0F2F4',
  card: '#FFFFFF',
  text: '#353435',
  textMuted: '#9A9A9A',
  chip: '#D7D9D8',
  chipText: '#353435',
  border: '#E8EAED',
  primary: 'var(--fluxia-primary, #353435)',
  primaryText: 'var(--fluxia-primary-text, #E3EBEE)',
  danger: '#C0392B',
  dangerBg: 'rgba(192,57,43,0.08)',
  success: '#27AE60',
} as const;
