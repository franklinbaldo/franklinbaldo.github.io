import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { listWorks, publishedEpisodes } from "../../src/audiobook/catalog.js";
import { buildPodcastXml } from "../../src/audiobook/podcast.js";
import { blogAudioEpisodes } from "../../src/lib/blog-audio.js";
import { escapeHtml as h, frontmatter, stableName } from "./content.mjs";
const root = ".cache/zola-site";
const { posts } = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
function write(path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
function page(path, title, body) {
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter({ title, path, template: "page.html" }, { lang: "pt" }) + body
  );
}
const works = listWorks();
page(
  "/audiobooks/",
  "Audiolivros",
  `Obras preparadas em camadas rastreáveis de original, tradução e narração, com síntese de voz e publicação por podcast.\n\n${works.map((work) => `## [${work.metadata.title}](/audiobooks/${work.workId}/)\n\n${work.metadata.author}\n\n${publishedEpisodes(work).length} capítulos publicados. ${work.metadata.podcast?.enabled ? "Podcast" : "Em preparação"}`).join("\n\n")}`
);
for (const work of works) {
  const episodes = publishedEpisodes(work);
  const prefix = `/audiobooks/${work.workId}/`;
  const enabled = work.metadata.podcast?.enabled === true;
  page(
    prefix,
    `${work.metadata.title} — Audiolivro`,
    `[← Audiolivros](/audiobooks/)\n\n${work.metadata.author}\n\n${work.metadata.podcast?.description ?? work.metadata.title}\n\n${enabled ? `[Assinar por RSS](${prefix}feed.xml)` : "Em preparação"}\n\n## Capítulos\n\n${episodes.length ? episodes.map((ep) => `1. [${ep.title}](${prefix}${ep.chapterId}/)${ep.durationSeconds != null ? ` · ${Math.round(ep.durationSeconds / 60)} min` : ""}`).join("\n") : "O audiolivro ainda não tem capítulos publicados."}`
  );
  if (enabled)
    write(
      `static/${prefix}feed.xml`,
      buildPodcastXml({
        work,
        episodes,
        siteUrl: new URL("https://franklinbaldo.github.io/"),
      })
    );
  for (const ep of episodes)
    page(
      `${prefix}${ep.chapterId}/`,
      `${ep.title} — ${work.metadata.title}`,
      `[← ${work.metadata.title}](${prefix})\n\n${ep.description}\n\n${ep.enclosure?.url ? `<audio controls preload="metadata"><source src="${h(ep.enclosure.url)}" type="${h(ep.enclosure.type ?? "audio/mpeg")}"></audio>` : ""}\n\nPublicado: ${new Date(ep.publishedAt).toLocaleDateString("pt-BR")}\n\n${ep.durationSeconds != null ? `Duração: ${Math.round(ep.durationSeconds / 60)} min` : ""}\n\n${ep.transcript?.url ? `[Transcript / legendas](${ep.transcript.url})` : ""}`
    );
}
const episodes = blogAudioEpisodes()
  .map((episode) => ({
    episode,
    post: posts.find((p) => p.id === episode.post_id),
  }))
  .filter((x) => x.post)
  .sort(
    (a, b) =>
      Date.parse(b.episode.published_at) - Date.parse(a.episode.published_at)
  );
page(
  "/audio/",
  "Áudio",
  `[Assinar o feed de áudio](/audio.xml)\n\n${episodes.length ? episodes.map(({ episode, post }) => `## [${post.data.title}](${post.path})\n\n<audio controls preload="metadata" src="${h(episode.media_url)}"></audio>`).join("\n\n") : "Nenhuma matéria em áudio publicada ainda."}`
);
write(
  "static/audio.xml",
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>Franklin Baldo — Áudio</title><description>Versões em áudio das matérias publicadas no blog de Franklin Baldo.</description><link>https://franklinbaldo.github.io/</link><language>pt-BR</language><itunes:author>Franklin Baldo</itunes:author><itunes:explicit>false</itunes:explicit>${episodes.map(({ episode: e, post: p }) => `<item><title>${h(p.data.title)}</title><description>${h(p.data.description)}</description><link>https://franklinbaldo.github.io${h(p.path)}</link><pubDate>${new Date(e.published_at).toUTCString()}</pubDate><guid isPermaLink="false">${h(e.guid)}</guid><enclosure url="${h(e.media_url)}" length="${e.bytes}" type="${h(e.mime_type)}"/><itunes:duration>${Math.round(e.duration_seconds)}</itunes:duration></item>`).join("")}</channel></rss>\n`
);
console.log(
  `Zola audio: ${works.length} works, ${episodes.length} blog episodes; published chapters only`
);
