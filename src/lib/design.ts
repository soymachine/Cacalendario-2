// Fluxia v2 design tokens
// primary/secondary/chip/bg use CSS variables so doctor palette overrides work globally
export const D = {
  bg: 'var(--fluxia-bg, var(--color-bg))',
  card: 'var(--color-surface)',
  text: 'var(--text-primary)',
  textMuted: 'var(--text-secondary)',
  chip: 'var(--fluxia-chip, var(--fx-ink-100))',
  chipDark: 'var(--fluxia-chip-dark, var(--fx-ink-200))',
  chipText: 'var(--fluxia-chip-text, var(--text-primary))',
  border: 'var(--border)',
  primary: 'var(--fluxia-primary, var(--color-primary))',
  primaryText: 'var(--fluxia-primary-text, var(--color-on-primary))',
  secondary: 'var(--fluxia-secondary, var(--color-secondary))',
  navBg: 'var(--fluxia-nav-bg, var(--color-surface))',
  danger: 'var(--color-error)',
  dangerBg: 'var(--color-error-soft)',
  success: 'var(--color-success)',
} as const;
