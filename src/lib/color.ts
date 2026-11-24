import { clampChroma, converter, formatHex } from 'culori';

const toRgb = converter('rgb');
const toOklch = converter('oklch');

const BLACK = '#000000';
const WHITE = '#ffffff';
const MARGIN = 0.1;

function parse(hex: string) {
  const c = toRgb(hex);
  if (!c) throw new Error(`Warna tidak valid: "${hex}". Pakai format hex, contoh #1A1A1A.`);
  return c;
}

function lin(v: number) {
  v = Math.min(1, Math.max(0, v));
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Luminans relatif WCAG 2.x. */
export function luminance(hex: string): number {
  const c = parse(hex);
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function contrastFromLum(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function contrast(a: string, b: string): number {
  return contrastFromLum(luminance(a), luminance(b));
}

export function normalize(hex: string): string {
  return formatHex(parse(hex));
}

/** Hitam atau putih, mana yang kontrasnya paling tinggi terhadap `bg`. */
export function bestExtreme(bg: string): string {
  return contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
}

/** Ganti lightness OKLCH, pertahankan hue & chroma (di-clamp ke gamut sRGB). */
function withLightness(hex: string, l: number): string {
  const c = toOklch(parse(hex))!;
  return formatHex(clampChroma({ ...c, l: Math.min(1, Math.max(0, l)) }, 'oklch'));
}

function lightnessOf(hex: string): number {
  return toOklch(parse(hex))!.l;
}

const minContrast = (hex: string, against: string[]) => Math.min(...against.map((b) => contrast(hex, b)));

/**
 * Geser lightness `hex` seminimal mungkin sampai kontrasnya ke semua warna `against` >= target.
 * against[0] adalah jangkar (latar): arah pertama menjauh dari luminansnya.
 */
export function ensureContrast(hex: string, against: string[], target: number): string {
  hex = normalize(hex);
  if (minContrast(hex, against) >= target) return hex;

  const goal = target + MARGIN;
  const startL = lightnessOf(hex);
  const first = bestExtreme(against[0]) === BLACK ? 0 : 1;

  for (const end of [first, 1 - first]) {
    if (minContrast(withLightness(hex, end), against) < goal) continue;
    let lo = startL; // gagal
    let hi = end; // lolos
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      if (minContrast(withLightness(hex, mid), against) >= goal) hi = mid;
      else lo = mid;
    }
    const out = withLightness(hex, hi);
    if (minContrast(out, against) >= target) return out;
  }
  // Fallback terakhir: hitam/putih.
  return minContrast(BLACK, against) >= minContrast(WHITE, against) ? BLACK : WHITE;
}

/** Surface kartu: latar digeser 3–5% lightness, tanpa merusak warna ekstrem yang aman untuk teks. */
function deriveSurface(bg: string): string {
  const safe = bestExtreme(bg);
  const l = lightnessOf(bg);
  const candidates =
    safe === WHITE ? [withLightness(bg, l + 0.05), withLightness(bg, l - 0.04)] : [withLightness(bg, l + 0.04), withLightness(bg, l - 0.03)];
  for (const s of candidates) {
    if (s !== bg && contrast(safe, s) >= 4.5 + MARGIN && contrast(safe, bg) >= 4.5) return s;
  }
  return bg;
}

function mixLightness(from: string, toward: string, t: number): string {
  const a = lightnessOf(from);
  const b = lightnessOf(toward);
  return withLightness(from, a + (b - a) * t);
}

export interface ThemeInput {
  bg: string;
  text: string;
  accent: string;
}

export interface Adjustment {
  token: string;
  from: string;
  to: string;
  ratio: number;
}

export interface ThemeColors {
  vars: Record<string, string>;
  cardMode: 'dark' | 'light';
  adjustments: Adjustment[];
}

/** Target kontras per pasangan (Bagian 7 PRD). Dipakai juga oleh test. */
export const CONTRAST_RULES: { fg: string; bg: string[]; target: number }[] = [
  { fg: '--text', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--muted', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent-hover', bg: ['--bg', '--surface'], target: 4.5 },
  { fg: '--accent-contrast', bg: ['--accent'], target: 4.5 },
  { fg: '--accent-hover-contrast', bg: ['--accent-hover'], target: 4.5 },
  { fg: '--border', bg: ['--bg', '--surface'], target: 3 },
];

export function buildThemeColors(input: ThemeInput): ThemeColors {
  const bg = normalize(input.bg);
  const surface = deriveSurface(bg);
  const pair = [bg, surface];
  const adjustments: Adjustment[] = [];

  const track = (token: string, from: string, to: string, against: string[]) => {
    if (normalize(from) !== to) adjustments.push({ token, from: normalize(from), to, ratio: round2(minContrast(to, against)) });
    return to;
  };

  const text = track('--text', input.text, ensureContrast(input.text, pair, 4.5), pair);
  const muted = ensureContrast(mixLightness(text, bg, 0.35), pair, 4.5);
  const border = ensureContrast(mixLightness(text, bg, 0.6), pair, 3);
  const accent = track('--accent', input.accent, ensureContrast(input.accent, pair, 4.5), pair);
  const accentL = lightnessOf(accent);
  const hoverStart = withLightness(accent, bestExtreme(bg) === BLACK ? accentL - 0.08 : accentL + 0.08);
  const accentHover = ensureContrast(hoverStart, pair, 4.5);

  return {
    vars: {
      '--bg': bg,
      '--surface': surface,
      '--text': text,
      '--muted': muted,
      '--border': border,
      '--accent': accent,
      '--accent-contrast': bestExtreme(accent),
      '--accent-hover': accentHover,
      '--accent-hover-contrast': bestExtreme(accentHover),
    },
    cardMode: luminance(bg) < 0.18 ? 'dark' : 'light',
    adjustments,
  };
}

/**
 * Opacity overlay hitam supaya teks putih di atas foto lolos 4,5:1.
 * `p95Lum` = luminans persentil ke-95 area teks pada gambar.
 */
export function overlayAlpha(p95Lum: number, target = 4.5): number {
  // Luminans -> nilai abu-abu sRGB, lalu digelapkan (1 - a).
  const gray = p95Lum <= 0.0031308 ? p95Lum * 12.92 : 1.055 * p95Lum ** (1 / 2.4) - 0.055;
  const passes = (a: number) => contrastFromLum(1, lin(gray * (1 - a))) >= target + MARGIN;
  if (passes(0)) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
