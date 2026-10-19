// Canonical route-compatibility projection rendered by SSG itself.
// Historical map comes from scripts/generate-redirects.mjs (OKF/Markdown).
// Only routes whose destinations are already published by this SSG build
// may receive a redirect; never create a published link to private content.

export const STATIC_ALIASES = Object.freeze({
  "/musicas/": "/music/",
  "/pt/blog/be-me-borges/": "/pt/blog/borges-e-eu/",
  "/blog/be-me-borges-en/": "/blog/borges-and-i/",
  "/pt/blog/borges-and-me/": "/pt/blog/borges-e-eu/",
  "/blog/borges-and-me-en/": "/blog/borges-and-i/",
  "/blog/borges-e-eu-en/": "/blog/borges-and-i/",
});

export function validRoute(path) {
  if (typeof path !== "string" || !path.startsWith("/") ||
      (path !== "/" && !path.endsWith("/")) ||
      path.includes("//") || /[\\?#<>"']/u.test(path) ||
      [...path].some((char) => char.codePointAt(0) < 32) ||
      /%(?:2f|5c|2e|00)/i.test(path) || /%(?![0-9a-f]{2})/i.test(path)) return false;
  if (path === "/") return true;
  return path.slice(1, -1).split("/").every((part) =>
    part !== "." && part !== ".." &&
    /^[\p{L}\p{N}_.~%+@-]+$/u.test(part));
}

function targetPages(entries, specialRoutes) {
  const targets = new Set();
  for (const route of specialRoutes) {
    if (!validRoute(route)) throw new Error("Invalid special route in SSG redirect mapping");
    targets.add(route);
  }
  for (const entry of entries) {
    if (!validRoute(entry.route) || !["pt", "en"].includes(entry.lang) ||
        (entry.lang === "pt") !== entry.route.startsWith("/pt/"))
      throw new Error("Invalid published post route for redirect mapping");
    targets.add(entry.route);
  }
  return targets;
}

export function planRedirects({ entries, legacy, knownTargets = [] } = {}) {
  if (!Array.isArray(entries) || !entries.length || !legacy ||
      typeof legacy !== "object" || Array.isArray(legacy) ||
      !Array.isArray(knownTargets)) throw new Error("Missing canonical redirect inputs");
  const targets = targetPages(entries, knownTargets);
  const combined = new Map();
  // Match Zola precedence: static historical mappings, generated mappings,
  // then cross-language shadows for the current canonical published posts.
  for (const [from, to] of Object.entries(STATIC_ALIASES)) combined.set(from, to);
  for (const [from, to] of Object.entries(legacy)) combined.set(from, to);
  for (const entry of entries) {
    const opposite = entry.lang === "pt"
      ? entry.route.replace(/^\/pt\//, "/")
      : "/pt" + entry.route;
    combined.set(opposite, entry.route);
  }
  const pages = [];
  const excluded = [];
  for (const [from, to] of combined) {
    if (!validRoute(from) || !validRoute(to))
      throw new Error("Unsafe historical route: " + from + " -> " + to);
    if (from === to || targets.has(from)) {
      excluded.push({ from, to, reason: "canonical-collision-or-self" });
      continue;
    }
    if (!targets.has(to)) {
      excluded.push({ from, to, reason: "target-not-yet-published-by-ssg" });
      continue;
    }
    const language = from.startsWith("/pt/") ? "pt" : "en";
    pages.push({
      from,
      to,
      target: from.slice(1) + "index.md",
      metadata: {
        schema: "page",
        layout: "redirect",
        title: language === "pt" ? "Página movida" : "Page moved",
        description: language === "pt" ? "Redirecionamento para a página atual." : "Redirect to the current page.",
        language,
        redirect_target: to,
        draft: false,
      },
    });
  }
  const sortedPages = pages.toSorted((a, b) => a.from.localeCompare(b.from, "en"));
  return {
    pages: sortedPages, excluded,
    legacy_routes: Object.keys(legacy).length,
    published_post_routes: entries.length,
    total_candidates: combined.size,
  };
}
