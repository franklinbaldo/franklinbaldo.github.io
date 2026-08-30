function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteUrl(baseUrl, value) {
  return new URL(value, baseUrl).href;
}

function rfc2822(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid publication date: ${value}`);
  return date.toUTCString();
}

function durationString(seconds) {
  if (seconds == null) return null;
  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) throw new Error(`Invalid duration: ${seconds}`);
  const whole = Math.round(Number(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function episodeGuid(workId, chapterId) {
  return `audiobook:${workId}:${chapterId}`;
}

function renderEpisode({ workId, episode, siteUrl }) {
  if (!episode.enclosure?.url) throw new Error(`${episode.chapterId}: published episode needs enclosure.url`);
  if (!Number.isInteger(episode.enclosure.bytes) || episode.enclosure.bytes <= 0) {
    throw new Error(`${episode.chapterId}: published episode needs positive enclosure.bytes`);
  }
  if (!episode.enclosure.type) throw new Error(`${episode.chapterId}: published episode needs enclosure.type`);
  if (!episode.publishedAt) throw new Error(`${episode.chapterId}: published episode needs published_at`);

  const link = absoluteUrl(siteUrl, `/audiobooks/${workId}/${episode.chapterId}/`);
  const enclosureUrl = absoluteUrl(siteUrl, episode.enclosure.url);
  const duration = durationString(episode.durationSeconds);
  const transcript = episode.transcript?.url
    ? `<podcast:transcript url="${escapeXml(absoluteUrl(siteUrl, episode.transcript.url))}" type="${escapeXml(
        episode.transcript.type ?? "text/vtt",
      )}" language="${escapeXml(episode.transcript.language ?? "pt-BR")}" rel="captions" />`
    : "";
  const chapters = episode.chapters?.url
    ? `<podcast:chapters url="${escapeXml(absoluteUrl(siteUrl, episode.chapters.url))}" type="${escapeXml(
        episode.chapters.type ?? "application/json+chapters",
      )}" />`
    : "";

  return `<item>
<title>${escapeXml(episode.title)}</title>
<description>${escapeXml(episode.description)}</description>
<link>${escapeXml(link)}</link>
<guid isPermaLink="false">${escapeXml(episodeGuid(workId, episode.chapterId))}</guid>
<pubDate>${escapeXml(rfc2822(episode.publishedAt))}</pubDate>
<enclosure url="${escapeXml(enclosureUrl)}" length="${episode.enclosure.bytes}" type="${escapeXml(
    episode.enclosure.type,
  )}" />
${duration ? `<itunes:duration>${escapeXml(duration)}</itunes:duration>` : ""}
${transcript}
${chapters}
</item>`;
}

export function buildPodcastXml({ work, episodes, siteUrl }) {
  const podcast = work.metadata.podcast ?? {};
  if (podcast.enabled !== true) throw new Error(`${work.workId}: podcast is not enabled`);

  const feedUrl = absoluteUrl(siteUrl, `/audiobooks/${work.workId}/feed.xml`);
  const workUrl = absoluteUrl(siteUrl, `/audiobooks/${work.workId}/`);
  const title = podcast.title ?? work.metadata.title;
  const description = podcast.description ?? `Audiolivro de ${work.metadata.title}`;
  const language = podcast.language ?? work.metadata.target_language ?? "pt-BR";
  const author = podcast.author ?? work.metadata.author ?? "Franklin Baldo";
  const image = podcast.image ? absoluteUrl(siteUrl, podcast.image) : null;
  const items = episodes.map((episode) => renderEpisode({ workId: work.workId, episode, siteUrl })).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
<channel>
<title>${escapeXml(title)}</title>
<description>${escapeXml(description)}</description>
<link>${escapeXml(workUrl)}</link>
<language>${escapeXml(language)}</language>
<itunes:author>${escapeXml(author)}</itunes:author>
<itunes:explicit>false</itunes:explicit>
${image ? `<itunes:image href="${escapeXml(image)}" />` : ""}
<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>
`;
}

export { durationString, escapeXml, rfc2822 };
