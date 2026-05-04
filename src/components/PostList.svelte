<script>
  import PostCard from './PostCard.svelte';
  export let posts = [];
</script>

<section id="essays">
  <h2>Essays</h2>
  {#each posts as post}
    <PostCard {post} />
  {/each}
</section>
