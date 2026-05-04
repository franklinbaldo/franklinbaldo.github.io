<script>
  import { onMount } from 'svelte';

  let theme = $state('light');
  let userOverride = $state(false);

  onMount(() => {
    const stored = localStorage.getItem('theme');
    userOverride = stored !== null;
    theme = stored
      ?? document.documentElement.dataset.theme
      ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const media = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (userOverride) return;
      theme = e.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  });

  function toggle() {
    theme = theme === 'light' ? 'dark' : 'light';
    userOverride = true;
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
