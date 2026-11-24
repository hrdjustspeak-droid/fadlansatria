import { buildThemeColors, type ThemeColors } from './color';

export const PRESET_IDS = ['editorial', 'mono', 'midnight', 'soft', 'brutal', 'nusantara'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

/** Warna awal preset (Bagian 7). Font, radius & shadow ada di styles/themes.css. */
export const PRESETS: Record<PresetId, { name: string; bg: string; text: string; accent: string }> = {
  editorial: { name: 'Editorial', bg: '#F5F1EA', text: '#1A1A1A', accent: '#C2410C' },
  mono: { name: 'Minimal Mono', bg: '#FFFFFF', text: '#0A0A0A', accent: '#0A0A0A' },
  midnight: { name: 'Dark Studio', bg: '#0B0B0F', text: '#EDEDED', accent: '#A3E635' },
  soft: { name: 'Soft Pastel', bg: '#FDF6F0', text: '#2B2B2B', accent: '#E07A5F' },
  brutal: { name: 'Bold Brutalist', bg: '#FFFFFF', text: '#000000', accent: '#FF3B00' },
  nusantara: { name: 'Jakarta Modern', bg: '#F7F7F2', text: '#14213D', accent: '#2A9D8F' },
};

export interface ThemeSettings {
  preset: PresetId;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  motion: 'full' | 'subtle' | 'off';
}

const cache = new Map<string, ThemeColors>();

/** Warna final tema setelah lewat engine kontras. Tabel penyesuaian di-log sekali saat build. */
export function resolveTheme(t: ThemeSettings): ThemeColors {
  const p = PRESETS[t.preset];
  const input = { bg: t.backgroundColor || p.bg, text: t.textColor || p.text, accent: t.accentColor || p.accent };
  const key = JSON.stringify(input);
  let out = cache.get(key);
  if (!out) {
    out = buildThemeColors(input);
    cache.set(key, out);
    if (out.adjustments.length) {
      console.log(`\n[tema] Warna "${t.preset}" digeser demi kontras WCAG AA:`);
      console.table(out.adjustments.map((a) => ({ token: a.token, asli: a.from, hasil: a.to, kontras: `${a.ratio}:1` })));
    }
  }
  return out;
}
