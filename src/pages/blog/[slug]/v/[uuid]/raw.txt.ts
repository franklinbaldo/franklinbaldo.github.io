import type { APIRoute } from "astro";
import {
  listHistoryEntries,
  materializeBlob,
} from "../../../../../lib/history-pages.js";

// RFC 0015 Fase A: raw markdown body for archived (flattened) versions.
// The file is gone from the working tree, so — unlike legacy version pages,
// which point ArchivedContent at raw.githubusercontent.com — the content is
// materialized from the recorded git blob at build time and served
// same-origin. One endpoint per entry, keyed by the primary uuid; alias-uuid
// pages reuse it. Language-neutral: the PT page fetches the same URL.
// Entries whose blob isn't reachable are skipped (their page degrades to the
// GitHub fallback link), never a build failure. With an empty/absent
// versions-history.json this route emits nothing.
export function getStaticPaths() {
  const paths: Array<{
    params: { slug: string; uuid: string };
    props: { content: string };
  }> = [];
  const seen = new Set<string>();
  for (const e of listHistoryEntries()) {
    const key = `${e.slug}/${e.uuid}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const content = materializeBlob(e.sha);
    if (content === null) continue; // warned inside materializeBlob
    paths.push({ params: { slug: e.slug, uuid: e.uuid }, props: { content } });
  }
  return paths;
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.content as string, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
