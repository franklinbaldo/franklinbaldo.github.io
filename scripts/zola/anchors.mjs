// Preserve the public heading permalinks created by Astro's rehype-slug.
// The canonical algorithm is github-slugger; no old build is needed at deploy.
import GithubSlugger from "github-slugger";
import { parseFragment } from "parse5";
import { escapeHtml } from "./content.mjs";

export function preserveHeadingAnchors(html) {
  const tree = parseFragment(html, { sourceCodeLocationInfo: true });
  const headings = [];
  const elements = [];
  const ids = new Set();
  const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
  const text = (node) =>
    node.nodeName === "#text"
      ? node.value
      : (node.childNodes ?? []).map(text).join("");
  function visit(node) {
    if (node.tagName) elements.push(node);
    if (attr(node, "id")) ids.add(attr(node, "id"));
    if (/^h[1-6]$/.test(node.tagName ?? "")) headings.push(node);
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree);
  const slugger = new GithubSlugger();
  const changes = [];
  for (const heading of headings) {
    const anchor = heading.childNodes?.find(
      (node) =>
        node.tagName === "a" &&
        attr(node, "class")?.split(/\s+/).includes("zola-anchor")
    );
    // A hand-authored HTML heading already owns its explicit id. rehype-slug
    // leaves those alone, and they must not consume duplicate-slug counters.
    if (!anchor || !heading.sourceCodeLocation?.startTag) continue;
    changes.push({
      heading,
      anchor,
      old: attr(heading, "id"),
      canonical: slugger.slug(text(heading)),
    });
  }
  for (const change of changes) ids.delete(change.old);
  for (const change of changes) ids.add(change.canonical);
  const edits = [];
  function rewrite(node, name, value) {
    const location = node.sourceCodeLocation?.attrs?.[name];
    if (!location) return;
    edits.push({
      start: location.startOffset,
      end: location.endOffset,
      value: `${name}="${escapeHtml(value)}"`,
    });
  }
  let restored = 0;
  for (const change of changes) {
    if (change.old === change.canonical) continue;
    restored++;
    rewrite(change.heading, "id", change.canonical);
    rewrite(change.anchor, "href", `#${change.canonical}`);
    // Keep the newly introduced Zola spelling too, unless that spelling is
    // already another heading's historical canonical permalink.
    if (change.old && !ids.has(change.old)) {
      const start = change.heading.sourceCodeLocation.startTag.startOffset;
      edits.push({
        start,
        end: start,
        value: `<span id="${escapeHtml(change.old)}" class="heading-alias" aria-hidden="true"></span>`,
      });
      ids.add(change.old);
    }
  }
  // remark's old footnote target/ref names are public fragments as well.
  // Keep Zola's current names and add the former names inside their elements.
  for (const node of elements) {
    const id = attr(node, "id") ?? "";
    let alias;
    if (node.tagName === "li" && id.startsWith("fn-"))
      alias = `user-content-${id}`;
    else if (node.tagName === "sup" && /^fr-.+-\d+$/.test(id)) {
      const [, label, number] = id.match(/^fr-(.+)-(\d+)$/);
      alias = `user-content-fnref-${label}${number === "1" ? "" : `-${number}`}`;
    } else if (
      node.tagName === "section" &&
      attr(node, "class")?.split(/\s+/).includes("footnotes")
    )
      alias = "footnote-label";
    const start = node.sourceCodeLocation?.startTag?.endOffset;
    if (!alias || ids.has(alias) || start === undefined) continue;
    edits.push({
      start,
      end: start,
      value: `<span id="${escapeHtml(alias)}" aria-hidden="true"></span>`,
    });
    ids.add(alias);
  }
  for (const edit of edits.sort((a, b) => b.start - a.start))
    html = html.slice(0, edit.start) + edit.value + html.slice(edit.end);
  return { html, restored };
}
