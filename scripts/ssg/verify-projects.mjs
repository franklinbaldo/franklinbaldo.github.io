// Build-time HTML contract test for the first native SSG domain projection.
// Confirms output contains canonical links, not merely a route stub.
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { projectSnapshot } from "./projects.mjs";

function walk(node, predicate, result = []) {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes ?? []) walk(child, predicate, result);
  return result;
}
function attr(node, name) {
  return node.attrs?.find((a) => a.name === name)?.value;
}
function visibleText(node) {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(visibleText).join("");
}

export function verifyProjectsHtml(html, snapshot, lang = "en") {
  const doc = parse(html);
  const { repos, generatedAt } = projectSnapshot(snapshot);
  const root = walk(doc, (node) => node.nodeName === "html")[0];
  if (!root || attr(root, "lang")?.toLowerCase().split("-")[0] !== lang)
    throw new Error("Project output has wrong HTML language: " + lang);
  const expectedTitle = lang === "pt" ? "Projetos" : "Projects";
  const heads = walk(doc, (node) => node.nodeName === "h1");
  if (!heads.some((node) => visibleText(node).includes(expectedTitle)))
    throw new Error("Missing real project heading: " + expectedTitle);
  if (!visibleText(doc).includes(generatedAt.slice(0, 10)))
    throw new Error("Missing provenance date for the project snapshot");

  const anchors = walk(doc, (node) => node.nodeName === "a");
  const urls = anchors.map((node) => attr(node, "href")).filter((value) =>
    value?.startsWith("https://github.com/franklinbaldo/"));
  const expected = repos.map((repo) => repo.url).toSorted();
  if (urls.length !== expected.length ||
      JSON.stringify(urls.toSorted()) !== JSON.stringify(expected))
    throw new Error("Project links differ from the exact public repository snapshot");
  return { language: lang, repository_links: urls.length, snapshot_date: generatedAt.slice(0, 10) };
}

function main() {
  const dir = resolve("dist-ssg");
  const source = resolve("src/generated/repo-factory.json");
  const snapshot = JSON.parse(readFileSync(source, "utf8"));
  const results = [];
  for (const [route, lang] of [["projects", "en"], ["pt/projects", "pt"]]) {
    const path = join(dir, route, "index.html");
    if (!existsSync(path)) throw new Error("Native project HTML missing: " + path);
    results.push(verifyProjectsHtml(readFileSync(path, "utf8"), snapshot, lang));
  }
  console.log(JSON.stringify({ valid_native_projects_pages: results }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
