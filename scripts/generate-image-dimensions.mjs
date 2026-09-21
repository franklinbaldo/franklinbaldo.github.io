// Emits src/generated/image-dimensions.json — a { [remoteImageUrl]: {width,
// height} } map for remote images referenced via Markdown `![alt](url)`
// syntax in post bodies. Astro's built-in Markdown image pipeline already
// injects width/height for *local* images automatically, but it can't probe
// *remote* URLs — those render as plain `<img>` with no dimensions, causing
// CLS. astro.config.mjs's rehypeImageDims plugin reads this cache at build
// time (no network I/O during the actual Astro build) to fill them in.
//
// Run manually whenever a post adds a new remote image:
//   node scripts/generate-image-dimensions.mjs
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";
import { BLOG_DIR } from "./lib/content.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, "../src/generated");
const outFile = join(outDir, "image-dimensions.json");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Markdown wraps URLs containing literal parentheses in `<...>` (e.g. a
// meme caption like `sin(0.5)`); match both that form and the bare form.
const IMG_URL_RE =
  /!\[[^\]]*\]\((?:<(https?:\/\/[^>]+)>|(https?:\/\/[^)\s]+))\)/g;

const urls = new Set();
for (const file of walk(BLOG_DIR)) {
  const raw = readFileSync(file, "utf-8");
  for (const m of raw.matchAll(IMG_URL_RE)) urls.add(m[1] ?? m[2]);
}

let existing = {};
try {
  existing = JSON.parse(readFileSync(outFile, "utf-8"));
} catch {
  // First run — no cache yet.
}

const dimensions = { ...existing };
let fetched = 0;
let failed = 0;

for (const url of urls) {
  if (dimensions[url]) continue;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { width, height } = imageSize(buf);
    dimensions[url] = { width, height };
    fetched++;
  } catch (err) {
    console.warn(`✘ couldn't probe ${url}: ${err.message}`);
    failed++;
  }
}

// Drop cached entries for URLs no longer referenced by any post.
for (const url of Object.keys(dimensions)) {
  if (!urls.has(url)) delete dimensions[url];
}

const sorted = Object.fromEntries(
  Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b))
);

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + "\n");

console.log(
  `✔ image-dimensions.json: ${Object.keys(sorted).length} remote image(s) (${fetched} newly probed${failed ? `, ${failed} failed` : ""})`
);
