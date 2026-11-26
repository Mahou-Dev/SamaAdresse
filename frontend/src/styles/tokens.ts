/**
 * SamaAdresse 2.0 — Tokens de Design typés (« SamaAdresse Clarté »).
 * Source de vérité unique côté TypeScript, alignée avec src/styles/tokens.css.
 */

export const CLARTE_COLORS = {
  // Surfaces
  canvas: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceSecondary: '#FAF8F5',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  surfaceActive: '#E2E8F0',
  surfaceInverse: '#0F172A',

  // Typographie
  ink: '#0F172A',
  inkSecondary: '#334155',
  /** Ajusté depuis #64748B pour garantir WCAG 2.2 AA (>= 4.5:1) sur #FFFFFF, #F8FAFC et #FAF8F5. */
  inkMuted: '#5B6B7F',
  /** Conservé pour icônes et grands éléments non textuels (>= 3:1). */
  inkSubtle: '#64748B',
  inkInverse: '#FFFFFF',

  // Signature & Identité culturelle
  brand: '#C2410C',
  brandHover: '#9A3412',
  brandActive: '#7C2D12',
  brandSoft: '#FFF7ED',
  brandBorder: '#FDBA74',

  institution: '#0369A1',
  institutionHover: '#075985',
  institutionActive: '#0C4A6E',
  institutionSoft: '#F0F9FF',
  institutionBorder: '#BAE6FD',

  nature: '#15803D',
  natureHover: '#166534',
  natureSoft: '#F0FDF4',
  natureBorder: '#BBF7D0',

  // États sémantiques
  success: '#15803D',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',

  warning: '#92400E',
  warningSolid: '#D97706',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',

  danger: '#B91C1C',
  dangerHover: '#991B1B',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',

  info: '#0369A1',
  infoSoft: '#F0F9FF',
  infoBorder: '#BAE6FD',

  // Délimitations
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  /** Bordure de contrôle de formulaire conforme WCAG 2.2 SC 1.4.11 (>= 3:1 sur surfaces claires). */
  borderControl: '#7C8B9E',
} as const;

export const SPACING_SCALE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  wideMin: 1440,
} as const;

export const CONTAINER_WIDTHS = {
  narrow: '640px',
  form: '768px',
  content: '1120px',
  wide: '1280px',
  max: '1440px',
} as const;

export const Z_INDEX = {
  base: 0,
  sticky: 20,
  header: 40,
  dropdown: 45,
  overlay: 50,
  modal: 60,
  toast: 70,
  tooltip: 80,
} as const;
