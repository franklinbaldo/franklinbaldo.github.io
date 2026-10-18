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
    new window.PagefindUI({
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
