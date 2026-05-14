<script>
  import { onMount } from 'svelte';

  let userLang = $state('en');
  let mounted = $state(false);

  onMount(() => {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'pt') {
      userLang = stored;
    } else {
      userLang = navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
      localStorage.setItem('lang', userLang);
    }
    mounted = true;

    // Auto-redirect: if page lang differs from stored preference and a translation exists
    const pageLang = document.documentElement.lang;
    const translationHref = (window).__translationHref;
    if (pageLang && translationHref && pageLang !== userLang) {
      // Only redirect if user hasn't explicitly visited this page (check sessionStorage)
      const key = `visited:${window.location.pathname}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.href = translationHref;
      }
    }
  });

  function switchLang() {
    const target = userLang === 'en' ? 'pt' : 'en';
    localStorage.setItem('lang', target);
    userLang = target;

    const translationHref = (window).__translationHref;
    if (translationHref) {
      window.location.href = translationHref;
    }
  }

  const label = $derived(userLang === 'en' ? '🇧🇷 PT' : '🇺🇸 EN');
  const title = $derived(userLang === 'en' ? 'Ler em Português' : 'Read in English');
  const hasTranslation = $derived(mounted && !!(window).__translationHref);
</script>

{#if mounted}
  <button
    class="btn-emoji lang-btn"
    onclick={switchLang}
    aria-label={title}
    {title}
    style={hasTranslation ? '' : 'opacity: 0.4; cursor: default;'}
  >
    {label}
  </button>
{:else}
  <span class="btn-emoji lang-btn" aria-hidden="true" style="opacity:0.3">🌐</span>
{/if}

<style>
  .lang-btn {
    font-size: 0.85rem;
    letter-spacing: 0.02em;
  }
</style>
