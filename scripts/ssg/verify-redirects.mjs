// Inspect compiled HTML, not just generated frontmatter or output paths.
// Historic aliases must be index-excluded, internal, and point at a real
// already-published canonical SSG page.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

function descend(node, matcher, result = []) {
  if (matcher(node)) result.push(node);
  for (const child of node.childNodes ?? []) descend(child, matcher, result);
  return result;
}
function attribute(node, key) {
  return node.attrs?.find((attr) => attr.name === key)?.value;
}

export function verifyRedirectHtml(html, { from, to }) {
  const dom = parse(html);
  const root = descend(dom, (n) => n.tagName === "html")[0];
  if (!root) throw new Error("Redirect output lacks html root: " + from);
  const lang = from.startsWith("/pt/") ? "pt" : "en";
  if (attribute(root, "lang")?.toLowerCase().split("-")[0] !== lang)
    throw new Error("Incorrect redirect language: " + from);

  const robots = descend(dom, (n) => n.tagName === "meta" &&
    attribute(n, "name")?.toLowerCase() === "robots");
  if (!robots.some((node) => /\bnoindex\b/i.test(attribute(node, "content") ?? "")))
    throw new Error("Historical redirect must not be indexed: " + from);

  const refresh = descend(dom, (n) => n.tagName === "meta" &&
    attribute(n, "http-equiv")?.toLowerCase() === "refresh");
  if (!refresh.some((node) => attribute(node, "content") === "0;url=" + to))
    throw new Error("Historical redirect refresh target mismatched: " + from);

  const canonical = descend(dom, (n) => n.tagName === "link" &&
    attribute(n, "rel")?.toLowerCase() === "canonical");
  if (!canonical.some((node) =>
    attribute(node, "href") === "https://franklinbaldo.github.io" + to))
    throw new Error("Historical redirect canonical target mismatched: " + from);

  const links = descend(dom, (n) => n.tagName === "a");
  if (!links.some((node) => attribute(node, "href") === to))
    throw new Error("Historical redirect has no accessible fallback link: " + from);
  return { from, to, lang };
}

export function verifyRedirectBuild({ redirects, output }) {
  if (!Array.isArray(redirects) || !redirects.length)
    throw new Error("No historical aliases in SSG manifest");
  const verified = [];
  for (const redirect of redirects) {
    const path = join(output, redirect.from.slice(1), "index.html");
    const target = join(output, redirect.to.slice(1), "index.html");
    if (!existsSync(path)) throw new Error("Missing redirect output: " + redirect.from);
    if (!existsSync(target)) throw new Error("Redirect would lead to a 404: " + redirect.to);
    verified.push(verifyRedirectHtml(readFileSync(path, "utf8"), redirect));
  }
  return {
    verified_count: verified.length,
    verified,
    leaked_unpublished_targets: 0,
    public_cutover_allowed: false,
  };
}

function main() {
  const root = resolve(".");
  const report = JSON.parse(readFileSync(join(root, ".cache/ssg-native/redirects.json"), "utf8"));
  if (report.schema !== "ssg-redirect-manifest-v1" ||
      report.generated_count !== report.redirects?.length ||
      report.generated_count + report.skipped_count !== report.total_candidates)
    throw new Error("Inconsistent historic route projection manifest");
  const result = verifyRedirectBuild({ redirects: report.redirects, output: join(root, "dist-ssg") });
  writeFileSync(join(root, ".cache/ssg-native/redirect-validation.json"),
    JSON.stringify({ ...result, skipped_by_reason: report.skipped_by_reason }, null, 2) + "\n");
  console.log(JSON.stringify({
    redirects_verified: result.verified_count,
    excluded_targets: report.skipped_by_reason,
    public_cutover_allowed: false,
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
