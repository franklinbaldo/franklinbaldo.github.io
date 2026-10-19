// One set of delegated listeners; live article references are released on swap.
(() => {
  const key = Symbol.for("zola.article.initialize");
  if (window[key]) {
    window[key]();
    return;
  }
  let controller;
  let frame;
  const sharing = new WeakSet();
  function cleanup() {
    controller?.abort();
    controller = undefined;
    if (frame) cancelAnimationFrame(frame);
    frame = undefined;
  }
  function initialize() {
    cleanup();
    const body = document.querySelector(
      "article[data-original-id] [data-zola-content]"
    );
    if (!body) return;
    controller = new AbortController();
    const progress = document.getElementById("read-progress");
    const links = [
      ...document.querySelectorAll("[data-article-toc] a[href^='#']"),
    ];
    const headings = links
      .map((link) => ({
        link,
        heading: document.getElementById(
          decodeURIComponent(link.hash.slice(1))
        ),
      }))
      .filter((entry) => entry.heading);
    const top = document.querySelector("[data-article-top]");
    function update() {
      frame = undefined;
      const rect = body.getBoundingClientRect();
      if (progress)
        progress.value = Math.max(
          0,
          Math.min(
            100,
            ((innerHeight - rect.top) / Math.max(rect.height, 1)) * 100
          )
        );
      if (top) top.classList.toggle("is-scrolled", scrollY > innerHeight);
      let active = headings[0];
      for (const entry of headings)
        if (entry.heading.getBoundingClientRect().top < innerHeight * 0.3)
          active = entry;
      for (const entry of headings) {
        entry.link.classList.toggle("is-active", entry === active);
        if (entry === active)
          entry.link.setAttribute("aria-current", "location");
        else entry.link.removeAttribute("aria-current");
      }
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", queue, {
      passive: true,
      signal: controller.signal,
    });
    window.addEventListener("resize", queue, {
      passive: true,
      signal: controller.signal,
    });
    update();
  }
  window[key] = initialize;
  document.addEventListener("zola:before-swap", cleanup);
  document.addEventListener("zola:page-load", initialize);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
  document.addEventListener("click", async (event) => {
    const button = event.target.closest?.("[data-article-share]");
    if (!button || sharing.has(button)) return;
    sharing.add(button);
    button.setAttribute("aria-busy", "true");
    const status = button.parentElement.querySelector("[data-share-status]");
    if (status) status.textContent = "";
    const url =
      button.dataset.url ||
      document.querySelector('link[rel="canonical"]')?.href ||
      location.href;
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: button.dataset.title || document.title,
            url,
          });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = button.dataset.copied;
    } catch {
      if (status) status.textContent = button.dataset.error;
    } finally {
      sharing.delete(button);
      button.removeAttribute("aria-busy");
    }
  });
})();
