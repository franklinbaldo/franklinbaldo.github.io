<script>
  import { onMount } from 'svelte';

  let theme = $state('light');

  onMount(() => {
    theme = document.documentElement.dataset.theme
      ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  function toggle() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }
</script>

<button
  class="btn-emoji"
  onclick={toggle}
  aria-label="Toggle theme"
  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
>
  {theme === 'light' ? '🌑' : '☀️'}
</button>
