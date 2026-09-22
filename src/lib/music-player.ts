import { getCollection } from "astro:content";
import { getRanking } from "./hronir-rank";
import { fetchAllClips } from "./suno";

export interface PlayerSong {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
}

let playerSongsPromise: Promise<PlayerSong[]> | null = null;

export function getPlayerSongs(): Promise<PlayerSong[]> {
  if (!playerSongsPromise) playerSongsPromise = buildPlayerSongs();
  return playerSongsPromise;
}

async function buildPlayerSongs(): Promise<PlayerSong[]> {
  try {
    const clips = await fetchAllClips();
    const clipById = new Map(clips.map((clip) => [clip.id, clip]));
    const musicPosts = await getCollection(
      "blog",
      (entry) =>
        entry.data.postType === "music" &&
        (!!entry.data.sunoId || (entry.data.tracks?.length ?? 0) > 0),
    );

    const keyToSunoIds = new Map<string, string[]>();
    const sunoIdToPostUrl = new Map<string, string>();
    for (const post of musicPosts) {
      const postLang = post.data.lang ?? "en";
      const url =
        postLang === "pt"
          ? `/pt/blog/${post.data.slug ?? post.id}/`
          : `/blog/${post.data.slug ?? post.id}/`;
      const ids = [
        post.data.sunoId,
        ...(post.data.tracks ?? []).map((track) => track.sunoId),
      ].filter((id): id is string => !!id);
      for (const id of ids) sunoIdToPostUrl.set(id, url);
      if (post.data.translationKey && ids.length > 0) {
        const key = post.data.translationKey;
        keyToSunoIds.set(key, [...(keyToSunoIds.get(key) ?? []), ...ids]);
      }
    }

    const rankedIds: string[] = [];
    const seen = new Set<string>();
    for (const row of getRanking()) {
      for (const id of keyToSunoIds.get(row.key) ?? []) {
        if (clipById.has(id) && !seen.has(id)) {
          rankedIds.push(id);
          seen.add(id);
        }
      }
    }
    for (const clip of clips) {
      if (!seen.has(clip.id)) rankedIds.push(clip.id);
    }

    return rankedIds
      .map((id) => clipById.get(id))
      .filter(Boolean)
      .map((clip) => ({
        id: clip!.id,
        title: clip!.title || "(sem título)",
        imageUrl: clip!.image_url || "",
        postUrl: sunoIdToPostUrl.get(clip!.id) || "",
      }));
  } catch (error) {
    console.warn("[music-player] failed to load songs:", error);
    return [];
  }
}
