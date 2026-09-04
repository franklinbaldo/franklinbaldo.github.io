// Language of `repo.description` shown in the repo cards on `/projects/`
// and `/pt/projects/` (fetched live from the GitHub API at build time —
// GitHub doesn't report the description's language). Most public repos
// have English descriptions, so that's the default; this map only needs to
// list the exceptions written in Portuguese — same pattern as
// `tagDescriptions.ts`.
const ptDescriptionRepos = new Set([
  "rossio",
  "quem-sao-eles",
  "suj",
  "dinossauro",
]);

export function repoDescriptionLang(repoName: string): "en" | "pt" {
  return ptDescriptionRepos.has(repoName) ? "pt" : "en";
}
