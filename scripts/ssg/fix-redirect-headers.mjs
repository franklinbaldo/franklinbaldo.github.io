// The SSG 0.0.68 CanonicalPlugin rewrites a redirect's canonical to itself.
// Normalize *only* the generated historical redirect documents after all
// native SEO transforms. Leave every authored page, CSS/SRI, and JS untouched.
// Retire this small compatibility hook once SSG supports redirect targets.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, serialize } from "parse5";

function descendants(node, match, list = []) {
  if (match(node)) list.push(node);
  for (const child of node.childNodes ?? []) descendants(child, match, list);
  return list;
}
function attr(node, name) {
  return node.attrs?.find((value) => value.name === name);
}
function removeNodes(parent, reject) {
  parent.childNodes = (parent.childNodes ?? []).filter((node) => !reject(node));
}

export function correctRedirectHeaders(html, destination) {
  if (typeof destination !== "string" || !destination.startsWith("/") ||
      destination.startsWith("//")) throw new Error("Invalid redirect header target");
  const dom = parse(html);
  const head = descendants(dom, (node) => node.tagName === "head")[0];
  if (!head) throw new Error("Compiled SSG redirect has no head");

  const canonical = (head.childNodes ?? []).filter((node) =>
    node.tagName === "link" && attr(node, "rel")?.value.toLowerCase() === "canonical");
  if (!canonical.length) throw new Error("Native SEO generated no canonical link");
  const expected = "https://franklinbaldo.github.io" + destination;
  const href = attr(canonical[0], "href");
  if (!href) canonical[0].attrs.push({ name: "href", value: expected });
  else href.value = expected;

  const noindex = (head.childNodes ?? []).find((node) => node.tagName === "meta" &&
    attr(node, "name")?.value.toLowerCase() === "robots" &&
    /\bnoindex\b/i.test(attr(node, "content")?.value ?? ""));
  if (!noindex) throw new Error("Native redirect template lost robots noindex");

  // Discard duplicate canoncials, robots directives and misleading schema
  // describing the historical alias as a standalone indexed WebPage.
  removeNodes(head, (node) =>
    (node.tagName === "link" && attr(node, "rel")?.value.toLowerCase() === "canonical" &&
      node !== canonical[0]) ||
    (node.tagName === "meta" && attr(node, "name")?.value.toLowerCase() === "robots" &&
      node !== noindex) ||
    (node.tagName === "script" &&
      attr(node, "type")?.value.toLowerCase() === "application/ld+json"));

  return serialize(dom);
}

export function correctRedirectBuild({ site, redirects }) {
  if (!Array.isArray(redirects) || !redirects.length)
    throw new Error("No redirect pages to normalize");
  for (const route of redirects) {
    const path = join(site, route.from.slice(1), "index.html");
    const html = readFileSync(path, "utf8");
    writeFileSync(path, correctRedirectHeaders(html, route.to));
  }
  return redirects.length;
}

function main() {
  const base = resolve(".");
  const manifest = JSON.parse(readFileSync(join(base, ".cache/ssg-native/redirects.json"), "utf8"));
  const updated = correctRedirectBuild({
    site: join(base, "dist-ssg"), redirects: manifest.redirects,
  });
  console.log("SSG redirect canonical normalization: " + updated + " historic aliases");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
}
