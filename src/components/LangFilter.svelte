<script lang="ts">
  import { onMount } from 'svelte';

  type Filter = 'all' | 'en' | 'pt';
  const filters: Filter[] = ['all', 'en', 'pt'];
  const labels: Record<Filter, string> = { all: 'All', en: '🇺🇸 EN', pt: '🇧🇷 PT' };

  let filter = $state<Filter>('all');

  onMount(() => {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'pt') filter = stored as Filter;
    applyFilter(filter);
  });

  function applyFilter(f: Filter) {
    document.querySelectorAll<HTMLElement>('[data-post-lang]').forEach((el) => {
      el.style.display = f === 'all' || el.dataset.postLang === f ? '' : 'none';
    });
  }

  function setFilter(f: Filter) {
    filter = f;
    if (f !== 'all') localStorage.setItem('lang', f);
    applyFilter(f);
  }
</script>

<div class="lang-filter" role="group" aria-label="Filter posts by language">
  {#each filters as f (f)}
    <button
      class="lang-filter-btn"
      aria-pressed={filter === f}
      onclick={() => setFilter(f)}
    >{labels[f]}</button>
  {/each}
</div>

<style>
  .lang-filter {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .lang-filter-btn {
    padding: 0.3rem 0.8rem;
    font-size: 0.82rem;
    margin-bottom: 0;
    border-radius: var(--pico-border-radius, 0.375rem);
    border: 1px solid var(--pico-primary);
    background: transparent;
    color: var(--pico-primary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .lang-filter-btn[aria-pressed="true"] {
    background: var(--pico-primary);
    color: var(--pico-primary-inverse);
  }
</style>
