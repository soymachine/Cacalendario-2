// Fluxia v2 design tokens
// primary/secondary/chip/bg use CSS variables so doctor palette overrides work globally
export const D = {
  bg: 'var(--fluxia-bg, #F0F2F4)',
  card: '#FFFFFF',
  text: '#353435',
  textMuted: '#9A9A9A',
  chip: 'var(--fluxia-chip, #D7D9D8)',
  chipDark: 'var(--fluxia-chip-dark, #B8BABC)',
  chipText: 'var(--fluxia-chip-text, #353435)',
  border: '#E8EAED',
  primary: 'var(--fluxia-primary, #353435)',
  primaryText: 'var(--fluxia-primary-text, #E3EBEE)',
  secondary: 'var(--fluxia-secondary, #353435)',
  danger: '#C0392B',
  dangerBg: 'rgba(192,57,43,0.08)',
  success: '#27AE60',
} as const;
