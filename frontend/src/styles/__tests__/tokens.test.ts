import { describe, it, expect } from 'vitest';
import { CLARTE_COLORS, SPACING_SCALE, BREAKPOINTS } from '../tokens';

function srgbToLin(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Tokens SamaAdresse 2.0 Clarté — Conformité WCAG 2.2 AA', () => {
  const textPairs: Array<[string, string, string, number]> = [
    ['ink sur canvas', CLARTE_COLORS.ink, CLARTE_COLORS.canvas, 4.5],
    ['ink sur surface', CLARTE_COLORS.ink, CLARTE_COLORS.surface, 4.5],
    ['ink sur surfaceSecondary', CLARTE_COLORS.ink, CLARTE_COLORS.surfaceSecondary, 4.5],
    ['inkSecondary sur canvas', CLARTE_COLORS.inkSecondary, CLARTE_COLORS.canvas, 4.5],
    ['inkSecondary sur surface', CLARTE_COLORS.inkSecondary, CLARTE_COLORS.surface, 4.5],
    ['inkSecondary sur surfaceSecondary', CLARTE_COLORS.inkSecondary, CLARTE_COLORS.surfaceSecondary, 4.5],
    ['inkMuted sur canvas', CLARTE_COLORS.inkMuted, CLARTE_COLORS.canvas, 4.5],
    ['inkMuted sur surface', CLARTE_COLORS.inkMuted, CLARTE_COLORS.surface, 4.5],
    ['inkMuted sur surfaceSecondary', CLARTE_COLORS.inkMuted, CLARTE_COLORS.surfaceSecondary, 4.5],
    ['blanc sur brand Terracotta', CLARTE_COLORS.inkInverse, CLARTE_COLORS.brand, 4.5],
    ['blanc sur brandHover', CLARTE_COLORS.inkInverse, CLARTE_COLORS.brandHover, 4.5],
    ['brand sur canvas', CLARTE_COLORS.brand, CLARTE_COLORS.canvas, 4.5],
    ['brandHover sur brandSoft', CLARTE_COLORS.brandHover, CLARTE_COLORS.brandSoft, 4.5],
    ['blanc sur institution Bleu fleuve', CLARTE_COLORS.inkInverse, CLARTE_COLORS.institution, 4.5],
    ['institution sur canvas', CLARTE_COLORS.institution, CLARTE_COLORS.canvas, 4.5],
    ['institution sur institutionSoft', CLARTE_COLORS.institution, CLARTE_COLORS.institutionSoft, 4.5],
    ['blanc sur nature Vert baobab', CLARTE_COLORS.inkInverse, CLARTE_COLORS.nature, 4.5],
    ['nature sur natureSoft', CLARTE_COLORS.nature, CLARTE_COLORS.natureSoft, 4.5],
    ['danger sur canvas', CLARTE_COLORS.danger, CLARTE_COLORS.canvas, 4.5],
    ['danger sur dangerSoft', CLARTE_COLORS.danger, CLARTE_COLORS.dangerSoft, 4.5],
    ['warning sur warningSoft', CLARTE_COLORS.warning, CLARTE_COLORS.warningSoft, 4.5],
  ];

  it.each(textPairs)('respecte WCAG 2.2 AA (>= %f:1) pour %s', (_label, fg, bg, minRatio) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(minRatio);
  });

  it('respecte WCAG 2.2 SC 1.4.11 (>= 3.0:1) pour borderControl sur les 3 surfaces claires', () => {
    expect(contrastRatio(CLARTE_COLORS.borderControl, CLARTE_COLORS.canvas)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio(CLARTE_COLORS.borderControl, CLARTE_COLORS.surface)).toBeGreaterThanOrEqual(3.0);
    expect(
      contrastRatio(CLARTE_COLORS.borderControl, CLARTE_COLORS.surfaceSecondary)
    ).toBeGreaterThanOrEqual(3.0);
  });

  it("respecte l'échelle d'espacement multiple de 4 px et les paliers responsive", () => {
    for (const px of Object.values(SPACING_SCALE)) {
      expect(px % 4).toBe(0);
    }
    expect(BREAKPOINTS.mobileMax).toBe(767);
    expect(BREAKPOINTS.tabletMin).toBe(768);
    expect(BREAKPOINTS.desktopMin).toBe(1024);
    expect(BREAKPOINTS.wideMin).toBe(1440);
  });
});
