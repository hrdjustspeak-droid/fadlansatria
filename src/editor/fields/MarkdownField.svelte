<script lang="ts">
  // Textarea markdown dengan toolbar kecil; editor non-tech cukup menekan tombol.
  interface Props {
    id: string;
    value: string;
    onchange: (v: string) => void;
  }
  let { id, value, onchange }: Props = $props();
  let ta: HTMLTextAreaElement;

  function wrap(before: string, after = before, placeholder = 'teks') {
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onchange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function line(prefix: string) {
    const s = ta.selectionStart;
    const start = value.lastIndexOf('\n', s - 1) + 1;
    onchange(value.slice(0, start) + prefix + value.slice(start));
    requestAnimationFrame(() => ta.focus());
  }
  function link() {
    const url = prompt('Alamat link (https://… atau /halaman):');
    if (url) wrap('[', `](${url})`, 'teks link');
  }
</script>

<div class="e-md">
  <div class="e-md-bar" role="toolbar" aria-label="Format teks">
    <button type="button" title="Tebal" onclick={() => wrap('**')}><b>B</b></button>
    <button type="button" title="Miring" onclick={() => wrap('*')}><i>I</i></button>
    <button type="button" title="Sub-judul" onclick={() => line('## ')}>H2</button>
    <button type="button" title="Sub-sub-judul" onclick={() => line('### ')}>H3</button>
    <button type="button" title="Daftar" onclick={() => line('- ')}>• Daftar</button>
    <button type="button" title="Kutipan" onclick={() => line('> ')}>❝</button>
    <button type="button" title="Link" onclick={link}>Link</button>
  </div>
  <textarea {id} bind:this={ta} class="e-input" rows="8" {value} oninput={(e) => onchange(e.currentTarget.value)}></textarea>
</div>
