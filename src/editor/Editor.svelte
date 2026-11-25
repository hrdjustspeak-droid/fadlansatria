<script lang="ts">
  import { onMount } from 'svelte';
  import { ed, type PageRef, type Tab } from './state.svelte';
  import { githubStorage, loginWithNetlify, savedToken, tryLocal } from './storage';
  import { labelFor, fileFields, folderFields, sectionDef } from './paths';
  import Canvas from './Canvas.svelte';
  import InsertPanel from './panels/InsertPanel.svelte';
  import PagesPanel from './panels/PagesPanel.svelte';
  import ThemePanel from './panels/ThemePanel.svelte';
  import SectionPanel from './panels/SectionPanel.svelte';
  import PagePanel from './panels/PagePanel.svelte';
  import FieldForm from './fields/FieldForm.svelte';

  let { repo, branch }: { repo: string; branch: string } = $props();
  let loginError = $state('');

  onMount(async () => {
    const local = await tryLocal();
    if (local) return ed.start(local);
    const token = savedToken();
    if (token) return ed.start(githubStorage(token, repo, branch));
    ed.status = 'login';
  });

  async function login() {
    loginError = '';
    try {
      const token = await loginWithNetlify();
      await ed.start(githubStorage(token, repo, branch));
    } catch (e) {
      loginError = (e as Error).message;
    }
  }

  function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? ed.redo() : ed.undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      ed.redo();
    }
  }

  const TABS: [Tab, string][] = [
    ['insert', 'Sisipkan'],
    ['pages', 'Halaman'],
    ['theme', 'Tema'],
    ['site', 'Situs'],
  ];

  const pageOptions = $derived.by(() => {
    const c = ed.content;
    if (!c) return [] as [string, string][];
    const base: PageRef[] = [{ kind: 'home' }, { kind: 'about' }, { kind: 'projects' }];
    const all = [...base, ...Object.keys(c.customPages).map((id) => ({ kind: 'custom', id }) as PageRef), ...Object.keys(c.projects).map((id) => ({ kind: 'project', id }) as PageRef)];
    return all.map((p) => [ed.pageKey(p), `${p.kind === 'project' ? 'Proyek: ' : ''}${ed.pageTitle(p)}`] as [string, string]);
  });
  function selectPage(key: string) {
    const [kind, id] = key.split(':');
    ed.openPage((id ? { kind, id } : { kind }) as PageRef);
  }

  const DOC_LABEL: Record<string, string> = { site: 'Pengaturan situs', theme: 'Tema', navigation: 'Menu navigasi', home: 'Beranda', about: 'About' };
  function problemLabel(doc: string, path: string) {
    const c = ed.content!;
    const [kind, id] = doc.split(':');
    const where = DOC_LABEL[doc] ?? (kind === 'custom' ? `Halaman ${c.customPages[id]?.title ?? id}` : `Proyek ${c.projects[id]?.data?.title ?? id}`);
    const sec = path.match(/^sections\.(\d+)\.?(.*)$/);
    if (sec) {
      const s = (kind === 'custom' ? c.customPages[id] : (c as any)[doc])?.sections?.[Number(sec[1])];
      const def = sectionDef(s?.type);
      return `${where} › ${def?.label ?? 'Section'}${sec[2] ? ` › ${labelFor(def?.fields ?? [], sec[2])}` : ''}`;
    }
    const fields =
      doc === 'site' ? fileFields('settings', 'site') : doc === 'navigation' ? fileFields('settings', 'navigation') : doc === 'about' ? fileFields('pages', 'about') : kind === 'custom' ? folderFields('custom_pages') : kind === 'project' ? folderFields('projects') : [];
    return path ? `${where} › ${labelFor(fields, path)}` : where;
  }
  function goTo(doc: string, path: string) {
    const [kind, id] = doc.split(':');
    ed.publishOpen = false;
    if (doc === 'site') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'site'));
    if (doc === 'navigation') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'pages'));
    if (doc === 'theme') return ((ed.panel = { kind: 'tabs' }), (ed.tab = 'theme'));
    ed.openPage((id ? { kind, id } : { kind }) as PageRef);
    const sec = path.match(/^sections\.(\d+)/);
    ed.panel = sec ? { kind: 'section', index: Number(sec[1]) } : kind === 'home' ? { kind: 'tabs' } : { kind: 'page' };
    ed.sidebarOpen = true;
  }
  const changeNames = $derived([...new Set(Object.keys(ed.changes).map((p) => ed.describe(p)))]);
</script>

<svelte:window onkeydown={onKey} />

{#if ed.status === 'loading'}
  <div class="e-center"><div class="e-spin"></div><p>Memuat konten…</p></div>
{:else if ed.status === 'login'}
  <div class="e-center e-login">
    <h1>Editor situs</h1>
    <p>Masuk dengan akun GitHub yang sudah diundang ke repo situs ini.</p>
    <button type="button" class="e-btn e-primary e-big" onclick={login}>Masuk dengan GitHub</button>
    {#if loginError}<p class="e-error">{loginError}</p>{/if}
  </div>
{:else if ed.status === 'error'}
  <div class="e-center"><h1>Editor tidak bisa dibuka</h1><p class="e-error">{ed.error}</p><button class="e-btn" onclick={() => location.reload()}>Coba lagi</button></div>
{:else if ed.content}
  <div class="e-app" class:closed={!ed.sidebarOpen}>
    <header class="e-top">
      <strong class="e-brand">Editor</strong>
      <label class="e-sr" for="page-select">Halaman yang diedit</label>
      <select id="page-select" class="e-input e-page-select" value={ed.pageKey()} onchange={(e) => selectPage(e.currentTarget.value)}>
        {#each pageOptions as [k, l]}<option value={k}>{l}</option>{/each}
      </select>
      {#if ed.page.kind !== 'home' && ed.page.kind !== 'projects'}
        <button type="button" class="e-btn e-ghost" onclick={() => ((ed.panel = { kind: 'page' }), (ed.sidebarOpen = true))}>Pengaturan halaman</button>
      {/if}
      <div class="e-spacer"></div>
      <div class="e-row e-tools">
        <button type="button" class="e-btn" title="Urungkan (Ctrl+Z)" disabled={!ed.canUndo} onclick={() => ed.undo()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
          <span class="e-lbl">Urungkan</span>
        </button>
        <button type="button" class="e-btn" title="Ulangi (Ctrl+Shift+Z)" disabled={!ed.canRedo} onclick={() => ed.redo()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>
          <span class="e-lbl">Ulangi</span>
        </button>
        <div class="e-devices" role="radiogroup" aria-label="Pratinjau perangkat">
          {#each [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['mobile', 'HP']] as [d, l]}
            <button type="button" role="radio" aria-checked={ed.device === d} class:on={ed.device === d} onclick={() => (ed.device = d as typeof ed.device)}>{l}</button>
          {/each}
        </div>
      </div>
      <span class="e-status" aria-live="polite">{ed.dirty ? `${ed.dirty} perubahan belum dipublikasikan` : 'Semua perubahan sudah dipublikasikan'}</span>
      <a class="e-btn e-ghost" href={ed.pageUrl()} target="_blank" rel="noopener">Lihat situs ↗</a>
      <button type="button" class="e-btn e-danger" title="Kembalikan semua ke versi terakhir yang disimpan (bisa diurungkan)" disabled={!ed.dirty} onclick={() => ed.discard()}>Buang perubahan</button>
      <button type="button" class="e-btn e-primary" disabled={!ed.dirty} onclick={() => ed.openPublish()}>{ed.storage?.kind === 'local' ? 'Simpan ke file' : 'Publikasikan'}</button>
      <button type="button" class="e-btn e-ghost e-toggle" aria-expanded={ed.sidebarOpen} onclick={() => (ed.sidebarOpen = !ed.sidebarOpen)}>{ed.sidebarOpen ? 'Tutup panel' : 'Panel'}</button>
    </header>

    <main class="e-main"><Canvas /></main>

    <aside class="e-side" aria-label="Panel editor">
      {#if ed.panel.kind === 'section'}
        <SectionPanel index={ed.panel.index} />
      {:else if ed.panel.kind === 'page'}
        <PagePanel />
      {:else}
        <div class="e-tabs" role="tablist">
          {#each TABS as [t, l]}
            <button type="button" role="tab" aria-selected={ed.tab === t} class:on={ed.tab === t} onclick={() => (ed.tab = t)}>{l}</button>
          {/each}
        </div>
        <div class="e-tabpanel" role="tabpanel">
          {#if ed.tab === 'insert'}<InsertPanel />
          {:else if ed.tab === 'pages'}<PagesPanel />
          {:else if ed.tab === 'theme'}<ThemePanel />
          {:else}
            <section class="e-sec">
              <h3>Identitas & kontak</h3>
              <FieldForm fields={fileFields('settings', 'site')} value={ed.content.site} path="site" />
            </section>
          {/if}
        </div>
      {/if}
    </aside>
  </div>

  {#if ed.publishOpen}
    <div class="e-modal-bg" role="presentation" onclick={(e) => e.target === e.currentTarget && (ed.publishOpen = false)}>
      <div class="e-modal" role="dialog" aria-modal="true" aria-labelledby="pub-title">
        <h2 id="pub-title">{ed.storage?.kind === 'local' ? 'Simpan perubahan ke file' : 'Publikasikan perubahan'}</h2>
        {#if ed.problems.length}
          <p>Perbaiki dulu {ed.problems.length} hal berikut sebelum {ed.storage?.kind === 'local' ? 'menyimpan' : 'mempublikasikan'}:</p>
          <ul class="e-problems">
            {#each ed.problems as p}
              <li><button type="button" onclick={() => goTo(p.doc, p.path)}><strong>{problemLabel(p.doc, p.path)}</strong><span>{p.message}</span></button></li>
            {/each}
          </ul>
        {:else}
          <p>Yang akan {ed.storage?.kind === 'local' ? 'disimpan' : 'dipublikasikan'}:</p>
          <ul class="e-changes">
            {#each changeNames as n}<li>{n}</li>{/each}
          </ul>
          {#if ed.storage?.kind === 'github'}<p class="e-hint">Situs diperbarui otomatis dalam 1–3 menit setelah dipublikasikan.</p>{/if}
        {/if}
        <div class="e-row e-modal-actions">
          <button type="button" class="e-btn e-ghost" onclick={() => (ed.publishOpen = false)}>Batal</button>
          <button type="button" class="e-btn e-primary" disabled={!!ed.problems.length || !!ed.busy} onclick={() => ed.publish()}>{ed.busy || (ed.storage?.kind === 'local' ? 'Simpan' : 'Publikasikan')}</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

{#if ed.toast}<div class="e-toast" role="status">{ed.toast}</div>{/if}
{#if ed.busy && !ed.publishOpen}<div class="e-toast">{ed.busy}</div>{/if}
