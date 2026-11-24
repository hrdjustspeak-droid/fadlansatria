// Fontsource self-host: hanya subset latin, satu file variabel per keluarga.
// Kita tulis @font-face sendiri supaya halaman cuma memuat 2 font milik preset aktif.
import instrumentSerif from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';
import inter from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import interTight from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';
import spaceGrotesk from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
import fraunces from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url';
import dmSans from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
import syne from '@fontsource-variable/syne/files/syne-latin-wght-normal.woff2?url';
import manrope from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import jakarta from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url';
import type { PresetId } from './themes';

interface Face {
  family: string;
  url: string;
  weight: string;
}

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const F = {
  instrumentSerif: { family: 'Instrument Serif', url: instrumentSerif, weight: '400' },
  inter: { family: 'Inter Variable', url: inter, weight: '100 900' },
  interTight: { family: 'Inter Tight Variable', url: interTight, weight: '100 900' },
  spaceGrotesk: { family: 'Space Grotesk Variable', url: spaceGrotesk, weight: '300 700' },
  fraunces: { family: 'Fraunces Variable', url: fraunces, weight: '100 900' },
  dmSans: { family: 'DM Sans Variable', url: dmSans, weight: '100 1000' },
  syne: { family: 'Syne Variable', url: syne, weight: '400 800' },
  manrope: { family: 'Manrope Variable', url: manrope, weight: '200 800' },
  jakarta: { family: 'Plus Jakarta Sans Variable', url: jakarta, weight: '200 800' },
} satisfies Record<string, Face>;

export const PRESET_FONTS: Record<PresetId, { heading: Face; body: Face }> = {
  editorial: { heading: F.instrumentSerif, body: F.inter },
  mono: { heading: F.interTight, body: F.inter },
  midnight: { heading: F.spaceGrotesk, body: F.inter },
  soft: { heading: F.fraunces, body: F.dmSans },
  brutal: { heading: F.syne, body: F.manrope },
  nusantara: { heading: F.jakarta, body: F.jakarta },
};

const fallback = (f: Face) => (f.family.includes('Serif') || f.family.includes('Fraunces') ? 'Georgia, serif' : 'system-ui, sans-serif');

/** CSS @font-face + variabel font untuk satu preset (atau beberapa, untuk katalog /dev). */
export function fontCss(presets: PresetId[]): string {
  const faces = new Map<string, Face>();
  for (const p of presets) {
    faces.set(PRESET_FONTS[p].heading.family, PRESET_FONTS[p].heading);
    faces.set(PRESET_FONTS[p].body.family, PRESET_FONTS[p].body);
  }
  const fontFaces = [...faces.values()]
    .map(
      (f) =>
        `@font-face{font-family:'${f.family}';font-style:normal;font-display:swap;font-weight:${f.weight};src:url(${f.url}) format('woff2');unicode-range:${LATIN}}`,
    )
    .join('');
  const vars = presets
    .map((p) => {
      const { heading, body } = PRESET_FONTS[p];
      return `[data-theme="${p}"]{--font-heading:'${heading.family}',${fallback(heading)};--font-body:'${body.family}',${fallback(body)}}`;
    })
    .join('');
  return fontFaces + vars;
}
