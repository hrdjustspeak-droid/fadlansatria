import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { luminance as _l, overlayAlpha } from './color';
import type { Preview } from './content';

type Locals = { preview?: Preview } | undefined;

// Gambar dari CMS ada di public/uploads, jadi tidak lewat astro:assets.
// Ukuran responsif dibuat Netlify Image CDN (/.netlify/images) saat jalan di Netlify;
// di lokal URL asli dipakai apa adanya. Lihat CLAUDE.md.
const USE_CDN = process.env.NETLIFY === 'true' || process.env.IMAGE_CDN === 'true';
export const WIDTHS = [480, 800, 1200, 1600, 2000];

const isLocal = (src: string) => src.startsWith('/');
const isSvg = (src: string) => /\.svg($|\?)/i.test(src);

function localPath(src: string) {
  const p = join(process.cwd(), 'public', decodeURIComponent(src.split('?')[0]));
  if (!existsSync(p)) throw new Error(`Gambar tidak ditemukan: "${src}". Pastikan file sudah di-upload lewat CMS.`);
  return p;
}

/** Di preview editor, gambar yang baru di-upload belum ada di disk. */
const pending = (src: string, l: Locals) =>
  !!l?.preview && isLocal(src) && !existsSync(join(process.cwd(), 'public', decodeURIComponent(src.split('?')[0])));

// Lazy: route preview (Netlify Function) biasanya tidak butuh modul native ini.
const loadSharp = async () => (await import('sharp')).default;

const dimCache = new Map<string, Promise<{ width: number; height: number }>>();

/** Ukuran asli gambar (untuk atribut width/height & layout masonry). */
export function getDimensions(src: string, l?: Locals) {
  const known = l?.preview?.assets?.[src];
  if (known) return Promise.resolve(known);
  if (!isLocal(src) || pending(src, l)) return Promise.resolve({ width: 1600, height: 1200 });
  let p = dimCache.get(src);
  if (!p) {
    p = loadSharp()
      .then((sharp) => sharp(localPath(src)).metadata())
      .then((m) => ({ width: m.width ?? 1600, height: m.height ?? 1200 }));
    dimCache.set(src, p);
  }
  return p;
}

export function cdnUrl(src: string, w: number, h?: number, q = 75, l?: Locals) {
  if (!USE_CDN || l?.preview || !isLocal(src) || isSvg(src)) return src;
  const params = new URLSearchParams({ url: src, w: String(w), q: String(q) });
  if (h) {
    params.set('h', String(h));
    params.set('fit', 'cover');
  }
  return `/.netlify/images?${params}`;
}

/** src/srcset/width/height untuk <img>. `ratio` = lebar/tinggi slot; kosong = rasio asli. */
export async function responsive(src: string, ratio?: number, maxWidth = 2000, l?: Locals) {
  const dims = await getDimensions(src, l);
  const r = ratio ?? dims.width / dims.height;
  const width = Math.min(dims.width, maxWidth);
  const height = Math.round(width / r);
  if (!USE_CDN || l?.preview || !isLocal(src) || isSvg(src)) return { src, srcset: undefined, width, height };
  const widths = WIDTHS.filter((w) => w <= dims.width);
  if (!widths.length) widths.push(dims.width);
  const srcset = widths.map((w) => `${cdnUrl(src, w, ratio ? Math.round(w / r) : undefined)} ${w}w`).join(', ');
  return { src: cdnUrl(src, widths.at(-1)!, ratio ? Math.round(widths.at(-1)! / r) : undefined), srcset, width, height };
}

const overlayCache = new Map<string, Promise<number>>();

/**
 * Opacity overlay gelap supaya teks putih di atas foto lolos 4,5:1 (Bagian 7 langkah 6).
 * Luminans persentil ke-95 diambil dari area teks (default: 70% bawah gambar).
 */
export function textOverlayAlpha(src: string, area: 'bottom' | 'center' = 'bottom', l?: Locals): Promise<number> {
  if (pending(src, l)) return Promise.resolve(0.55);
  const key = `${src}|${area}`;
  let p = overlayCache.get(key);
  if (!p) {
    p = (async () => {
      if (!isLocal(src) || isSvg(src)) return 0.55;
      const sharp = await loadSharp();
      const { data, info } = await sharp(localPath(src)).resize(96).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const y0 = area === 'bottom' ? Math.floor(info.height * 0.3) : Math.floor(info.height * 0.2);
      const y1 = area === 'bottom' ? info.height : Math.ceil(info.height * 0.8);
      const lums: number[] = [];
      for (let y = y0; y < y1; y++)
        for (let x = 0; x < info.width; x++) {
          const i = (y * info.width + x) * info.channels;
          const hex = '#' + [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
          lums.push(_l(hex));
        }
      lums.sort((a, b) => a - b);
      const p95 = lums[Math.floor(lums.length * 0.95)] ?? 1;
      return overlayAlpha(p95);
    })();
    overlayCache.set(key, p);
  }
  return p;
}
