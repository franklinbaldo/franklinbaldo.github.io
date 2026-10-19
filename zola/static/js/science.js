// Progressive enhancement: all cards, evidence, and links work without JS.
(() => {
  // Native navigation replays route scripts. Install lifecycle listeners once
  // while enhancing each newly swapped board independently.
  if (document.documentElement.dataset.scienceRuntime) return;
  document.documentElement.dataset.scienceRuntime = "ready";
  let hashHandlers = [];
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  function initializeBoards() {
    for (const board of document.querySelectorAll("[data-science-board]")) {
      if (board.dataset.scienceReady) continue;
      const controls = board.querySelector(".science-controls");
      if (!controls) continue;
      board.dataset.scienceReady = "true";
      const cards = [...board.querySelectorAll("[data-science-card]")];
      const search = controls.querySelector("[data-card-search]");
      const tier = controls.querySelector("[data-tier-filter]");
      const interest = controls.querySelector("[data-interest-filter]");
      const count = controls.querySelector("[data-card-count]");
      const expand = controls.querySelector("[data-expand-cards]");
      const pt = board.dataset.lang === "pt";
      const haystack = new Map(
        cards.map((card) => [card, normalize(card.textContent)])
      );
      let expanded = false;
      function filter() {
        const query = normalize(search.value.trim());
        let visible = 0;
        for (const card of cards) {
          const match =
            (!query || haystack.get(card).includes(query)) &&
            (!tier.value || card.dataset.tier === tier.value) &&
            (!interest.value || card.dataset.interest === interest.value);
          card.hidden = !match;
          if (match) visible++;
        }
        for (const group of board.querySelectorAll(
          "[data-tier-row], [data-card-group]"
        )) {
          const children = [...group.querySelectorAll("[data-science-card]")];
          group.hidden =
            query || tier.value || interest.value
              ? !children.some((card) => !card.hidden)
              : false;
        }
        count.textContent = pt
          ? `${visible} de ${cards.length} fichas`
          : `${visible} of ${cards.length} cards`;
      }
      search.addEventListener("input", filter);
      tier.addEventListener("change", filter);
      interest.addEventListener("change", filter);
      controls
        .querySelector("[data-reset-cards]")
        .addEventListener("click", () => {
          search.value = tier.value = interest.value = "";
          filter();
          search.focus();
        });
      expand.addEventListener("click", () => {
        expanded = !expanded;
        for (const card of cards.filter((item) => !item.hidden))
          for (const details of card.querySelectorAll(
            "details.science-evidence"
          ))
            details.open = expanded;
        expand.textContent = pt
          ? expanded
            ? "Fechar fichas"
            : "Abrir fichas"
          : expanded
            ? "Collapse cards"
            : "Expand cards";
        expand.setAttribute("aria-expanded", String(expanded));
      });
      controls.hidden = false;
      expand.setAttribute("aria-expanded", "false");
      filter();
      // Direct links to a filtered card must still expose their target.
      function revealHash() {
        let id;
        try {
          id = decodeURIComponent(location.hash.slice(1));
        } catch {
          return;
        }
        const card = cards.find((item) => item.id === id);
        if (card?.hidden) {
          search.value = tier.value = interest.value = "";
          filter();
          card.scrollIntoView({ block: "start" });
        }
      }
      window.addEventListener("hashchange", revealHash);
      hashHandlers.push(revealHash);
      revealHash();
    }
  }
  document.addEventListener("zola:before-swap", () => {
    for (const handler of hashHandlers)
      window.removeEventListener("hashchange", handler);
    hashHandlers = [];
  });
  document.addEventListener("zola:page-load", initializeBoards);
  initializeBoards();
})();
