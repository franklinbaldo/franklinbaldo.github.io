// Optional enhancements; all records and navigation are usable without JS.
(() => {
  const table = document.getElementById("rank-table");
  const toggle = document.getElementById("view-toggle");
  if (table && toggle) {
    toggle.hidden = false;
    const setTechnical = (technical) => {
      table.classList.toggle("rank-standard-view", !technical);
      toggle.setAttribute("aria-pressed", String(!technical));
      toggle.textContent = technical
        ? toggle.dataset.standardLabel
        : toggle.dataset.technicalLabel;
    };
    // Preserve the original technical default and shareable ?view=standard.
    let technical =
      new URLSearchParams(location.search).get("view") !== "standard";
    setTechnical(technical);
    toggle.addEventListener("click", () => {
      technical = !technical;
      setTechnical(technical);
      const params = new URLSearchParams(location.search);
      if (technical) params.delete("view");
      else params.set("view", "standard");
      history.replaceState(
        null,
        "",
        `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`
      );
    });
    const body = table.tBodies[0];
    const original = [...body.rows];
    const positions = new Map(original.map((row, i) => [row, i]));
    for (const button of table.querySelectorAll("button[data-sort]")) {
      button.addEventListener("click", () => {
        const heading = button.closest("th");
        const ascending = heading.getAttribute("aria-sort") === "descending";
        table
          .querySelectorAll("th[aria-sort]")
          .forEach((th) => th.setAttribute("aria-sort", "none"));
        heading.setAttribute(
          "aria-sort",
          ascending ? "ascending" : "descending"
        );
        const attribute = `data-sort-${button.dataset.sort}`;
        const rows = [...body.rows].sort((a, b) => {
          const diff =
            Number(a.getAttribute(attribute)) -
            Number(b.getAttribute(attribute));
          return (
            (ascending ? diff : -diff) || positions.get(a) - positions.get(b)
          );
        });
        body.append(...rows);
      });
    }
  }
  const filters = document.getElementById("battle-filters");
  if (!filters) return;
  const input = document.getElementById("battle-search");
  const cards = [...document.querySelectorAll("#battle-list .battle-card")];
  const selects = [...filters.querySelectorAll("[data-filter]")];
  const count = document.getElementById("filter-count-label");
  const empty = document.getElementById("battle-empty");
  const params = new URLSearchParams(location.search);
  input.value = params.get("q") ?? "";
  for (const select of selects) {
    const value = params.get(select.dataset.filter);
    if (
      value &&
      ![...select.options].some((option) => option.value === value)
    ) {
      // Carry filters across pagination even if no item on this page has it.
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
    if (value) select.value = value;
  }
  function apply() {
    const query = input.value.trim().toLocaleLowerCase();
    const active = selects.map((select) => [
      select.dataset.filter,
      select.value,
    ]);
    let visible = 0;
    for (const card of cards) {
      const match =
        (!query || (card.dataset.search ?? "").includes(query)) &&
        active.every(
          ([field, value]) => value === "all" || card.dataset[field] === value
        );
      card.hidden = !match;
      if (match) visible++;
    }
    count.textContent = `Showing ${visible} of ${cards.length} on this page`;
    empty.hidden = visible > 0;
    const next = new URLSearchParams();
    if (query) next.set("q", input.value.trim());
    for (const [field, value] of active)
      if (value !== "all") next.set(field, value);
    const suffix = next.size ? `?${next}` : "";
    history.replaceState(
      null,
      "",
      `${location.pathname}${suffix}${location.hash}`
    );
    document.querySelectorAll(".archive-page-link").forEach((link) => {
      link.href = new URL(link.href).pathname + suffix;
    });
  }
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 180);
  });
  selects.forEach((select) => select.addEventListener("change", apply));
  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(timer);
    apply();
  });
  apply();
})();
