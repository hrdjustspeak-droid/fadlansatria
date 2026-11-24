import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CONTRAST_RULES, buildThemeColors, contrast, luminance, overlayAlpha } from './color';
import { PRESETS } from './themes';

function assertAllPairs(input: { bg: string; text: string; accent: string }) {
  const { vars } = buildThemeColors(input);
  for (const rule of CONTRAST_RULES) {
    for (const b of rule.bg) {
      const r = contrast(vars[rule.fg], vars[b]);
      if (r < rule.target) throw new Error(`${rule.fg} vs ${b} = ${r.toFixed(2)} < ${rule.target} untuk ${JSON.stringify(input)}`);
    }
  }
}

describe('rumus kontras WCAG', () => {
  it('hitam vs putih = 21:1', () => expect(contrast('#000', '#fff')).toBeCloseTo(21, 5));
  it('#777 di atas putih ≈ 4,48:1', () => expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2));
  it('warna sama = 1:1', () => expect(contrast('#C2410C', '#c2410c')).toBe(1));
  it('luminans putih = 1, hitam = 0', () => {
    expect(luminance('#fff')).toBe(1);
    expect(luminance('#000')).toBe(0);
  });
  it('warna tidak valid ditolak dengan pesan jelas', () => expect(() => luminance('bukan-warna')).toThrow(/Warna tidak valid/));
});

describe('engine tema', () => {
  it.each(Object.entries(PRESETS))('preset %s lolos AA', (_, p) => assertAllPairs(p));

  it.each([
    ['latar abu-abu tengah', { bg: '#777777', text: '#888888', accent: '#7a7a7a' }],
    ['kuning di atas putih', { bg: '#ffffff', text: '#ffff00', accent: '#ffff00' }],
    ['merah murni', { bg: '#ff0000', text: '#ff0000', accent: '#ff0000' }],
    ['teks = latar', { bg: '#F5F1EA', text: '#F5F1EA', accent: '#F5F1EA' }],
    ['hitam total', { bg: '#000000', text: '#000000', accent: '#000000' }],
    ['putih total', { bg: '#ffffff', text: '#ffffff', accent: '#ffffff' }],
  ])('kasus ekstrem: %s', (_, input) => assertAllPairs(input));

  it('latar tidak pernah diubah', () => {
    expect(buildThemeColors({ bg: '#777777', text: '#777777', accent: '#777777' }).vars['--bg']).toBe('#777777');
  });

  it('mempertahankan warna yang sudah lolos', () => {
    const { vars, adjustments } = buildThemeColors(PRESETS.mono);
    expect(vars['--text']).toBe('#0a0a0a');
    expect(adjustments).toEqual([]);
  });

  it('card mode gelap untuk latar gelap', () => {
    expect(buildThemeColors(PRESETS.midnight).cardMode).toBe('dark');
    expect(buildThemeColors(PRESETS.editorial).cardMode).toBe('light');
  });

  it('property: 10.000 kombinasi acak selalu lolos', () => {
    const hex = fc.integer({ min: 0, max: 0xffffff }).map((n) => '#' + n.toString(16).padStart(6, '0'));
    fc.assert(
      fc.property(hex, hex, hex, (bg, text, accent) => {
        assertAllPairs({ bg, text, accent });
      }),
      { numRuns: 10_000 },
    );
  }, 120_000);
});

describe('overlay teks di atas foto', () => {
  it('foto gelap tidak butuh overlay', () => expect(overlayAlpha(0.02)).toBe(0));
  it('foto putih butuh overlay cukup untuk 4,5:1', () => {
    const a = overlayAlpha(1);
    expect(a).toBeGreaterThan(0.4);
    // putih digelapkan (1-a) lalu dibandingkan dengan teks putih
    const g = Math.round(255 * (1 - a)).toString(16).padStart(2, '0');
    expect(contrast('#ffffff', `#${g}${g}${g}`)).toBeGreaterThanOrEqual(4.5);
  });
  it('monoton naik', () => expect(overlayAlpha(0.8)).toBeGreaterThanOrEqual(overlayAlpha(0.4)));
});
