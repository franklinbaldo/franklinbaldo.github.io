import fs from "node:fs";
import path from "node:path";
import { blobShaForPath } from "../posts.js";
import {
  listSlugVersions,
  listAllVersionSlugs,
  flatCanonicalPath,
  historyEntryFor,
  type VersionInfo,
} from "../selection.js";
import { registerHistory, HISTORY_PATH } from "../history.js";
import { computeVersionRatings } from "../ranking.js";
import {
  versionStars,
  PRUNED_PATH,
  PRUNE_MARGIN,
  PRUNE_MIN_DUELS,
} from "./_shared.js";

interface PrunedEntry {
  slug: string;
  uuid: string;
  legacyUuid: string;
  preOkfUuid: string;
  lang: string;
  prunedAt: string;
}

function registerPruned(entries: PrunedEntry[]) {
  let registry: { _meta: { schema: string }; pruned: PrunedEntry[] } = {
    _meta: { schema: "pruned-v1" },
    pruned: [],
  };
  if (fs.existsSync(PRUNED_PATH)) {
    // A malformed registry (merge conflict, partial write) must abort the
    // prune: rebuilding from scratch would silently drop every previously
    // registered permalink — and their source files are already gone, so
    // the redirects would be unrecoverable.
    try {
      registry = JSON.parse(fs.readFileSync(PRUNED_PATH, "utf8"));
    } catch (e) {
      throw new Error(
        `${PRUNED_PATH} existe mas não parseia (${(e as Error).message}). ` +
          "Repare o registro manualmente antes de podar."
      );
    }
    if (!Array.isArray(registry?.pruned)) {
      throw new Error(
        `${PRUNED_PATH} sem o array "pruned" esperado (schema pruned-v1). ` +
          "Repare o registro manualmente antes de podar."
      );
    }
  }
  const seen = new Set(registry.pruned.map((e) => `${e.slug}@${e.uuid}`));
  for (const e of entries) {
    if (seen.has(`${e.slug}@${e.uuid}`)) continue;
    registry.pruned.push(e);
    seen.add(`${e.slug}@${e.uuid}`);
  }
  registry.pruned.sort((a, b) =>
    `${a.slug}@${a.uuid}`.localeCompare(`${b.slug}@${b.uuid}`)
  );
  fs.mkdirSync(path.dirname(PRUNED_PATH), { recursive: true });
  fs.writeFileSync(PRUNED_PATH, JSON.stringify(registry, null, 2) + "\n");
}

// RFC 0010 §4.4: prune non-selected versions that have clearly lost — the
// selected version leads by ≥ PRUNE_MARGIN stars over ≥ PRUNE_MIN_DUELS
// version duels. Never the selected version, never the last file in a
// directory.
//
// RFC 0015: dual-mode by slug. A legacy slug prunes exactly as before — a
// non-selected sibling, registered in versions-pruned.json (registerPruned)
// so the build emits a redirect instead of a 404. A flat slug has no
// sibling to prune; its losing challengers live in
// .routines/hronir/drafts/<slug>/, registered in versions-history.json
// (registerHistory, the same archive foldBack uses) instead — same
// "register before delete" discipline either way.
export function prune({ dryRun = false } = {}) {
  const ratings = computeVersionRatings();
  const removed: Array<{
    v: VersionInfo;
    margin: number;
    n: number;
    flat: boolean;
  }> = [];

  for (const slug of listAllVersionSlugs()) {
    const versions = listSlugVersions(slug);
    const selected = versions.find((v) => v.selected);
    if (!selected) continue;
    const selStars = versionStars(ratings, selected);
    if (!selStars) continue;
    const isFlat = Boolean(flatCanonicalPath(slug));
    for (const v of versions) {
      if (v.selected) continue;
      const vs = versionStars(ratings, v);
      if (!vs) continue;
      const margin = selStars.stars - vs.stars;
      if (vs.n >= PRUNE_MIN_DUELS && margin >= PRUNE_MARGIN) {
        removed.push({ v, margin, n: vs.n, flat: isFlat });
      }
    }
  }

  if (removed.length === 0) {
    console.log("prune: nenhuma versão elegível para poda.");
    return;
  }

  // Register permalinks BEFORE deleting anything, for both mechanisms:
  // registerPruned/registerHistory abort on a malformed registry, and at
  // that point nothing has been removed yet. A crash between a write and
  // its unlinks leaves at worst a redirect for a still-existing version,
  // which the next prune run cleans up.
  if (!dryRun) {
    const legacy = removed.filter((r) => !r.flat);
    const flat = removed.filter((r) => r.flat);
    if (legacy.length > 0) {
      const prunedAt = new Date().toISOString();
      registerPruned(
        legacy.map(({ v }) => ({
          slug: v.slug,
          uuid: v.uuid,
          legacyUuid: v.legacyUuid,
          preOkfUuid: v.preOkfUuid,
          lang: v.lang,
          prunedAt,
        }))
      );
    }
    if (flat.length > 0) {
      registerHistory(
        flat.map(({ v }) => historyEntryFor(v, blobShaForPath(v.path)))
      );
    }
  }

  for (const { v, margin, n, flat } of removed) {
    if (dryRun) {
      console.log(
        `[prune dry-run] ${v.path} (-${margin.toFixed(2)}★ vs selecionada, n=${n})`
      );
    } else {
      fs.unlinkSync(v.path);
      console.log(
        `[prune] removido ${v.path} (-${margin.toFixed(2)}★ vs selecionada, n=${n}) — permalink registrado em ${flat ? HISTORY_PATH : PRUNED_PATH}`
      );
    }
  }

  const label = dryRun ? "dry-run" : "removida(s)";
  console.log(`\nprune: ${removed.length} versão(ões) ${label}.`);
  if (dryRun) {
    console.log("Rode sem --dry-run para remover.");
  }
}
