<script>
  import { onMount } from 'svelte';

  let theme = 'light';

  onMount(() => {
    theme = document.documentElement.getAttribute('data-theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
  }

  function applyTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }
</script>

<button 
  class="btn-emoji" 
  on:click={toggleTheme} 
  aria-label="Toggle theme"
  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
>
  {theme === 'light' ? '🌑' : '☀️'}
</button>
