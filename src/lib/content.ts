import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { RESERVED_SLUGS } from './schemas';

export type CustomPage = CollectionEntry<'customPages'>;
export type Project = CollectionEntry<'projects'>;

export interface LinkLike {
  label?: string;
  linkType?: 'builtin' | 'custom' | 'external';
  builtinPage?: string;
  customPage?: string;
  url?: string;
}

const BUILTIN_HREF: Record<string, string> = { home: '/', projects: '/projects', about: '/about', '#kontak': '/#kontak' };

type Single = 'site' | 'theme' | 'navigation' | 'home' | 'about';
/** Koleksi satu-file: id entri sama dengan nama koleksi. */
async function one<C extends Single>(c: C): Promise<CollectionEntry<C>['data']> {
  const e = await getEntry(c, c);
  if (!e) throw new Error(`File konten untuk "${c}" tidak ditemukan di src/content.`);
  return e.data as CollectionEntry<C>['data'];
}

export const getSite = () => one('site');
export const getTheme = () => one('theme');
export const getHome = () => one('home');
export const getAbout = () => one('about');

/** Halaman custom yang terbit. Gagal build bila slug bentrok/dicadangkan. */
export async function getCustomPages(): Promise<CustomPage[]> {
  const all = await getCollection('customPages');
  const seen = new Map<string, string>();
  for (const p of all) {
    const where = p.filePath ?? p.id;
    if (RESERVED_SLUGS.includes(p.data.slug)) throw new Error(`[Halaman Custom] ${where}: slug "${p.data.slug}" dicadangkan sistem.`);
    const other = seen.get(p.data.slug);
    if (other) throw new Error(`[Halaman Custom] Slug "${p.data.slug}" dipakai dua halaman: ${other} dan ${where}. Ganti salah satu.`);
    seen.set(p.data.slug, where);
  }
  return all.filter((p) => !p.data.draft);
}

/** Proyek terbit, urut `order` lalu `year` terbaru. */
export async function getProjects(): Promise<Project[]> {
  const all = (await getCollection('projects')).filter((p) => !p.data.draft);
  return all.sort((a, b) => {
    const oa = a.data.order ?? Infinity;
    const ob = b.data.order ?? Infinity;
    if (oa !== ob) return oa - ob;
    return b.data.year - a.data.year || a.data.title.localeCompare(b.data.title);
  });
}

/** Ubah link CMS jadi href. Link ke halaman custom yang tidak ada / draft menggagalkan build. */
export function resolveHref(link: LinkLike, publishedSlugs: Set<string>, where: string): string {
  switch (link.linkType) {
    case 'builtin':
      return BUILTIN_HREF[link.builtinPage ?? ''] ?? '/';
    case 'custom':
      if (!link.customPage || !publishedSlugs.has(link.customPage))
        throw new Error(
          `[${where}] Link "${link.label ?? ''}" mengarah ke halaman custom "/${link.customPage}" yang tidak ada atau masih draft. Hapus link ini dari menu, atau terbitkan halamannya.`,
        );
      return `/${link.customPage}`;
    case 'external':
      return link.url ?? '#';
    default:
      return '#';
  }
}

let navCache: ReturnType<typeof buildNav> | undefined;

async function buildNav() {
  const [nav, pages] = await Promise.all([one('navigation'), getCustomPages()]);
  const slugs = new Set(pages.map((p) => p.data.slug));
  const main = nav.mainMenu.map((m) => ({ label: m.label, href: resolveHref(m, slugs, 'Menu Navbar'), newTab: m.openNewTab }));
  const footer = nav.footerMenu.map((m) => ({ label: m.label, href: resolveHref(m, slugs, 'Menu Footer') }));
  const cta = nav.ctaButton.enabled ? { label: nav.ctaButton.label!, href: resolveHref({ ...nav.ctaButton, linkType: nav.ctaButton.linkType }, slugs, 'Tombol CTA Navbar') } : undefined;
  return { main, footer, cta, slugs };
}

export function getNavigation() {
  if (import.meta.env.DEV) return buildNav(); // dev: konten bisa berubah tanpa restart
  return (navCache ??= buildNav());
}

/** Href untuk CTA di dalam section. */
export async function ctaHref(link: LinkLike, where: string) {
  const { slugs } = await getNavigation();
  return resolveHref(link, slugs, where);
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);
