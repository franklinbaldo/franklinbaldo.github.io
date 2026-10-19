// Apply the saved choice before styles paint, then keep new navigation chrome
// in sync without registering a second listener when this script is revisited.
(() => {
  if (window.zolaTheme) {
    window.zolaTheme();
    return;
  }
  const system = matchMedia("(prefers-color-scheme: dark)");
  let choice;
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") choice = saved;
  } catch {}
  const current = () => choice || (system.matches ? "dark" : "light");
  function sync() {
    const theme = current();
    document.documentElement.dataset.theme = theme;
    for (const toggle of document.querySelectorAll("[data-theme-toggle]"))
      toggle.checked = theme === "dark";
  }
  window.zolaTheme = sync;
  sync();
  document.addEventListener("change", (event) => {
    if (!event.target.matches?.("[data-theme-toggle]")) return;
    choice = event.target.checked ? "dark" : "light";
    try {
      localStorage.setItem("theme", choice);
    } catch {}
    sync();
  });
  document.addEventListener("DOMContentLoaded", sync, { once: true });
  document.addEventListener("zola:page-load", sync);
  system.addEventListener("change", () => {
    if (!choice) sync();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "theme") return;
    choice = ["light", "dark"].includes(event.newValue)
      ? event.newValue
      : undefined;
    sync();
  });
  document.addEventListener("click", (event) => {
    for (const menu of document.querySelectorAll(".more-menu[open]"))
      if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const menu of document.querySelectorAll(".more-menu[open]")) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  });
})();
