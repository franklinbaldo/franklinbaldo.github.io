(() => {
  const root = document.querySelector("[data-archive]");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";
  const filter = root.querySelector("[data-archive-filter]");
  const items = [...root.querySelectorAll("[data-archive-type]")];
  function render() {
    let count = 0;
    for (const item of items) {
      item.hidden = !!filter.value && item.dataset.archiveType !== filter.value;
      if (!item.hidden) count++;
    }
    root.querySelector("[data-archive-status]").textContent =
      `${count} ${document.documentElement.lang.startsWith("pt") ? "publicações nesta página" : "posts on this page"}`;
  }
  filter.addEventListener("change", render);
  render();
})();
