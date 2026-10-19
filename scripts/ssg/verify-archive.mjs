// Built-artifact proof: an archive route must contain exactly the
// selected canonical posts in the correct language and page order.
// Neither an empty native index nor an invented page count can pass.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";
import { renderArchive } from "./archive.mjs";

function descendants(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.childNodes ?? []) descendants(child, predicate, found);
  return found;
}

const attribute = (node, key) => node.attrs?.find((item) => item.name === key)?.value;
const textContent = (node) => node.nodeName === "#text" ? node.value ?? "" :
  (node.childNodes ?? []).map(textContent).join("");

export function verifyArchiveHtml(html, page, total) {
  const document = parse(html);
  const root = descendants(document, (node) => node.tagName === "html")[0];
  if (!root || attribute(root, "lang")?.toLowerCase().split("-")[0] !== page.language)
    throw new Error("Native archive HTML language mismatch: " + page.route);
  const main = descendants(document, (node) => node.tagName === "main")[0];
  if (!main) throw new Error("Native archive missing main landmark: " + page.route);
  const h1 = descendants(main, (node) => node.tagName === "h1");
  if (h1.length !== 1 || textContent(h1[0]).trim() !== (page.language === "pt" ? "Arquivo" : "Archive"))
    throw new Error("Native archive heading mismatch: " + page.route);
  const allLinks = descendants(main, (node) => node.tagName === "a");
  const publishedLinks = allLinks.map((node) => attribute(node, "href"))
    .filter((href) => /^\/(?:pt\/)?blog\//.test(href ?? ""));
  if (JSON.stringify(publishedLinks) !== JSON.stringify(page.postRoutes))
    throw new Error("Native archive has wrong, reordered, hidden or duplicated article links: " + page.route);
  const content = textContent(main);
  const languageCount = page.language === "pt" ? "Publicações em português: " : "English publications: ";
  if (!content.includes(languageCount + total))
    throw new Error("Native archive count is absent: " + page.route);
  if (descendants(main, (node) => node.tagName === "script").length)
    throw new Error("Unexpected inline script in native archive: " + page.route);
  return { route: page.route, language: page.language, published_links: publishedLinks.length };
}

export function verifyArchiveBuild(manifest, dist) {
  const archive = renderArchive(manifest.entries);
  if (JSON.stringify(manifest.archive?.pages) !==
      JSON.stringify(archive.pages.map((page) => page.route)))
    throw new Error("Archive manifest disagrees with canonical pages");
  const verified = [];
  for (const page of archive.pages) {
    const html = join(dist, page.route.slice(1), "index.html");
    if (!existsSync(html)) throw new Error("Missing native archive page: " + page.route);
    verified.push(verifyArchiveHtml(readFileSync(html, "utf8"), page, archive.counts[page.language]));
  }
  return {
    source_posts: manifest.entries.length,
    native_archive_pages: verified.length,
    en_posts: archive.counts.en,
    pt_posts: archive.counts.pt,
    checked: verified,
    public_cutover_allowed: false,
  };
}

function main() {
  const root = resolve(".");
  const manifest = JSON.parse(readFileSync(join(root, ".cache/ssg-native/manifest.json"), "utf8"));
  const result = verifyArchiveBuild(manifest, join(root, "dist-ssg"));
  writeFileSync(join(root, ".cache/ssg-native/archive-report.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({
    native_archive_pages: result.native_archive_pages,
    en_posts: result.en_posts,
    pt_posts: result.pt_posts,
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
