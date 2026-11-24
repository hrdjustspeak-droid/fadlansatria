<script lang="ts">
  // Form generik dari definisi field cms-fields.mjs. Mengubah `value` (proxy state) lewat ed.mutate.
  import FieldForm from './FieldForm.svelte';
  import LinkField from './LinkField.svelte';
  import MediaField from './MediaField.svelte';
  import ListField from './ListField.svelte';
  import MarkdownField from './MarkdownField.svelte';
  import TagsField from './TagsField.svelte';
  import { ed } from '../state.svelte';
  import type { Field } from '../paths';

  interface Props {
    fields: Field[];
    value: Record<string, any>;
    /** kunci unik untuk grup undo & id input */
    path: string;
    skip?: string[];
  }
  let { fields, value, path, skip = [] }: Props = $props();

  const LINK = ['linkType', 'builtinPage', 'customPage', 'url'];
  const hasLink = $derived(fields.some((f) => f.name === 'linkType'));
  const visible = $derived(fields.filter((f) => !skip.includes(f.name) && f.widget !== 'hidden' && !(hasLink && (LINK.includes(f.name) || f.name === 'label')) && !f.types));

  const id = (f: Field) => `f-${path}-${f.name}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const set = (f: Field, v: unknown) => ed.mutate(() => (value[f.name] = v), { group: `${path}.${f.name}` });

  function patternError(f: Field) {
    const v = value[f.name];
    if (!f.pattern || typeof v !== 'string' || !v) return '';
    try {
      return new RegExp(f.pattern[0]).test(v) ? '' : f.pattern[1];
    } catch {
      return '';
    }
  }
  const len = (f: Field) => String(value[f.name] ?? '').length;
</script>

{#if hasLink}
  <LinkField
    {value}
    {path}
    withLabel={fields.some((f) => f.name === 'label')}
    labelDef={fields.find((f) => f.name === 'label')}
    optional={fields.find((f) => f.name === 'label')?.required === false && !fields.some((f) => f.name === 'enabled')}
  />
{/if}

{#each visible as f (f.name)}
  <div class="e-field" data-field={f.name}>
    {#if f.widget === 'boolean'}
      <label class="e-switch">
        <input type="checkbox" checked={!!value[f.name]} onchange={(e) => set(f, e.currentTarget.checked)} />
        <span>{f.label}</span>
      </label>
      {#if f.hint}<p class="e-hint">{f.hint}</p>{/if}
    {:else if f.widget === 'object'}
      <fieldset class="e-group">
        <legend>{f.label}</legend>
        {#if f.hint}<p class="e-hint">{f.hint}</p>{/if}
        {#if value[f.name] && typeof value[f.name] === 'object'}
          <FieldForm fields={f.fields ?? []} value={value[f.name]} path={`${path}.${f.name}`} />
        {:else}
          <button type="button" class="e-btn" onclick={() => set(f, {})}>Isi {f.label.toLowerCase()}</button>
        {/if}
      </fieldset>
    {:else if f.widget === 'list' && f.fields}
      <ListField def={f} {value} {path} />
    {:else if f.widget === 'list' && f.field}
      <TagsField def={f} {value} {path} />
    {:else}
      <label class="e-label" for={id(f)}>
        {f.label}{#if f.required !== false && f.widget !== 'select'}<span class="e-req" aria-hidden="true"> *</span>{/if}
        {#if f.maxlength}<span class="e-count" class:over={len(f) > f.maxlength}>{len(f)}/{f.maxlength}</span>{/if}
      </label>
      {#if f.widget === 'string'}
        <input id={id(f)} class="e-input" type={f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'} value={value[f.name] ?? ''} maxlength={f.maxlength} oninput={(e) => set(f, e.currentTarget.value)} />
      {:else if f.widget === 'text'}
        <textarea id={id(f)} class="e-input" rows="3" maxlength={f.maxlength} value={value[f.name] ?? ''} oninput={(e) => set(f, e.currentTarget.value)}></textarea>
      {:else if f.widget === 'markdown'}
        <MarkdownField id={id(f)} value={value[f.name] ?? ''} onchange={(v) => set(f, v)} />
      {:else if f.widget === 'number'}
        <input id={id(f)} class="e-input" type="number" min={f.min} max={f.max} value={value[f.name] ?? ''} oninput={(e) => set(f, e.currentTarget.value === '' ? undefined : Number(e.currentTarget.value))} />
      {:else if f.widget === 'select' && f.name === 'variant'}
        <div class="e-variants" role="radiogroup" aria-label={f.label}>
          {#each f.options ?? [] as o}
            <button type="button" role="radio" aria-checked={value[f.name] === o.value} class:on={value[f.name] === o.value} onclick={() => set(f, o.value)}>
              {o.label}
            </button>
          {/each}
        </div>
      {:else if f.widget === 'select'}
        <select id={id(f)} class="e-input" value={value[f.name] ?? ''} onchange={(e) => set(f, e.currentTarget.value)}>
          {#if f.required === false}<option value="">(default)</option>{/if}
          {#each f.options ?? [] as o}<option value={o.value}>{o.label}</option>{/each}
        </select>
      {:else if f.widget === 'image' || f.widget === 'file'}
        <MediaField def={f} id={id(f)} value={value[f.name] ?? ''} onchange={(v) => set(f, v)} />
      {:else if f.widget === 'color'}
        <div class="e-color">
          <input type="color" aria-label={f.label} value={value[f.name] || '#888888'} oninput={(e) => set(f, e.currentTarget.value.toUpperCase())} />
          <input id={id(f)} class="e-input" placeholder="kosong = warna preset" value={value[f.name] ?? ''} oninput={(e) => set(f, e.currentTarget.value)} />
          {#if value[f.name]}<button type="button" class="e-btn e-ghost" onclick={() => set(f, '')}>Reset</button>{/if}
        </div>
      {/if}
      {#if patternError(f)}<p class="e-error">{patternError(f)}</p>{/if}
      {#if f.hint && f.widget !== 'select'}<p class="e-hint">{f.hint}</p>{/if}
      {#if f.hint && f.widget === 'select' && f.name !== 'variant'}<p class="e-hint">{f.hint}</p>{/if}
    {/if}
  </div>
{/each}
