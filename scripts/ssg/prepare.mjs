// Native SSG input is a reproducible projection, never the canonical content.
// Zola and Astro remain untouched while the SSG candidate is audited.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { BLOG_DIR, listPostFiles, postIdFromPath } from "../lib/content.mjs";
import { convertBody, postPath, published, rewriteImages, stableName } from "../lib/publication.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const OUTPUT = join(ROOT, ".cache/ssg-native");

function inside(root, file) {
  return file === root || file.startsWith(root + sep);
}

export function targetForRoute(route) {
  if (!/^\/(?:pt\/)?blog\/[a-zA-Z0-9][\w./%-]*\/$/.test(route) ||
      route.includes("..") || route.includes("//") || /%(?:2f|5c|2e)/i.test(route)) {
    throw new Error("Unsafe or unsupported native SSG route: " + route);
  }
  return join(route.slice(1), "index.md");
}

export function metadataForPost(data, id) {
  const date = new Date(data.date);
  if (!Number.isFinite(date.valueOf())) throw new Error("Invalid post date: " + id);
  if (!data.title || !data.description) throw new Error("Missing metadata: " + id);
  if (data.lang && !["pt", "en"].includes(data.lang))
    throw new Error("Unsupported editorial language: " + data.lang + " (" + id + ")");
  const lang = data.lang === "pt" ? "pt" : "en";
  return {
    schema: "post",
    title: String(data.title),
    name: String(data.title),
    description: String(data.description),
    date: date.toISOString().slice(0, 10),
    news_publication_date: date.toISOString().slice(0, 10),
    layout: "post",
    language: lang,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    ...(data.translationKey ? { translation_key: String(data.translationKey) } : {}),
    author: "Franklin Baldo",
    draft: false,
  };
}

export function markdownDocument(metadata, body) {
  return "---\n" + yaml.dump(metadata, { lineWidth: -1, noRefs: true }) +
    "---\n\n" + body.trimStart() + "\n";
}

function write(root, subpath, text) {
  const absolute = resolve(root, subpath);
  if (!inside(root, absolute)) throw new Error("Unsafe output: " + subpath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, text);
}

export function prepareNativeSite({ now = new Date(), output = OUTPUT } = {}) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid SSG_BUILD_DATE");
  const content = join(output, "content");
  const assetRoot = join(output, "assets");
  rmSync(output, { recursive: true, force: true });
  mkdirSync(content, { recursive: true });
  mkdirSync(assetRoot, { recursive: true });
  cpSync(join(ROOT, "ssg/content.schema.toml"), join(content, "content.schema.toml"));
  const entries = [];
  const excluded = [];
  const unsupported = [];
  const seenRoutes = new Set();
  for (const file of listPostFiles()) {
    const id = postIdFromPath(file);
    const { data, content: body } = matter(readFileSync(file, "utf8"));
    if (!published(data, now)) {
      excluded.push({ id, reason: "draft-or-future" });
      continue;
    }
    let route;
    try {
      route = postPath(id, data);
      const target = targetForRoute(route);
      if (seenRoutes.has(route)) throw new Error("Duplicate public route");
      const metadata = metadataForPost(data, id);
      const rewritten = rewriteImages(body, (asset) => {
        const absolute = resolve(dirname(file), asset);
        if (!inside(BLOG_DIR, absolute) || !existsSync(absolute))
          throw new Error("Missing or out-of-tree image: " + asset);
        const webPath = "blog-assets/" + stableName(relative(ROOT, absolute)) + extname(absolute);
        const copyTo = resolve(assetRoot, webPath);
        if (!inside(assetRoot, copyTo)) throw new Error("Unsafe asset path");
        mkdirSync(dirname(copyTo), { recursive: true });
        cpSync(absolute, copyTo);
        return "/" + webPath;
      });
      // MDX is never evaluated. The existing safe converter handles supported
      // JSX literals and pre-renders KaTeX until SSG has matching math support.
      const finalBody = convertBody(rewritten);
      write(content, target, markdownDocument(metadata, finalBody));
      seenRoutes.add(route);
      entries.push({ id, route, source: relative(ROOT, file), lang: metadata.language });
    } catch (error) {
      unsupported.push({ id, route: route ?? null, source: relative(ROOT, file), reason: error.message });
    }
  }
  // SSG's own i18n plugin handles alternate links, root-hosted English,
  // and /pt/ based on these content files and translation_key.
  const home = {
    schema: "page", title: "Franklin Baldo", name: "Franklin Baldo", description: "Essays, code and research.",
    language: "en", layout: "page", draft: false,
  };
  const homePt = {
    title: "Franklin Baldo", name: "Franklin Baldo", description: "Ensaios, código e pesquisa.",
    language: "pt", layout: "page", draft: false,
  };
  write(content, "index.md", markdownDocument(home,
    "# Writing and research\n\n[Browse the archive](/archive/) · [Português](/pt/)"));
  write(content, "pt/index.md", markdownDocument(homePt,
    "# Ensaios e pesquisa\n\n[Acervo](/archive/) · [English](/)"));
  const manifest = {
    generator: "ssg", pinned_version: "0.0.68", source: "src/content/blog",
    entries, excluded, unsupported,
    note: "Native candidate. Unsupported pages and routes must be ported before cutover.",
  };
  writeFileSync(join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log("SSG projection: " + entries.length + " posts, " +
    excluded.length + " excluded, " + unsupported.length + " unsupported.");
  if (entries.length < 100) throw new Error("Suspicious SSG projection: fewer than 100 posts; run scripts/pregen.mjs before prepare.mjs and inspect the manifest");
  if (unsupported.length) {
    console.error("Unsupported post details: .cache/ssg-native/manifest.json");
    throw new Error("SSG projected " + entries.length + " posts but rejected " + unsupported.length + " published source(s); do not silently omit published content");
  }
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    prepareNativeSite({ now: new Date(process.env.SSG_BUILD_DATE || Date.now()) });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
