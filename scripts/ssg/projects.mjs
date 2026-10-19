// Canonical public repository snapshot -> SSG-native Markdown.
// No HTML generator, Astro component, or copied Zola page.
const OWNER = "franklinbaldo";

export function escapeMarkdown(value) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/([\\[\]*_<>\x60])/g, "\\$1");
}

function strictPublicRepository(repo) {
  if (!repo || typeof repo !== "object" ||
      typeof repo.fullName !== "string" ||
      !/^franklinbaldo\/[A-Za-z0-9_.-]+$/.test(repo.fullName) ||
      repo.private === true || repo.isPrivate === true ||
      (repo.visibility != null && repo.visibility !== "public"))
    throw new Error("Invalid or nonpublic repository in published snapshot");
  if (typeof repo.url !== "string") throw new Error("Repository URL missing: " + repo.fullName);
  const url = new URL(repo.url);
  if (url.protocol !== "https:" || url.hostname !== "github.com" ||
      url.username || url.password || url.search || url.hash ||
      url.pathname.replace(/\/$/, "") !== "/" + repo.fullName)
    throw new Error("Unsafe or unrelated GitHub URL: " + repo.fullName);
  return repo;
}

export function projectSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== "repo-factory-v1" ||
      snapshot.owner !== OWNER ||
      snapshot.privacy !== "public repositories only" ||
      !Array.isArray(snapshot.repositories) ||
      snapshot.repositories.length === 0 ||
      snapshot.totals?.repositories !== snapshot.repositories.length)
    throw new Error("Missing, mismatched or nonpublic repo-factory snapshot");
  const date = new Date(snapshot.generatedAt);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Invalid public snapshot timestamp");
  const repos = snapshot.repositories.map(strictPublicRepository).toSorted((a, b) =>
    a.fullName.localeCompare(b.fullName, "en"));
  if (new Set(repos.map((r) => r.fullName)).size !== repos.length)
    throw new Error("Duplicate repository in public snapshot");
  return {
    repos,
    generatedAt: date.toISOString(),
    source: "src/generated/repo-factory.json",
  };
}

function description(repo, lang) {
  const fields = [];
  if (repo.description && typeof repo.description === "string")
    fields.push(escapeMarkdown(repo.description));
  if (repo.language && typeof repo.language === "string")
    fields.push((lang === "pt" ? "Linguagem" : "Language") + ": " + escapeMarkdown(repo.language));
  return fields.join(" · ");
}

export function renderProjects(snapshot) {
  const { repos, generatedAt, source } = projectSnapshot(snapshot);
  const pages = [];
  for (const lang of ["en", "pt"]) {
    const pt = lang === "pt";
    const meta = {
      schema: "page",
      title: pt ? "Projetos" : "Projects",
      name: pt ? "Projetos" : "Projects",
      description: pt ? "Repositórios públicos e projetos de Franklin Baldo." : "Public repositories and projects by Franklin Baldo.",
      layout: "page",
      language: lang,
      translation_key: "projects-index",
      draft: false,
    };
    const heading = pt ? "Repositórios públicos" : "Public repositories";
    const asOf = pt ? "Snapshot de" : "Snapshot from";
    const disclaimer = pt
      ? "Esta página é uma projeção do catálogo público versionado; detalhes podem ter mudado desde a coleta."
      : "This page is derived from a versioned public repository snapshot; details may have changed since collection.";
    const entries = repos.map((repo) => {
      const title = escapeMarkdown(repo.name || repo.fullName.split("/")[1]);
      const notes = description(repo, lang);
      return "- **[" + title + "](" + repo.url + ")**" + (notes ? " — " + notes : "");
    });
    const body = [
      disclaimer,
      "",
      asOf + " **" + generatedAt.slice(0, 10) + "**.",
      "",
      "## " + heading + " (" + repos.length + ")",
      "",
      ...entries,
    ].join("\n");
    pages.push({
      target: (pt ? "pt/" : "") + "projects/index.md",
      route: pt ? "/pt/projects/" : "/projects/",
      metadata: meta,
      body,
    });
  }
  return { pages, count: repos.length, generatedAt, source };
}
