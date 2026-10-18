// Pure, testable conversion helpers. No Astro runtime or MDX evaluation.
import { createHash } from "node:crypto";
import { remark } from "remark";
import remarkMath from "remark-math";
import katex from "katex";

export const quote = (value) => JSON.stringify(String(value));
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]
  );
export function published(data, now = new Date()) {
  if (data.draft) return false;
  if (data.publishDate) {
    const date = new Date(data.publishDate);
    if (!Number.isFinite(date.valueOf()))
      throw new Error("Invalid publishDate");
    if (date > now) return false;
  }
  return true;
}
export function postPath(id, data) {
  const slug = data.slug ?? id;
  if (!slug || /(^\/|\.\.|[?#\\])/.test(slug))
    throw new Error(`Unsafe post slug: ${slug}`);
  return `${data.lang === "pt" ? "/pt" : ""}/blog/${slug}/`;
}
export function frontmatter(data, extra = {}) {
  const rows = Object.entries(data).map(
    ([k, v]) =>
      `${k} = ${Array.isArray(v) ? JSON.stringify(v) : typeof v === "boolean" || typeof v === "number" ? v : quote(v)}`
  );
  rows.push("[extra]");
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      rows.push(
        `${k} = { ${Object.entries(v)
          .map(([key, value]) => `${quote(key)} = ${quote(value)}`)
          .join(", ")} }`
      );
    } else
      rows.push(
        `${k} = ${Array.isArray(v) ? JSON.stringify(v) : typeof v === "boolean" ? v : quote(v)}`
      );
  }
  return `+++\n${rows.join("\n")}\n+++\n\n`;
}
// Only literal JSX styles are accepted. Never execute expressions from content.
export function convertBody(body) {
  if (/^(?:import|export)\s/m.test(body))
    throw new Error("MDX import/export requires a native port");
  let converted = body
    .replace(/style=\{\{([^}]+)\}\}/g, (_, value) => {
      const declarations = value
        .split(",")
        .filter((s) => s.trim())
        .map((s) => {
          const match = s.trim().match(/^([\w-]+)\s*:\s*(['"])(.*?)\2$/);
          if (!match) throw new Error(`Unsupported JSX style: ${s}`);
          return `${match[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${match[3]}`;
        });
      return `style="${escapeHtml(declarations.join(";"))}"`;
    })
    .replace(/\bclassName=/g, "class=")
    .replace(/\ballowFullScreen\b/g, "allowfullscreen");
  // Preserve math using the same KaTeX package as the existing site. The AST
  // distinguishes math from fenced code, inline code, and dollar amounts.
  const tree = remark().use(remarkMath).parse(converted);
  const replacements = [];
  const visit = (node) => {
    if (node.type === "math" || node.type === "inlineMath") {
      const html = katex.renderToString(node.value, {
        displayMode: node.type === "math",
        throwOnError: false,
        strict: "ignore",
        trust: false,
      });
      replacements.push({
        start: node.position.start.offset,
        end: node.position.end.offset,
        html:
          node.type === "math"
            ? `\n<div class="math-display">${html}</div>\n`
            : html,
      });
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(tree);
  for (const r of replacements.sort((a, b) => b.start - a.start))
    converted = converted.slice(0, r.start) + r.html + converted.slice(r.end);
  return converted;
}
export const stableName = (path) =>
  createHash("sha256").update(path).digest("hex").slice(0, 20);

export function rewriteImages(body, resolveAsset) {
  const tree = remark().parse(body);
  const replacements = [];
  const references = new Set();
  function walk(node, fn) {
    fn(node);
    for (const child of node.children ?? []) walk(child, fn);
  }
  walk(tree, (node) => {
    if (node.type === "imageReference") references.add(node.identifier);
  });
  walk(tree, (node) => {
    if (
      node.type !== "image" &&
      !(node.type === "definition" && references.has(node.identifier))
    )
      return;
    if (/^(?:[a-z]+:|\/|#)/i.test(node.url)) return;
    const url = resolveAsset(decodeURIComponent(node.url));
    const title = node.title ? ` ${JSON.stringify(node.title)}` : "";
    const text =
      node.type === "image"
        ? `![${node.alt ?? ""}](<${url}>${title})`
        : `[${node.label ?? node.identifier}]: <${url}>${title}`;
    replacements.push({
      start: node.position.start.offset,
      end: node.position.end.offset,
      text,
    });
  });
  for (const r of replacements.sort((a, b) => b.start - a.start))
    body = body.slice(0, r.start) + r.text + body.slice(r.end);
  return body;
}
