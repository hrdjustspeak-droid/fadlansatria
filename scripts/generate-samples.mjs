// Membuat gambar contoh (abstrak) di public/uploads/sample/. Jalankan: node scripts/generate-samples.mjs
// Ganti dengan karya asli lewat CMS; file ini hanya untuk konten demo.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const out = 'public/uploads/sample';
mkdirSync(out, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const palettes = [
  ['#1f2a44', '#e76f51', '#f4a261', '#e9c46a', '#f5f1ea'],
  ['#0b0b0f', '#a3e635', '#3f3f46', '#ededed', '#18181b'],
  ['#2a9d8f', '#264653', '#e9c46a', '#f7f7f2', '#14213d'],
  ['#fdf6f0', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f'],
  ['#ff3b00', '#111111', '#ffffff', '#ffd400', '#2b59c3'],
  ['#c2410c', '#1a1a1a', '#f5f1ea', '#d6c7ae', '#7c2d12'],
  ['#5b5bd6', '#0f172a', '#f1f5f9', '#22d3ee', '#f472b6'],
  ['#3a5a40', '#a3b18a', '#dad7cd', '#344e41', '#588157'],
];

function art(w, h, palette, kind = 'shapes') {
  const [bg, ...cs] = palette;
  let shapes = '';
  if (kind === 'portrait') {
    // Siluet abstrak: kepala + bahu
    shapes += `<circle cx="${w / 2}" cy="${h * 0.4}" r="${w * 0.2}" fill="${cs[0]}"/>`;
    shapes += `<ellipse cx="${w / 2}" cy="${h * 1.02}" rx="${w * 0.45}" ry="${h * 0.38}" fill="${cs[1]}"/>`;
    shapes += `<circle cx="${w * 0.8}" cy="${h * 0.15}" r="${w * 0.1}" fill="${cs[2]}" opacity=".8"/>`;
  } else {
    const n = 5 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      const c = pick(cs);
      const x = rnd() * w;
      const y = rnd() * h;
      const s = (0.15 + rnd() * 0.45) * Math.min(w, h);
      const t = rnd();
      if (t < 0.4) shapes += `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${c}" opacity="${0.75 + rnd() * 0.25}"/>`;
      else if (t < 0.7)
        shapes += `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s * (0.4 + rnd())}" rx="${rnd() * s * 0.2}" fill="${c}" transform="rotate(${rnd() * 40 - 20} ${x} ${y})"/>`;
      else shapes += `<path d="M ${x - s} ${y} A ${s} ${s} 0 0 1 ${x + s} ${y}" stroke="${c}" stroke-width="${s * 0.12}" fill="none"/>`;
    }
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${cs[3]}" stop-opacity=".35"/></linearGradient>
      <filter id="n"><feTurbulence baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter></defs>
      <rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#g)"/>${shapes}
      <rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  );
}

async function save(name, w, h, palette, kind) {
  await sharp(art(w, h, palette, kind)).webp({ quality: 80 }).toFile(`${out}/${name}.webp`);
}

const jobs = [
  ['hero', 2400, 1350, palettes[5]],
  ['hero-dark', 2400, 1350, palettes[1]],
  ['about', 1200, 1500, palettes[0], 'portrait'],
  ['og', 1200, 630, palettes[5]],
  ['header-layanan', 2400, 1000, palettes[2]],
];
for (let i = 1; i <= 8; i++) jobs.push([`project-${i}`, 1600, 1200, palettes[i % palettes.length]]);
const galleryRatios = [
  [1600, 1200],
  [1200, 1600],
  [1600, 900],
  [1400, 1400],
  [1200, 1500],
  [1600, 1066],
];
galleryRatios.forEach(([w, h], i) => jobs.push([`gallery-${i + 1}`, w, h, palettes[(i + 3) % palettes.length]]));
for (let i = 1; i <= 4; i++) jobs.push([`avatar-${i}`, 400, 400, palettes[(i + 1) % palettes.length], 'portrait']);

for (const j of jobs) await save(...j);

// Logo klien: wordmark SVG abu-abu netral (terbaca di latar terang & gelap).
const brands = ['Kopi Senja', 'Arunika', 'Lumbung', 'Teduh Studio', 'Pasar Rakyat', 'Nusa Labs'];
const { writeFileSync } = await import('node:fs');
brands.forEach((b, i) => {
  const w = 40 + b.length * 15;
  writeFileSync(
    `${out}/logo-${i + 1}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="48" viewBox="0 0 ${w} 48"><circle cx="20" cy="24" r="12" fill="#808080"/><text x="40" y="31" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#808080">${b}</text></svg>`,
  );
});
console.log(`Selesai: ${jobs.length} gambar + ${brands.length} logo di ${out}`);
