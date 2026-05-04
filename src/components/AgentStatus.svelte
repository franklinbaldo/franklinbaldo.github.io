<script>
  let active = true;
</script>

<div class="agent-status" aria-live="polite">
  {#if active}
    <small>
      <span class="indicator"></span>
      System Active
    </small>
  {/if}
</div>

<style>
  .agent-status {
    display: inline-flex;
    align-items: center;
    color: var(--pico-muted-color);
  }
  
  .indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #10b981; /* green */
    margin-right: 0.5rem;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
