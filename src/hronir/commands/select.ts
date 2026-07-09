import {
  SELECTION_PATH,
  writeSelection,
  listSlugVersions,
  listAllVersionSlugs,
  flatCanonicalPath,
  foldBack,
  type SelectionEntries,
  type VersionInfo,
} from "../selection.js";
import { computeVersionRatings } from "../ranking.js";
import { versionStars, SELECT_MIN_DUELS } from "./_shared.js";

// Fallback when nothing qualifies (§4.2 rule 2): the version that predates
// any draft challenge — i.e. has no draftCreatedAt — is the safe default,
// never a fresh untested draft. This is what makes rule 2 safe without
// persisted state: an established post's original file always beats an
// unproven challenger by default, and only a genuinely new directory (a
// single version, necessarily without a draftCreatedAt) reaches this via
// "nothing to compare against". If every version already carries a
// draftCreatedAt (the original was pruned), fall back to the oldest by
// filename — still never the newest, which would be the least tested.
function fallbackIncumbent(versions: VersionInfo[]): VersionInfo | null {
  const published = versions.filter((v) => v.published);
  if (published.length === 0) return null;
  return published.find((v) => !v.draftCreatedAt) ?? published[0];
}

// Highest-rated publishable candidate among `versions` (n ≥ SELECT_MIN_DUELS
// required to compete at all — an untested draft doesn't win on a fluke).
// Ties broken by more duels, then newest file. Null when nobody has enough
// evidence yet — the caller falls back to fallbackIncumbent (§4.2 rule 2).
function pickHighestRated(
  ratings: Map<string, { stars: number; n: number }>,
  versions: VersionInfo[]
): VersionInfo | null {
  const rated = versions.filter((v) => {
    if (!v.published) return false;
    const vs = versionStars(ratings, v);
    return vs != null && vs.n >= SELECT_MIN_DUELS;
  });
  if (rated.length === 0) return null;
  return rated.reduce((best, v) => {
    const bs = versionStars(ratings, best)!;
    const vs = versionStars(ratings, v)!;
    if (vs.stars !== bs.stars) return vs.stars > bs.stars ? v : best;
    if (vs.n !== bs.n) return vs.n > bs.n ? v : best;
    return v.file > best.file ? v : best;
  });
}

// RFC 0010 §4.2/§4.4 (amended 2026-07-01): recompute versions-selected.json
// as a pure function of the version-duel ranking and the version files
// currently on disk — no memory of any prior selection (hysteresis was
// dropped; see revision history). For each directory the highest-rated
// publishable version with n ≥ SELECT_MIN_DUELS wins outright; directories
// with no qualified candidate fall back to fallbackIncumbent — the
// pre-draft original, never an untested fresh draft (fixes a P1 found in
// review: falling back to "newest publishable" would publish every
// draft-worst edit immediately, on zero duels).
// Translation groups (§4.4) advance together only to a revision
// (draftCreatedAt) where EVERY sibling's counterpart is individually
// qualified (n ≥ SELECT_MIN_DUELS) — an untested pair must never win by
// default either. Otherwise each sibling decides alone and hronir:doctor
// reports the group as divergent.
//
// RFC 0015 (single-file model): the decision logic below is identical for
// both layouts — only *how a winner becomes live* differs, decided
// per-slug. A legacy slug still gets a versions-selected.json pointer
// (setResult/writeSelection, unchanged). A flat slug has no pointer to
// write — the winner's content is physically folded into `<slug>.mdx`
// (foldBack) instead. dryRun must stay a true no-op for both, so flat
// winners are only queued, and foldBack only runs after the dryRun check.
export function select({ dryRun = false } = {}) {
  const ratings = computeVersionRatings();

  const dirs = new Map<string, VersionInfo[]>();
  for (const slug of listAllVersionSlugs()) {
    const versions = listSlugVersions(slug);
    if (versions.length > 0) dirs.set(slug, versions);
  }

  // Translation groups (slugs sharing a translationKey). Directories without
  // a key form trivial single-member groups.
  const groups = new Map<string, string[]>();
  for (const [slug, versions] of dirs) {
    const key =
      versions.find((v) => v.translationKey)?.translationKey ??
      `__solo__${slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slug);
  }

  const result: SelectionEntries = {};
  const foldQueue: VersionInfo[] = [];
  const setResult = (slug: string, v: VersionInfo) => {
    if (flatCanonicalPath(slug)) {
      if (!v.selected) foldQueue.push(v);
      return;
    }
    result[slug] = { file: v.file, uuid: v.uuid };
  };

  for (const [, slugs] of groups) {
    const members = slugs.map((s) => ({ slug: s, versions: dirs.get(s)! }));
    let coupled = false;

    if (members.length > 1) {
      // §4.4: revisions with a publishable counterpart in every member.
      const revisionCoverage = new Map<string, number>();
      for (const m of members) {
        const revs = new Set(
          m.versions
            .filter((v) => v.published && v.draftCreatedAt)
            .map((v) => v.draftCreatedAt!)
        );
        for (const r of revs) {
          revisionCoverage.set(r, (revisionCoverage.get(r) ?? 0) + 1);
        }
      }
      const commonRevisions = [...revisionCoverage]
        .filter(([, n]) => n === members.length)
        .map(([r]) => r);

      // A common revision only advances the group when every member's
      // counterpart of it is individually qualified — never on a fresh,
      // untested pair. Among qualifying revisions, prefer the one with the
      // highest worst-case (min across members) rating.
      let best: { rev: string; minStars: number } | null = null;
      for (const rev of commonRevisions) {
        let minStars = Infinity;
        let allQualified = true;
        for (const m of members) {
          const v = m.versions.find(
            (x) => x.published && x.draftCreatedAt === rev
          )!;
          const vs = versionStars(ratings, v);
          if (!vs || vs.n < SELECT_MIN_DUELS) {
            allQualified = false;
            break;
          }
          minStars = Math.min(minStars, vs.stars);
        }
        if (allQualified && (!best || minStars > best.minStars)) {
          best = { rev, minStars };
        }
      }

      if (best) {
        for (const m of members) {
          const v = m.versions.find(
            (x) => x.published && x.draftCreatedAt === best!.rev
          )!;
          setResult(m.slug, v);
          console.log(
            `[select] ${m.slug}: grupo avança para revisão ${best!.rev} (${v.file})`
          );
        }
        coupled = true;
      } else if (commonRevisions.length > 0) {
        console.log(
          `[select] grupo de ${members.map((m) => m.slug).join(", ")}: revisão comum existe mas nenhuma contraparte tem ${SELECT_MIN_DUELS}+ duelos — cada língua decide sozinha`
        );
      }
    }
    if (coupled) continue;

    for (const m of members) {
      const winner =
        pickHighestRated(ratings, m.versions) ?? fallbackIncumbent(m.versions);
      if (winner) setResult(m.slug, winner);
    }
  }

  if (dryRun) {
    console.log("select: dry-run — nada gravado.");
    if (foldQueue.length > 0) {
      console.log(
        `select: dry-run — ${foldQueue.length} slug(s) achatado(s) teriam sido dobrados: ${foldQueue.map((v) => v.slug).join(", ")}.`
      );
    }
    return;
  }
  const wrote = writeSelection(result);
  console.log(
    wrote
      ? `select: seleção atualizada (${Object.keys(result).length} slugs legados) em ${SELECTION_PATH}.`
      : `select: nenhuma mudança na seleção legada — ${SELECTION_PATH} intacto.`
  );
  for (const v of foldQueue) {
    foldBack(v.slug, v);
    console.log(`[select] ${v.slug}: dobrado (${v.file} → canônica)`);
  }
}
