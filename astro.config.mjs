// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Netlify mengisi URL saat build. SITE_URL menimpa (mis. setelah domain custom terpasang).
const site = process.env.SITE_URL || process.env.URL || 'http://localhost:4321';

// Halaman custom ber-noindex/draft tidak masuk sitemap.
const hidden = readdirSync('src/content/custom-pages')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`src/content/custom-pages/${f}`, 'utf8')))
  .filter((p) => p.draft || p.seo?.noindex)
  .map((p) => `/${p.slug}`);

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '') || '/';
        return !path.startsWith('/dev') && path !== '/404' && !hidden.includes(path);
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
