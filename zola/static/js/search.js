/* Pagefind is generated locally after the Zola build; no hosted search service. */
(() => {
  const container = document.querySelector("#search");
  const status = document.querySelector("#search-status");
  if (!container || !status) return;
  const portuguese = container.dataset.language === "pt";
  try {
    if (typeof window.PagefindUI !== "function") {
      throw new Error("The local search bundle was not generated");
    }
    const search = new window.PagefindUI({
      element: "#search",
      bundlePath: container.dataset.bundlePath,
      showSubResults: true,
      showImages: false,
      translations: portuguese
        ? {
            placeholder: "Buscar publicações…",
            clear_search: "Limpar",
            load_more: "Carregar mais resultados",
            search_label: "Buscar neste site",
            zero_results: "Nenhum resultado para [SEARCH_TERM]",
            one_result: "[COUNT] resultado para [SEARCH_TERM]",
            many_results: "[COUNT] resultados para [SEARCH_TERM]",
            searching: "Buscando [SEARCH_TERM]…",
          }
        : {},
    });
    // Keep searches reproducible when reloading, sharing, changing language or
    // returning from a result. Replace rather than adding a history entry per key.
    function syncQuery(query) {
      const url = new URL(location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      history.replaceState(history.state, "", url);
      for (const link of document.querySelectorAll(".language-link")) {
        const translated = new URL(link.href);
        if (query) translated.searchParams.set("q", query);
        else translated.searchParams.delete("q");
        link.href = translated.href;
      }
    }
    container.addEventListener("input", (event) => {
      if (event.target.matches(".pagefind-ui__search-input"))
        syncQuery(event.target.value);
    });
    container.addEventListener("click", (event) => {
      if (event.target.closest(".pagefind-ui__search-clear")) syncQuery("");
    });
    const query = new URLSearchParams(location.search).get("q");
    if (query) {
      search.triggerSearch(query);
      syncQuery(query);
    }
  } catch (error) {
    status.textContent = portuguese
      ? "A busca está indisponível. Use o arquivo para encontrar as publicações."
      : "Search is unavailable. Use the archive to find posts.";
    const archive = document.createElement("a");
    archive.href = portuguese ? "/pt/archive/" : "/archive/";
    archive.textContent = portuguese ? " Abrir arquivo →" : " Open archive →";
    status.append(archive);
    console.error("Local search could not be initialized:", error);
  }
})();
