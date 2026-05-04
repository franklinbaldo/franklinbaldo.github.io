<script>
  export let post;
  
  const emojiMap = {
    "philosophy": "🧠",
    "legal": "⚖️",
    "ai": "🤖",
    "agents": "🤝",
    "process": "🌀",
    "default": "📄"
  };

  function getEmoji(tags = []) {
    if (tags.length === 0) return emojiMap.default;
    const tag = tags[0].toLowerCase();
    return emojiMap[tag] || emojiMap.default;
  }

  const formattedDate = new Date(post.data.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
</script>

<article>
  <header>
    <hgroup style="margin-bottom: 0;">
      <h3 style="margin-bottom: 0.25rem;">
        <span style="margin-right: 0.5rem; filter: grayscale(100%);">{getEmoji(post.data.tags)}</span>
        <a href={`/blog/${post.id}`} class="contrast">{post.data.title}</a>
      </h3>
      <p><small>{formattedDate}</small></p>
    </hgroup>
  </header>
  <p>{post.data.description}</p>
  <footer>
    <a href={`/blog/${post.id}`}>Read essay →</a>
  </footer>
</article>

<style>
  article {
    margin-bottom: 2rem;
  }
</style>
