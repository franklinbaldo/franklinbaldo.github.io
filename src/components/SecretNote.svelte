<script>
  import { slide } from 'svelte/transition';
  export let text = "This is a secret note from the adyton.";
  let revealed = false;
</script>

<div class="secret-note-container">
  <button 
    class="btn-emoji" 
    on:click={() => revealed = !revealed}
    aria-expanded={revealed}
    title="Reveal hidden note"
  >
    👁️
  </button>
  
  {#if revealed}
    <div transition:slide={{ duration: 500 }} class="note-content">
      <small><em>{text}</em></small>
    </div>
  {/if}
</div>

<style>
  .secret-note-container {
    margin: 1rem 0;
    padding: 0.5rem;
    border: 1px solid var(--pico-border-color);
    border-radius: var(--pico-border-radius);
    display: inline-block;
    max-width: 100%;
  }

  .note-content {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--pico-border-color);
    color: var(--pico-primary);
  }
</style>
