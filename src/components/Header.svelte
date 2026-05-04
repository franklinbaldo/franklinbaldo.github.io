<script>
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="container">
  <nav>
    <ul>
      <li><strong>Franklin Baldo</strong></li>
    </ul>
    <ul>
      <li><a href="/" class="secondary">🏠 Home</a></li>
      <li><a href="/about" class="secondary">📚 About</a></li>
      <li><ThemeToggle /></li>
    </ul>
  </nav>
</header>

<style>
  header {
    padding-top: var(--pico-spacing);
    padding-bottom: var(--pico-spacing);
  }
</style>
