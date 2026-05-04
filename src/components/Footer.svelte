<script>
  import AgentStatus from './AgentStatus.svelte';
  const year = new Date().getFullYear();
</script>

<footer class="container">
  <hr />
  <nav>
    <ul>
      <li><small>© {year} Franklin Baldo</small></li>
    </ul>
    <ul>
      <li><a href="#" class="secondary">🤖 System</a></li>
      <li><AgentStatus /></li>
    </ul>
  </nav>
</footer>

<style>
  footer {
    padding-top: var(--pico-spacing);
    padding-bottom: var(--pico-spacing);
    margin-top: 4rem;
  }
</style>
