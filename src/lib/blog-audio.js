import manifest from "../../data/blog-audio.json";

function validEpisode(episode) {
  return Boolean(
    episode &&
      typeof episode.post_id === "string" &&
      episode.guid === `audio:blog:${episode.post_id}` &&
      typeof episode.media_url === "string" &&
      episode.media_url.startsWith("https://archive.org/download/") &&
      typeof episode.mime_type === "string" &&
      Number.isInteger(episode.bytes) &&
      episode.bytes > 0 &&
      typeof episode.sha256 === "string" &&
      /^sha256:[0-9a-f]{64}$/.test(episode.sha256) &&
      Number.isFinite(episode.duration_seconds) &&
      episode.duration_seconds > 0 &&
      typeof episode.published_at === "string" &&
      typeof episode.archive_item === "string",
  );
}

export function blogAudioEpisodes() {
  const episodes = Array.isArray(manifest.episodes) ? manifest.episodes : [];
  const invalid = episodes.find((episode) => !validEpisode(episode));
  if (invalid) {
    throw new Error(
      `invalid blog audio publication for ${invalid?.post_id ?? "unknown post"}`,
    );
  }
  const ids = new Set();
  for (const episode of episodes) {
    if (ids.has(episode.post_id)) {
      throw new Error(
        `duplicate blog audio publication for ${episode.post_id}`,
      );
    }
    ids.add(episode.post_id);
  }
  return episodes;
}

export function blogAudioForPost(postId) {
  return (
    blogAudioEpisodes().find((episode) => episode.post_id === postId) ?? null
  );
}
