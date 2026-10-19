// Temporary SSG Markdown archive projection. SSG 0.0.68's native
// PaginationPlugin reads only build-tmp/.meta after staticdatagen promoted
// the sidecars to site_dir/.meta. Leave HTML, templates, SEO and i18n to SSG.
// Retire this adapter when the upstream listing plugin is fixed and verified.
export const ARCHIVE_PER_PAGE = 50;

function pageRoute(language, number) {
  const base = language === "pt" ? "/pt/archive/" : "/archive/";
  return number === 1 ? base : base + "page/" + number + "/";
}

function validateEntries(entries) {
  if (!Array.isArray(entries) || !entries.length)
    throw new Error("No canonical published entries for native archive");
  const seen = new Set();
  for (const entry of entries) {
    if (!["en", "pt"].includes(entry.lang) ||
        typeof entry.title !== "string" || !entry.title.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "") ||
        typeof entry.route !== "string" ||
        !/^\/(?:pt\/)?blog\/[a-zA-Z0-9][\w./%-]*\/$/.test(entry.route) ||
        entry.route.includes("..") || entry.route.includes("//") ||
        /%(?:2f|5c|2e)/i.test(entry.route) ||
        (entry.lang === "pt") !== entry.route.startsWith("/pt/") ||
        seen.has(entry.route))
      throw new Error("Unsafe or incomplete native archive entry: " + JSON.stringify(entry));
    seen.add(entry.route);
  }
}

function escapedTitle(title) {
  const escaped = new Set(["\\", "[", "]", "*", "_", "<", ">", "`"]);
  return title.replace(/[\r\n\t]+/g, " ").replace(/./gu, (char) =>
    escaped.has(char) ? "\\" + char : char);
}

export function archiveGroups(entries, language, perPage = ARCHIVE_PER_PAGE) {
  if (!["en", "pt"].includes(language) ||
      !Number.isSafeInteger(perPage) || perPage < 1)
    throw new Error("Invalid archive language or pagination size");
  const selected = entries.filter((entry) => entry.lang === language)
    .toSorted((a, b) => b.date.localeCompare(a.date) ||
      (a.route < b.route ? -1 : a.route > b.route ? 1 : 0));
  const groups = [];
  for (let i = 0; i < selected.length; i += perPage)
    groups.push(selected.slice(i, i + perPage));
  return groups;
}

export function renderArchive(entries, perPage = ARCHIVE_PER_PAGE) {
  validateEntries(entries);
  const pages = [];
  const counts = {
    en: entries.filter((e) => e.lang === "en").length,
    pt: entries.filter((e) => e.lang === "pt").length,
  };
  const groupsByLanguage = Object.fromEntries(
    ["en", "pt"].map((language) => [language, archiveGroups(entries, language, perPage)])
  );
  for (const language of ["en", "pt"]) {
    const pt = language === "pt";
    const groups = groupsByLanguage[language];
    if (!groups.length)
      throw new Error("Native archive has no entries for " + language);
    for (const [index, group] of groups.entries()) {
      const number = index + 1;
      const title = pt ? "Arquivo" : "Archive";
      const intro = pt
        ? "Publicações em português: " + counts.pt + ". Página " + number + " de " + groups.length + "."
        : "English publications: " + counts.en + ". Page " + number + " of " + groups.length + ".";
      const alternateLanguage = pt ? "en" : "pt";
      const paired = number <= groupsByLanguage[alternateLanguage].length;
      const alternateRoute = pageRoute(alternateLanguage, paired ? number : 1);
      const switchLink = pt
        ? "[English archive](" + alternateRoute + ")"
        : "[Arquivo em português](" + alternateRoute + ")";
      const rows = group.map((entry) =>
        "- [" + escapedTitle(entry.title) + "](" + entry.route + ") — " + entry.date);
      const navigation = groups.length === 1 ? [] : [
        "",
        pt ? "## Páginas" : "## Pages",
        Array.from({ length: groups.length }, (_, i) =>
          i + 1 === number ? "**" + (i + 1) + "**" : "[" + (i + 1) + "](" + pageRoute(language, i + 1) + ")").join(" · "),
      ];
      const route = pageRoute(language, number);
      pages.push({
        language, route, target: route.slice(1) + "index.md",
        metadata: {
          schema: "page",
          title: number === 1 ? title : title + " — " + number,
          name: title, description: intro, language,
          layout: "page", draft: false,
          ...(paired
            ? { translation_key: number === 1 ? "ssg-archive" : "ssg-archive-page-" + number }
            : {}),
        },
        // The SSG page template already emits the sole H1 and intro tagline.
        // Do not repeat them in Markdown (WCAG heading/SEO duplication).
        body: [switchLink, "",
          pt ? "## Publicações" : "## Publications", "", ...rows, ...navigation].join("\n"),
        postRoutes: group.map((entry) => entry.route),
      });
    }
  }
  return { pages, counts, perPage };
}
