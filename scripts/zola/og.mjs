// OG rendering is a Node media projection, independent of Astro rendering.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pageCards } from "./og-page-cards.mjs";
import { renderOgCard } from "../../src/lib/og-card.ts";
import { READING_PATHS } from "../../src/lib/reading-paths-data.mjs";
import { getQrPng } from "../../src/lib/og-qr.ts";
const manifest = JSON.parse(
  readFileSync(".cache/zola-site/manifest.json", "utf8")
);
const out = "dist-zola/og";
mkdirSync(out, { recursive: true });
for (const p of manifest.posts) {
  const lang = p.data.lang ?? "en";
  const qrPng = getQrPng({
    slug: p.id,
    fallbackSlug: lang === "pt" ? "home-pt" : "home",
  });
  const png = await renderOgCard({
    title: p.data.title,
    description: p.data.description,
    tags: p.data.tags ?? [],
    lang,
    kind: "post",
    path: p.path,
    qrPng: qrPng ?? undefined,
  });
  writeFileSync(join(out, `${p.id}.png`), png);
}
for (const { filename, qrSlug, fallbackSlug, card } of pageCards) {
  const png = await renderOgCard({
    ...card,
    qrPng: getQrPng({ slug: qrSlug, fallbackSlug }) ?? undefined,
  });
  writeFileSync(join(out, filename), png);
}
console.log(
  `Zola OG media: ${manifest.posts.length} post images plus existing page cards`
);

for (const path of READING_PATHS)
  for (const lang of ["en", "pt"]) {
    const slug = `path-${lang === "pt" ? "pt-" : ""}${path.slug}`;
    const png = await renderOgCard({
      title: path.title[lang],
      description: path.blurb[lang],
      lang,
      kind: "post",
      path: `${lang === "pt" ? "/pt" : ""}/paths/${path.slug}/`,
      qrPng:
        getQrPng({ slug, fallbackSlug: lang === "pt" ? "home-pt" : "home" }) ??
        undefined,
    });
    writeFileSync(join(out, `${slug}.png`), png);
  }
