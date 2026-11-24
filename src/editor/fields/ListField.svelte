<script lang="ts">
  import FieldForm from './FieldForm.svelte';
  import { ed } from '../state.svelte';
  import { defaults, type Field } from '../paths';

  interface Props {
    def: Field;
    value: Record<string, any>;
    path: string;
  }
  let { def, value, path }: Props = $props();
  let open = $state<number | null>(null);

  const items = $derived<any[]>(value[def.name] ?? []);
  const full = $derived(def.max !== undefined && items.length >= def.max);

  function summary(item: any, i: number) {
    const t = (def.summary ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => item?.[k] ?? '').trim();
    return t || `Item ${i + 1}`;
  }
  function add() {
    ed.mutate(() => {
      if (!Array.isArray(value[def.name])) value[def.name] = [];
      value[def.name].push(defaults(def.fields ?? []));
    });
    open = items.length - 1;
  }
  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    ed.mutate(() => {
      const arr = value[def.name];
      [arr[i], arr[j]] = [arr[j], arr[i]];
    });
    if (open === i) open = j;
  }
  function remove(i: number) {
    if (def.min && items.length <= def.min) return ed.say(`Minimal ${def.min} item.`);
    ed.mutate(() => value[def.name].splice(i, 1));
    open = null;
  }
</script>

<div class="e-list">
  <div class="e-list-head">
    <span class="e-label">{def.label}</span>
    {#if def.max}<span class="e-count">{items.length}/{def.max}</span>{/if}
  </div>
  {#if def.hint}<p class="e-hint">{def.hint}</p>{/if}
  <ol class="e-items">
    {#each items as item, i (i)}
      <li class:open={open === i}>
        <div class="e-item-head">
          <button type="button" class="e-item-title" aria-expanded={open === i} onclick={() => (open = open === i ? null : i)}>{summary(item, i)}</button>
          <button type="button" class="e-icon" aria-label="Naikkan" disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
          <button type="button" class="e-icon" aria-label="Turunkan" disabled={i === items.length - 1} onclick={() => move(i, 1)}>↓</button>
          <button type="button" class="e-icon danger" aria-label="Hapus item" onclick={() => remove(i)}>✕</button>
        </div>
        {#if open === i}
          <div class="e-item-body">
            <FieldForm fields={def.fields ?? []} value={item} path={`${path}.${def.name}.${i}`} />
          </div>
        {/if}
      </li>
    {/each}
  </ol>
  <button type="button" class="e-btn e-add" disabled={full} onclick={add}>+ Tambah {def.label.toLowerCase()}</button>
</div>
