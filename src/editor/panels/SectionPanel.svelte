<script lang="ts">
  import { ed } from '../state.svelte';
  import FieldForm from '../fields/FieldForm.svelte';
  import { sectionDef } from '../paths';

  let { index }: { index: number } = $props();
  const section = $derived(ed.sections()?.[index]);
  const def = $derived(section ? sectionDef(section.type) : undefined);
  const count = $derived(ed.sections()?.length ?? 0);
</script>

{#if section && def}
  <div class="e-panel-head">
    <button type="button" class="e-back" onclick={() => (ed.panel = { kind: 'tabs' })}>← Kembali</button>
    <h2>{def.label}</h2>
  </div>
  <div class="e-row e-actions">
    <button type="button" class="e-btn" disabled={index === 0} onclick={() => ed.moveSection(index, index - 1)}>↑ Naik</button>
    <button type="button" class="e-btn" disabled={index === count - 1} onclick={() => ed.moveSection(index, index + 1)}>↓ Turun</button>
    <button type="button" class="e-btn" onclick={() => ed.duplicateSection(index)}>Duplikat</button>
    <button type="button" class="e-btn e-danger" onclick={() => ed.deleteSection(index)}>Hapus</button>
  </div>
  <p class="e-hint">Teks bisa diubah langsung dengan klik di halaman. Gambar, gaya, tombol, dan daftar item diatur di sini.</p>
  <div class="e-form">
    <FieldForm fields={def.fields} value={section} path={`s${index}`} />
  </div>
{/if}
