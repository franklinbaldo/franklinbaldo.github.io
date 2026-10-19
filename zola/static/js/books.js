// A single listener survives native navigation; each live shelf is bound once.
(() => {
  const key = Symbol.for("zola.books.initialize");
  if (window[key]) {
    window[key]();
    return;
  }
  const initialized = new WeakSet();
  function initialize() {
    const root = document.getElementById("books-page");
    const grid = root?.querySelector("#books-grid");
    const sortSelect = root?.querySelector("#sort-select");
    if (!grid || !sortSelect || initialized.has(root)) return;
    initialized.add(root);
    const pills = [...root.querySelectorAll(".pill[data-filter]")];
    const count = root.querySelector("#visible-count");
    const status = root.querySelector("#books-filter-status");
    const empty = root.querySelector("#books-empty-filter");
    const cards = [...grid.querySelectorAll(".book-card")];
    const collator = new Intl.Collator(root.dataset.lang || "en");
    let filter = "liked";
    const numeric = (value) => Number(value) || 0;
    const readDate = (value) =>
      Date.parse((value || "").replace(/\//g, "-")) || 0;

    function applyFilterAndSort() {
      const titleOrder = (a, b) =>
        collator.compare(a.dataset.title || "", b.dataset.title || "");
      cards.sort((a, b) => {
        let order = 0;
        switch (sortSelect.value) {
          case "date-desc":
            order = readDate(b.dataset.date) - readDate(a.dataset.date);
            break;
          case "year-desc":
            order = numeric(b.dataset.year) - numeric(a.dataset.year);
            break;
          case "title-asc":
            return titleOrder(a, b);
          default:
            order = numeric(b.dataset.rating) - numeric(a.dataset.rating);
        }
        return order || titleOrder(a, b);
      });
      let visible = 0;
      for (const card of cards) {
        const show = filter === "all" || numeric(card.dataset.rating) >= 4;
        card.hidden = !show;
        card.setAttribute("aria-hidden", String(!show));
        if (show) visible++;
        grid.appendChild(card);
      }
      if (count) count.textContent = String(visible);
      if (status)
        status.textContent =
          `${visible} ${status.dataset.countSuffix || ""}`.trim();
      if (empty) empty.hidden = visible > 0;
    }

    for (const pill of pills)
      pill.addEventListener("click", () => {
        filter = pill.dataset.filter === "all" ? "all" : "liked";
        for (const option of pills) {
          const active = option === pill;
          option.classList.toggle("active", active);
          option.setAttribute("aria-pressed", String(active));
        }
        applyFilterAndSort();
      });
    sortSelect.addEventListener("change", applyFilterAndSort);
    applyFilterAndSort();
  }
  window[key] = initialize;
  document.addEventListener("zola:page-load", initialize);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
