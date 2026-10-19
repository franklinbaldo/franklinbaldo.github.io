// A single set of delegated listeners survives native page navigation.
(() => {
  if (window.zolaMusicGallery) {
    window.zolaMusicGallery();
    return;
  }
  const read = (key, fallback = "") => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };
  const ids = (key) => {
    try {
      const value = JSON.parse(read(key, "[]"));
      return Array.isArray(value)
        ? value.filter((id) => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  };
  const cards = () => [...document.querySelectorAll("#songs-grid .song-card")];
  const isPortuguese = () => document.documentElement.lang.startsWith("pt");
  const play = (id, title) =>
    document.dispatchEvent(
      new CustomEvent("gp:play", { detail: { sunoId: id, title } })
    );
  function miniCard(source, history = false) {
    const id = source.dataset.sunoId;
    const item = document.createElement(history ? "div" : "article");
    item.className = history ? "history-item" : "song-card mini-card";
    item.dataset.sunoId = id;
    item.classList.toggle("is-playing", id === read("gmp-suno-id"));
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.musicPlay = id;
    button.dataset.title = source.dataset.title;
    button.setAttribute(
      "aria-label",
      `${isPortuguese() ? "Ouvir" : "Play"} ${source.dataset.title}`
    );
    const img = document.createElement("img");
    img.src = source.dataset.image || "";
    img.alt = source.dataset.title || "";
    img.width = history ? 56 : 80;
    img.height = history ? 56 : 80;
    img.loading = "lazy";
    button.append(img);
    item.append(button);
    if (!history) {
      const title = document.createElement("p");
      title.textContent = source.dataset.title;
      item.append(title);
    } else if (id === read("gmp-suno-id")) {
      const badge = document.createElement("small");
      badge.textContent = isPortuguese() ? "▶ Continuar" : "▶ Continue";
      item.append(badge);
    }
    return item;
  }
  function refresh() {
    const grid = document.getElementById("songs-grid");
    if (!grid) return;
    const favorites = ids("gmp-favorites");
    const sources = new Map(cards().map((card) => [card.dataset.sunoId, card]));
    const playingId = document.getElementById("gmp")?.dataset.playingId;
    for (const card of sources.values()) {
      card.classList.toggle("is-playing", card.dataset.sunoId === playingId);
      const button = card.querySelector(".fav-btn");
      if (!button) continue;
      const active = favorites.includes(card.dataset.sunoId);
      button.textContent = active ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-label",
        isPortuguese()
          ? `${active ? "Remover dos" : "Adicionar aos"} favoritos: ${card.dataset.title}`
          : `${active ? "Remove from" : "Add to"} favorites: ${card.dataset.title}`
      );
    }
    for (const [sectionId, targetId, values, history] of [
      ["favorites-section", "favorites-grid", favorites.slice(0, 12), false],
      ["history-section", "history-rail", ids("gmp-history").slice(0, 8), true],
    ]) {
      const section = document.getElementById(sectionId);
      const target = document.getElementById(targetId);
      if (!section || !target) continue;
      const known = values.filter((id) => sources.has(id));
      section.hidden = known.length === 0;
      target.replaceChildren(
        ...known.map((id) => miniCard(sources.get(id), history))
      );
    }
  }
  function filter(genre, updateUrl) {
    const chips = document.getElementById("genre-chips");
    if (!chips) return;
    for (const chip of chips.querySelectorAll("[data-genre]")) {
      const active = chip.dataset.genre === genre;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    for (const card of cards())
      card.hidden =
        genre !== "all" &&
        !(card.dataset.genres || "").split(",").includes(genre);
    const visible = cards().filter((card) => !card.hidden).length;
    const status = document.getElementById("genre-filter-status");
    if (status)
      status.textContent = `${visible} ${isPortuguese() ? (visible === 1 ? "música" : "músicas") : visible === 1 ? "song" : "songs"}`;
    if (updateUrl) {
      const url = new URL(location.href);
      if (genre === "all") url.searchParams.delete("genre");
      else url.searchParams.set("genre", genre);
      history.replaceState(history.state, "", url);
    }
  }
  function init() {
    const grid = document.getElementById("songs-grid");
    if (!grid) return;
    if (grid.dataset.galleryInit !== "1") {
      grid.dataset.galleryInit = "1";
      const requested = new URL(location.href).searchParams.get("genre");
      const known = [
        ...document.querySelectorAll("#genre-chips [data-genre]"),
      ].some((chip) => chip.dataset.genre === requested);
      filter(known ? requested : "all", false);
    }
    refresh();
  }
  window.zolaMusicGallery = init;
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("button");
    if (!button) return;
    if (button.dataset.musicPlay) {
      play(button.dataset.musicPlay, button.dataset.title);
      return;
    }
    if (button.closest("#genre-chips") && button.dataset.genre) {
      filter(button.dataset.genre, true);
      return;
    }
    if (button.matches("#songs-grid .fav-btn")) {
      const id = button.dataset.sunoId;
      const values = new Set(ids("gmp-favorites"));
      if (values.has(id)) values.delete(id);
      else values.add(id);
      try {
        localStorage.setItem("gmp-favorites", JSON.stringify([...values]));
      } catch {
        /* Playback remains usable without storage. */
      }
      const player = document.getElementById("gmp");
      const playerButton = document.getElementById("gmp-fav");
      if (player) player.dataset.favorites = [...values].join(",");
      if (playerButton && player?.dataset.playingId) {
        const active = ids("gmp-favorites").includes(player.dataset.playingId);
        playerButton.textContent = active ? "♥" : "♡";
        playerButton.setAttribute("aria-pressed", String(active));
      }
      refresh();
      return;
    }
    if (button.id === "gmp-play-all" || button.id === "gmp-shuffle-all") {
      const queue = cards()
        .filter((card) => !card.hidden)
        .map((card) => card.dataset.sunoId);
      if (button.id === "gmp-shuffle-all")
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      document.dispatchEvent(
        new CustomEvent("gp:queue", { detail: { sunoIds: queue } })
      );
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.id !== "sort-songs") return;
    const mode = event.target.value;
    const sorted = cards().sort((a, b) => {
      if (mode === "newest" || mode === "oldest") {
        const delta =
          (Date.parse(a.dataset.date) || 0) - (Date.parse(b.dataset.date) || 0);
        return mode === "newest" ? -delta : delta;
      }
      const delta =
        Number(a.dataset.duration || 0) - Number(b.dataset.duration || 0);
      return mode === "duration-desc" ? -delta : delta;
    });
    document.getElementById("songs-grid")?.append(...sorted);
  });
  const player = document.getElementById("gmp");
  if (player)
    new MutationObserver(refresh).observe(player, {
      attributes: true,
      attributeFilter: ["data-playing-id", "data-favorites"],
    });
  window.addEventListener("storage", (event) => {
    if (["gmp-favorites", "gmp-history", "gmp-suno-id"].includes(event.key))
      refresh();
  });
  document.addEventListener("zola:page-load", init);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
