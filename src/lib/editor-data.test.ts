import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PATHS, diffFiles, parseFiles, parseMarkdown, serialize, slugify, uniqueId } from './content-files';
import { removeMenuLinks, validateContent } from './validate';
import { parsePreviewRequest } from './preview';

function loadRepo(): Record<string, string> {
  const files: Record<string, string> = {};
  const add = (p: string) => (files[p] = readFileSync(p, 'utf8'));
  [PATHS.site, PATHS.theme, PATHS.navigation, PATHS.home, PATHS.about].forEach(add);
  readdirSync(PATHS.customDir).forEach((f) => add(PATHS.customDir + f));
  readdirSync(PATHS.projectDir).forEach((f) => add(PATHS.projectDir + f));
  return files;
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('content-files', () => {
  it('parse → serialize → parse stabil', () => {
    const state = parseFiles(loadRepo());
    expect(parseFiles(serialize(state))).toEqual(state);
    expect(Object.keys(state.projects)).toContain('rebrand-kopi-senja');
    expect(state.customPages.layanan.slug).toBe('layanan');
  });

  it('serialisasi ulang tanpa perubahan tidak menghasilkan diff', () => {
    const once = serialize(parseFiles(loadRepo()));
    expect(diffFiles(once, serialize(parseFiles(once)))).toEqual({});
  });

  it('diff mendeteksi ubah, tambah, dan hapus', () => {
    const base = serialize(parseFiles(loadRepo()));
    const s = parseFiles(base);
    s.home.sections[0].headline = 'Baru';
    s.customPages.baru = { ...clone(s.customPages.faq), slug: 'baru' };
    delete s.customPages['pameran-2026'];
    const d = diffFiles(base, serialize(s));
    expect(Object.keys(d).sort()).toEqual([PATHS.home, `${PATHS.customDir}baru.json`, `${PATHS.customDir}pameran-2026.json`].sort());
    expect(d[`${PATHS.customDir}pameran-2026.json`]).toBeNull();
  });

  it('frontmatter + body markdown', () => {
    expect(parseMarkdown('---\ntitle: "A"\nyear: 2026\n---\n\n## Isi\n')).toEqual({ data: { title: 'A', year: 2026 }, body: '## Isi' });
  });

  it('slugify & uniqueId', () => {
    expect(slugify('Pameran Kemasan 2026!')).toBe('pameran-kemasan-2026');
    expect(slugify('Café Ümlaut')).toBe('cafe-umlaut');
    expect(uniqueId('faq', ['faq', 'faq-2'])).toBe('faq-3');
  });
});

describe('validateContent', () => {
  const ok = () => parseFiles(loadRepo());

  it('konten contoh valid', () => expect(validateContent(ok())).toEqual([]));

  it('halaman draft yang masih di menu ditolak', () => {
    const s = ok();
    s.customPages.faq.draft = true;
    const p = validateContent(s);
    expect(p.some((x) => x.doc === 'navigation' && /\/faq/.test(x.message))).toBe(true);
  });

  it('removeMenuLinks membereskan menu', () => {
    const s = ok();
    s.customPages.faq.draft = true;
    s.navigation = removeMenuLinks(s.navigation, 'faq');
    // Banner CTA di /layanan masih menaut ke FAQ
    expect(validateContent(s).map((x) => x.doc)).toEqual(['custom:layanan']);
  });

  it('slug dicadangkan & bentrok', () => {
    const s = ok();
    s.customPages['pameran-2026'].slug = 'layanan';
    s.customPages['pameran-2026'].draft = false;
    s.customPages.faq.slug = 'admin';
    const msgs = validateContent(s).map((x) => `${x.doc} ${x.path}`);
    expect(msgs).toContain('custom:pameran-2026 slug');
    expect(msgs).toContain('custom:faq slug');
  });

  it('pesan field dari skema', () => {
    const s = ok();
    s.home.sections[0].headline = 'x'.repeat(90);
    expect(validateContent(s)).toContainEqual({ doc: 'home', path: 'sections.0.headline', message: 'Maks. 80 karakter' });
  });
});

describe('parsePreviewRequest', () => {
  const base = () => {
    const s = parseFiles(loadRepo());
    return {
      site: s.site,
      theme: s.theme,
      navigation: s.navigation,
      customPages: Object.values(s.customPages).map((p) => ({ slug: p.slug, title: p.title, draft: !!p.draft })),
      projects: Object.entries(s.projects).map(([id, p]) => ({ id, data: p.data })),
      s,
    };
  };

  it('menerima halaman valid', () => {
    const { s, ...ctx } = base();
    const r = parsePreviewRequest({ ...ctx, kind: 'home', page: s.home });
    expect(r.ok).toBe(true);
  });

  it('menolak halaman tidak valid dengan path', () => {
    const { s, ...ctx } = base();
    s.home.sections[0].headline = '';
    const r = parsePreviewRequest({ ...ctx, kind: 'home', page: s.home });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0].path).toBe('page.sections.0.headline');
  });

  it('menolak jenis halaman asing', () => {
    const { s, ...ctx } = base();
    expect(parsePreviewRequest({ ...ctx, kind: 'admin', page: s.home }).ok).toBe(false);
  });
});
