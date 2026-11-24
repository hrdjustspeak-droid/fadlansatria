# Portobuilder — panduan untuk Claude Code

Website portfolio statis. Konten diedit lewat **editor visual `/edit`** (utama, ala Google Sites) atau Sveltia CMS di `/admin` (cadangan, berbasis form). Spesifikasi lengkap: `PRD.md`. Panduan editor non-tech: `PANDUAN-EDITOR.md`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Generate `public/admin/config.yml`, lalu dev server di http://localhost:4321 |
| `npm run build` | Generate config CMS → `astro check` → build ke `dist/` |
| `npm test` | Vitest: engine kontras (termasuk property test 10.000 kombinasi), parser YouTube, sinkron CMS ↔ Zod |
| `npm run preview` | Sajikan `dist/` |
| `npm run samples` | Buat ulang gambar contoh abstrak di `public/uploads/sample/` |

Windows: jalankan Vitest dari path berhuruf besar (`C:\laragon\...`). Path `c:\` kecil membuat Vitest memuat dua instance dan gagal dengan "Cannot read properties of undefined (reading 'config')".

## Stack

Astro 7 (`output: static`) + TypeScript strict, Tailwind CSS 4 (lewat `@tailwindcss/vite`), Sveltia CMS (CDN), GSAP + ScrollTrigger + Lenis, Astro View Transitions (`ClientRouter`), `lite-youtube-embed`, Fontsource (self-host), Netlify (hosting, Forms, Image CDN), `@astrojs/sitemap`, `marked` untuk markdown di field JSON. Zod dari `astro/zod` (Zod 4).

## Editor visual (`/edit`)

- `src/pages/edit/index.astro` memuat `src/editor/Editor.svelte` (Svelte 5, `client:only`). UI editor netral, terpisah dari tema situs.
- **Kanvas = komponen situs asli.** `src/pages/edit/render.astro` (on-demand, `prerender = false`, jadi Netlify Function) menerima POST JSON konten draft, memvalidasinya (`lib/preview.ts`), mengisi `Astro.locals.preview`, lalu merender view halaman yang sama dengan situs publik (`src/components/pages/*View.astro`). Wajib header `x-portobuilder-preview: 1`.
- Semua getter konten (`getSite`, `getTheme`, `getNavigation`, `getProjects`, `ctaHref`) dan helper gambar menerima `Astro.locals` supaya override preview berlaku. **Setiap komponen baru yang membaca konten wajib meneruskan `Astro.locals`.**
- Teks yang bisa diedit langsung di kanvas ditandai `{...ed(Astro.locals, 'path')}` (`lib/edit.ts`; hanya muncul di preview). Path relatif terhadap section, atau `page.xxx` untuk field halaman. `SectionRenderer` membungkus section dengan `data-section={indeksAsli}` di preview.
- Form panel kanan dibangun otomatis dari `src/lib/cms-fields.mjs` (sumber yang sama dengan config Sveltia). Field baru cukup ditambah di sana + `schemas.ts`.
- Simpan: mode lokal (`npm run dev`) menulis file lewat `src/pages/edit/api/files.ts` (hanya aktif di DEV, path di-whitelist `isWritableContent`/`isWritableUpload`). Produksi: login GitHub via OAuth Netlify (popup), publish = satu commit via Git Data API (`src/editor/storage.ts`), menolak bila file yang sama berubah sejak dimuat.
- Draft otomatis di localStorage (+ file upload di IndexedDB), undo/redo 100 langkah, validasi lintas-file sebelum publish (`lib/validate.ts`, aturan sama dengan build).
- Gambar di-upload dikompres di browser ke WebP maks. 2400 px (`src/editor/media.ts`).

## Struktur

- `src/content/` — konten (diedit CMS). `settings/{site,theme,navigation}.json`, `pages/{home,about}.json`, `custom-pages/*.json`, `projects/*.md`.
- `src/lib/schemas.ts` — **semua skema Zod**. `src/content.config.ts` hanya memasang skema ke koleksi.
- `src/lib/cms-fields.mjs` — **definisi field tunggal** (label, hint, batas) untuk editor visual dan Sveltia. `scripts/cms-config.mjs` menulis `public/admin/config.yml` darinya; jangan edit `config.yml` langsung.
- `src/lib/cms-sync.test.ts` — gagal bila field/varian di CMS dan Zod tidak sama. Setiap mengubah salah satu, ubah juga yang lain.
- `src/lib/content.ts` — akses konten + validasi lintas-file (slug bentrok/dicadangkan, link menu ke halaman yang tidak ada/draft → build gagal dengan pesan jelas).
- `src/lib/color.ts` — engine kontras WCAG; `src/lib/themes.ts` — data 6 preset + `resolveTheme()`; `src/lib/fonts.ts` — `@font-face` per preset.
- `src/lib/image.ts` — `srcset` Netlify Image CDN, dimensi gambar via sharp, opacity overlay teks-di-atas-foto.
- `src/components/sections/*` — 14 section. `SectionRenderer.astro` memetakan `type` → komponen.
- `src/pages/dev/sections/[...mode].astro` — katalog QA semua section × varian × preset (`/dev/sections`, `/max`, `/min`). noindex, di luar sitemap.
- `src/scripts/motion.ts` — semua animasi.

## Aturan desain (PRD Bagian 7)

- **Tidak boleh ada warna hard-coded di komponen.** Palet bawaan Tailwind dimatikan (`--color-*: initial`); pakai token: `bg`, `surface`, `text`, `muted`, `border`, `accent`, `accent-contrast`, `accent-hover` (kelas Tailwind `bg-surface`, `text-muted`, dst.) atau `var(--...)`. Satu-satunya warna literal ada di `styles/themes.css` (`--on-image`, `--scrim`, shadow gelap).
- Warna final dihitung saat build oleh `resolveTheme()` dan disuntikkan sebagai `:root{...}` di `BaseLayout`. Latar tidak pernah diubah; teks/muted/aksen/border digeser lightness OKLCH-nya seminimal mungkin sampai lolos AA (4,5:1 teks, 3:1 border). Build log menampilkan tabel penyesuaian.
- Penyesuaian preset bawaan saat ini (aksen gagal 4,5:1 di latar preset): soft `#E07A5F → #B5533A`, brutal `#FF3B00 → #D32F00`, nusantara `#2A9D8F → #007E72`.
- **Semua preset memakai Montserrat** (permintaan pemilik, menggantikan font per preset di PRD Bagian 7). Satu file variabel latin (`lib/fonts.ts`), di-preload. Karakter preset dibedakan lewat `--heading-weight`, `--heading-tracking`, dan `--heading-case` di `themes.css`.
- Skala tipe disesuaikan untuk Montserrat yang lebar: H1 40→72 px (PRD: 40→96), body 16→17 px. Di 96 px judul hero pecah jadi 5 baris dan keluar layar pertama.
- Token non-warna per preset (radius, shadow kartu, bobot heading) di `styles/themes.css`. Latar gelap (L < 0,18) → `data-card="dark"`: shadow gelap + border tipis.
- Semua kartu memakai kelas `.card` (radius + shadow wajib). Kartu yang bisa diklik: `.card.card-hover` + link judul `.card-link` (seluruh kartu bisa diklik). Shadow hover di-fade lewat `::after`, bukan animasi `box-shadow`.
- Tepi gambar: `EdgeImage.astro` + kelas `.edge-{none,frame,vignette,fade-bottom,dark-vignette}` dan `.edge-{soft,medium,strong}`. Tidak dipakai di dalam kartu.
- Rasio terkunci per slot: hero 16:9 (split 4:5, keputusan desain agar foto tidak terlalu pendek di kolom), cover 4:3, About 4:5, avatar 1:1, page header 12:5, galeri masonry = rasio asli.
- Tipografi fluid `clamp()` di `global.css` (`--fs-h1` 40→72 px, body 16→17 px). Kontainer maks. 1280 px, padding 20→48 px.

## Aturan motion (PRD Bagian 8)

- Hanya `transform` dan `opacity` (plus clip-path reveal galeri detail proyek sesuai PRD).
- Atribut penanda: `data-hero-line` (animasi load hero), `data-reveal` (fade-up saat scroll, `top 85%`), `data-clip` (reveal clip-path), `data-count` (angka naik).
- `full`: semua + Lenis. `subtle`: fade tanpa geser, tanpa Lenis. `off` / `prefers-reduced-motion`: tidak ada animasi.
- State awal diset oleh GSAP (bukan CSS), jadi konten terlihat walau JS gagal. Init di `astro:page-load`, dibersihkan di `astro:before-swap`.
- Script komponen selalu pakai `document.addEventListener('astro:page-load', ...)` karena View Transitions.

## Keputusan teknis

- **Gambar responsif: Netlify Image CDN**, bukan `astro:assets`. Alasan: gambar CMS ada di `public/uploads` (tidak diproses `astro:assets`), dan CDN membuat ukuran + format (AVIF/WebP) on-the-fly tanpa memperlambat build. Aktif bila `NETLIFY=true` (otomatis di Netlify) atau `IMAGE_CDN=true`; di lokal URL asli dipakai. `width`/`height` selalu dari sharp.
- Overlay teks di atas foto (hero fullbleed): sharp menghitung luminans persentil-95 area teks saat build → `overlayAlpha()`.
- Adapter `@astrojs/netlify` dengan `devFeatures: false` (tanpa emulasi Deno/Edge di dev) dan `imageCDN: false` (srcset dibuat `lib/image.ts`). Semua halaman tetap statis di `dist/`.
- Markdown body proyek dirender dengan `marked` (bukan pipeline Astro) supaya kanvas editor dan situs identik.
- Mobile menu & lightbox memakai `<dialog>` native (focus trap + Esc bawaan). FAQ memakai `<details>`.
- `backend.repo` di config CMS diambil dari `REPOSITORY_URL` (Netlify) atau `CMS_REPO`; tanpa `base_url` sehingga Sveltia memakai OAuth Netlify.
- Kategori proyek (placeholder PRD): Branding, UI/UX, Ilustrasi, Video — ada di `schemas.ts` dan `cms-config.mjs`.
