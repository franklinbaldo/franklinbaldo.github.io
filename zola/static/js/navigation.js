// Native progressive navigation keeps the Suno iframe mounted outside <main>.
// With JS disabled, all links still work as ordinary static page navigation.
(() => {
  let pending;
  const loadedStyles = new Set(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map(
      (link) => link.href
    )
  );
  const persistent = (source) =>
    /\/(navigation|music-player)\.js(?:\?|$)/.test(source) ||
    source.includes("/js/enhancements/article.js");
  async function activateScripts(source, signal) {
    for (const original of source.querySelectorAll("script")) {
      if (signal.aborted) return;
      if (
        original.type &&
        !["module", "text/javascript"].includes(original.type)
      )
        continue;
      if (original.src && persistent(original.src)) continue;
      const script = document.createElement("script");
      for (const attr of original.attributes)
        script.setAttribute(attr.name, attr.value);
      script.removeAttribute("defer");
      script.async = false;
      if (original.src) {
        // Re-run route modules when revisiting; imported dependencies stay cached.
        const url = new URL(original.src);
        if (script.type === "module")
          url.searchParams.set("navigation", String(Date.now()));
        script.src = url.href;
        await new Promise((resolve, reject) => {
          script.addEventListener("load", resolve, { once: true });
          script.addEventListener("error", reject, { once: true });
          document.body.append(script);
        });
        script.remove();
      } else {
        script.textContent = original.textContent;
        document.body.append(script);
        script.remove();
      }
    }
  }
  async function navigate(url, { historyMode = "push", scroll } = {}) {
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("text/html")
      )
        throw new Error("Not a static HTML route");
      const incoming = new DOMParser().parseFromString(
        await response.text(),
        "text/html"
      );
      if (controller.signal.aborted) return;
      const main = incoming.querySelector("main#main");
      if (
        !main ||
        incoming.body.dataset.nativeApp === "standalone" ||
        incoming.querySelector('meta[name="generator"]')?.content !== "Zola"
      )
        throw new Error("Standalone document");
      for (const style of incoming.querySelectorAll('link[rel="stylesheet"]')) {
        if (!loadedStyles.has(style.href)) {
          document.head.append(style.cloneNode());
          loadedStyles.add(style.href);
        }
      }
      if (historyMode === "push") {
        history.replaceState(
          { ...history.state, scroll: [scrollX, scrollY] },
          ""
        );
        history.pushState({ scroll: [0, 0] }, "", url);
      }
      document.dispatchEvent(new Event("zola:before-swap"));
      document
        .querySelectorAll("head style[data-navigation-style]")
        .forEach((node) => node.remove());
      for (const style of incoming.head.querySelectorAll("style")) {
        const copy = style.cloneNode(true);
        copy.dataset.navigationStyle = "true";
        document.head.append(copy);
      }
      document.title = incoming.title;
      document.documentElement.lang = incoming.documentElement.lang;
      for (const selector of [
        'link[rel="canonical"]',
        'meta[name="description"]',
        'meta[name="robots"]',
        'meta[property^="og:"]',
        'meta[property^="article:"]',
        'meta[name^="twitter:"]',
        'link[rel="alternate"]',
        'script[type="application/ld+json"]',
      ]) {
        document.head
          .querySelectorAll(selector)
          .forEach((node) => node.remove());
        for (const node of incoming.head.querySelectorAll(selector))
          document.head.append(node.cloneNode(true));
      }
      document
        .querySelector("header.site-header")
        ?.replaceWith(incoming.querySelector("header.site-header"));
      document
        .querySelector("footer.site-footer")
        ?.replaceWith(incoming.querySelector("footer.site-footer"));
      const rendered = main.cloneNode(true);
      document.querySelector("main#main").replaceWith(rendered);
      rendered.setAttribute("tabindex", "-1");
      rendered.focus({ preventScroll: true });
      await activateScripts(incoming, controller.signal);
      if (controller.signal.aborted) return;
      document.dispatchEvent(new Event("zola:page-load"));
      if (url.hash)
        document
          .getElementById(decodeURIComponent(url.hash.slice(1)))
          ?.scrollIntoView();
      else window.scrollTo(...(scroll ?? [0, 0]));
    } catch (error) {
      if (error.name !== "AbortError") location.assign(url);
    }
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href);
    if (
      url.origin !== location.origin ||
      !url.pathname.endsWith("/") ||
      (url.pathname === location.pathname &&
        url.search === location.search &&
        url.hash)
    )
      return;
    event.preventDefault();
    void navigate(url);
  });
  window.addEventListener(
    "popstate",
    (event) =>
      void navigate(new URL(location.href), {
        historyMode: "none",
        scroll: event.state?.scroll,
      })
  );
  history.replaceState({ ...history.state, scroll: [scrollX, scrollY] }, "");
})();
