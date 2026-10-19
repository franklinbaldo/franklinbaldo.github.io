// Public Webmentions remain a build-time projection, never a new browser tracker.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { escapeHtml as h } from "./content.mjs";
const manifest = JSON.parse(
  readFileSync(".cache/zola-site/manifest.json", "utf8")
);
const safeURL = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
let cursor = 0,
  rendered = 0,
  unavailable = 0;
async function worker() {
  while (cursor < manifest.posts.length) {
    const post = manifest.posts[cursor++];
    const target = "https://franklinbaldo.github.io" + post.path;
    try {
      const url = new URL("https://webmention.io/api/mentions.jf2");
      url.searchParams.set("target", target);
      url.searchParams.set("per-page", "100");
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        unavailable++;
        continue;
      }
      const data = await response.json();
      if (!Array.isArray(data.children) || !data.children.length) continue;
      const pt = post.data.lang === "pt";
      const items = data.children
        .map((mention) => {
          const name = mention.author?.name || "Webmention";
          const href = safeURL(mention.url || mention["wm-source"]);
          return `<li>${href ? `<a href="${h(href)}" rel="noopener noreferrer">${h(name)}</a>` : h(name)} · ${h(mention["wm-property"] || "mention")}</li>`;
        })
        .join("");
      const section = `<section aria-labelledby="webmentions-heading" data-pagefind-ignore><h2 id="webmentions-heading">${pt ? "Menções na web" : "Webmentions"}</h2><ul>${items}</ul></section>`;
      const file = join("dist-zola", post.path, "index.html");
      const html = readFileSync(file, "utf8");
      writeFileSync(file, html.replace("<!-- zola-webmentions -->", section));
      rendered++;
    } catch {
      unavailable++;
      /* Optional service failures never hide the article or break publication. */
    }
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
console.log(
  `Zola Webmentions: ${rendered} article sections; ${unavailable} public-service requests unavailable`
);
