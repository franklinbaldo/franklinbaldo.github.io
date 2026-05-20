const HANDLE = "franklinbaldo";
const SUNO_API = "https://studio-api-prod.suno.com/api";

export interface SunoClip {
  id: string;
  title: string;
  audio_url: string;
  is_public: boolean;
}

interface ProfileResponse {
  clips: SunoClip[];
  num_total_clips: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 && attempt < 3) {
      await sleep(1000 * Math.pow(2, attempt));
      continue;
    }
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  throw new Error(`exhausted retries on ${url}`);
}

// Both `playlists_sort_by` and `clips_sort_by` are required — omitting
// either returns HTTP 422.
let allClipsPromise: Promise<SunoClip[]> | null = null;
let audioMapPromise: Promise<Record<string, string>> | null = null;

export function fetchAllClips(): Promise<SunoClip[]> {
  if (!allClipsPromise) allClipsPromise = _fetchAllClips();
  return allClipsPromise;
}

async function _fetchAllClips(): Promise<SunoClip[]> {
  const clips: SunoClip[] = [];
  const seen = new Set<string>();
  const url = (p: number) =>
    `${SUNO_API}/profiles/${HANDLE}/?page=${p}&playlists_sort_by=created_at&clips_sort_by=created_at`;

  const first = await fetchJSON<ProfileResponse>(url(1));
  const total = first.num_total_clips ?? 0;
  for (const c of first.clips ?? []) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      clips.push(c);
    }
  }
  let page = 2;
  while (clips.length < total) {
    const next = await fetchJSON<ProfileResponse>(url(page));
    const got = next.clips ?? [];
    if (got.length === 0) break;
    for (const c of got) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        clips.push(c);
      }
    }
    page++;
  }
  return clips.filter((c) => c.is_public);
}

export function fetchAudioMap(): Promise<Record<string, string>> {
  if (!audioMapPromise) audioMapPromise = _fetchAudioMap();
  return audioMapPromise;
}

async function _fetchAudioMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    for (const c of await fetchAllClips()) {
      if (c.audio_url) map[c.id] = c.audio_url;
    }
  } catch (e) {
    console.warn(
      `[suno] fetchAudioMap failed: ${e instanceof Error ? e.message : e}`
    );
  }
  return map;
}
