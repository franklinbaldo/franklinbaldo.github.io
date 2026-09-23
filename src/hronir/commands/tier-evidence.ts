import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { loadNormalizedMatches } from "../matches.js";
import {
  getPostUuid,
  getPostUuidFromBlob,
  isPublishedData,
  keyForPath,
  listPosts,
  POSTS_DIR,
  readPost,
  readPostFromBlob,
} from "../posts.js";
import {
  computeAbsoluteQuality,
  computeDeconfoundedQuality,
  computePerPerspectiveRatings,
  computeRatings,
} from "../ranking.js";
import {
  deriveReviewPriority,
  type TierConfidence,
} from "../tier-priority.js";
import { nextStep } from "./_shared.js";

interface TierEvidenceOptions {
  key?: string | null;
  limit?: number;
  sort?: "rank" | "review-priority";
}

interface TierCardProjection {
  confidence: TierConfidence;
  reviewedRevision: string | null;
}

interface CurrentVersionProjection {
  path: string;
  uuid: string;
}

interface VersionAttentionProjection {
  wins: number;
  losses: number;
  lossPerspectives: number;
  attention: boolean;
}

const TIER_DIR = path.join(process.cwd(), "knowledge/blog-post-tiers");

function fixed(value: number | null | undefined): string {
  return value == null ? "-" : value.toFixed(2);
}

function readTierCards(): Map<string, TierCardProjection> {
  const cards = new Map<string, TierCardProjection>();
  if (!fs.existsSync(TIER_DIR)) return cards;

  for (const name of fs.readdirSync(TIER_DIR)) {
    if (!name.endsWith(".md")) continue;
    const { data } = matter(fs.readFileSync(path.join(TIER_DIR, name), "utf8"));
    if (data.type !== "blog-post-tier" || !data.translation_key) continue;
    const confidence =
      data.confidence === "low" ||
      data.confidence === "medium" ||
      data.confidence === "high"
        ? data.confidence
        : null;
    const reviewedRevision =
      typeof data.reviewed_revision === "string" && data.reviewed_revision.trim()
        ? data.reviewed_revision.trim()
        : null;
    cards.set(String(data.translation_key), { confidence, reviewedRevision });
  }

  return cards;
}

/**
 * Current conceptual works that are still publishable from the content tree.
 * Historical Hrönir rate files intentionally survive post deletion, so the
 * ranking can contain keys that are no longer part of the published blog.
 * Editorial tiering must not resurrect those historical competitors.
 */
function readPublishedWorkKeys(): Set<string> {
  const keys = new Set<string>();
  for (const postPath of listPosts()) {
    const data = readPost(postPath);
    if (!isPublishedData(data)) continue;
    keys.add(keyForPath(postPath));
  }
  return keys;
}

/**
 * Flat canonical files have an unambiguous live content UUID without consulting
 * the generated selection manifest. Legacy multi-file directories are skipped
 * conservatively: a stale/missing generated selection must never manufacture
 * version attention or a stale-review signal. As the corpus flattens, more
 * works become eligible for these derived checks automatically.
 */
function readUnambiguousCurrentVersions(): Map<
  string,
  CurrentVersionProjection[]
> {
  const current = new Map<string, CurrentVersionProjection[]>();

  for (const postPath of listPosts()) {
    const data = readPost(postPath);
    if (!isPublishedData(data)) continue;

    const relative = path.relative(POSTS_DIR, postPath);
    if (relative.includes(path.sep)) continue;

    const uuid = getPostUuid(postPath);
    if (!uuid) continue;
    const key = keyForPath(postPath);
    if (!current.has(key)) current.set(key, []);
    current.get(key)!.push({ path: postPath, uuid });
  }

  return current;
}

function toGitPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function historicalFlatKey(
  filePath: string,
  data: Record<string, unknown>,
): string {
  if (data.translationKey) return String(data.translationKey);
  return path.basename(filePath).replace(/\.mdx?$/, "");
}

/**
 * Derive whether a canonical tier review predates a material change to the
 * selected flat content. The comparison uses the same semantic UUID machinery
 * as Hrönir, so lifecycle fields and slug-only moves do not create churn.
 *
 * This deliberately fails open to "unknown" (no map entry) when a current path
 * cannot be resolved at the reviewed revision. That makes renames/moves safe:
 * a path change alone is never enough to call a review stale. A future rename-
 * aware resolver can broaden coverage without changing this conservative
 * contract.
 */
function deriveStaleVersions(
  cards: Map<string, TierCardProjection>,
  currentByKey: Map<string, CurrentVersionProjection[]>,
): Map<string, boolean> {
  const stale = new Map<string, boolean>();

  for (const [key, card] of cards) {
    if (!card.reviewedRevision) continue;
    const current = currentByKey.get(key);
    if (!current?.length) continue;

    let comparable = true;
    let changed = false;

    for (const version of current) {
      let blobSha: string;
      try {
        blobSha = execFileSync(
          "git",
          ["rev-parse", "--verify", `${card.reviewedRevision}:${toGitPath(version.path)}`],
          { stdio: ["ignore", "pipe", "ignore"] },
        )
          .toString()
          .trim();
      } catch {
        comparable = false;
        break;
      }

      try {
        const historicalData = readPostFromBlob(blobSha);
        if (historicalFlatKey(version.path, historicalData) !== key) {
          comparable = false;
          break;
        }
        if (getPostUuidFromBlob(blobSha) !== version.uuid) changed = true;
      } catch {
        comparable = false;
        break;
      }
    }

    if (comparable) stale.set(key, changed);
  }

  return stale;
}

/**
 * A selected/current version needs attention only when an archived challenger
 * beats it repeatedly under at least two distinct perspectives. One loss is a
 * useful observation, not a regression signal. This projection never changes
 * selection; it only raises editorial review priority.
 */
function deriveVersionAttention(
  currentEntries: Map<string, CurrentVersionProjection[]>,
): Map<string, VersionAttentionProjection> {
  const currentByKey = new Map<string, Set<string>>();
  for (const [key, entries] of currentEntries) {
    currentByKey.set(key, new Set(entries.map((entry) => entry.uuid)));
  }

  const mutable = new Map<
    string,
    { wins: number; losses: number; lossPerspectives: Set<string> }
  >();

  for (const key of currentByKey.keys()) {
    mutable.set(key, { wins: 0, losses: 0, lossPerspectives: new Set() });
  }

  for (const match of loadNormalizedMatches()) {
    if (match.kind !== "version") continue;
    const key = match.postA.key;
    const currentVersions = currentByKey.get(key);
    if (!currentVersions) continue;

    const aCurrent =
      match.postA.version != null && currentVersions.has(match.postA.version);
    const bCurrent =
      match.postB.version != null && currentVersions.has(match.postB.version);
    if (aCurrent === bCurrent) continue;

    const selectedSide = aCurrent ? "a" : "b";
    const stats = mutable.get(key)!;
    if (match.winnerSide === selectedSide) {
      stats.wins++;
    } else {
      stats.losses++;
      if (match.perspectiveId) stats.lossPerspectives.add(match.perspectiveId);
    }
  }

  const projected = new Map<string, VersionAttentionProjection>();
  for (const [key, stats] of mutable) {
    const lossPerspectives = stats.lossPerspectives.size;
    projected.set(key, {
      wins: stats.wins,
      losses: stats.losses,
      lossPerspectives,
      attention: stats.losses >= 2 && lossPerspectives >= 2,
    });
  }
  return projected;
}

/**
 * Read-only projection for editorial tiering. Every metric is recomputed from
 * canonical Hrönir evidence, while tier state is read from canonical OKF cards.
 * The review-priority score is triage metadata only and is never persisted.
 */
export function tierEvidence({
  key = null,
  limit = 20,
  sort = "rank",
}: TierEvidenceOptions = {}): void {
  const ratings = computeRatings();
  const absolute = computeAbsoluteQuality();
  const deconfounded = computeDeconfoundedQuality().quality;
  const perPerspective = computePerPerspectiveRatings();
  const tierCards = readTierCards();
  const publishedKeys = readPublishedWorkKeys();
  const currentVersions = readUnambiguousCurrentVersions();
  const staleVersions = deriveStaleVersions(tierCards, currentVersions);
  const versionAttention = deriveVersionAttention(currentVersions);
  const perspectiveUniverse = perPerspective.size;

  const projected = ratings
    .map((row, index) => {
      const abs = absolute.get(row.key);
      const deconf = deconfounded.get(row.key);
      const gap = abs && deconf ? deconf.quality - abs.stars : null;

      const perspectiveRows: Array<{
        id: string;
        rank: number;
        ordinal: number;
        wins: number;
        appearances: number;
      }> = [];

      for (const [id, rows] of perPerspective) {
        const perspectiveIndex = rows.findIndex(
          (candidate) => candidate.key === row.key,
        );
        if (perspectiveIndex < 0) continue;
        const perspectiveRow = rows[perspectiveIndex];
        perspectiveRows.push({
          id,
          rank: perspectiveIndex + 1,
          ordinal: perspectiveRow.ordinal,
          wins: perspectiveRow.wins,
          appearances: perspectiveRow.appearances,
        });
      }

      const card = tierCards.get(row.key);
      const staleVersion = staleVersions.get(row.key);
      const version = versionAttention.get(row.key);
      const ordinalPercentile =
        ratings.length <= 1 ? 0.5 : 1 - index / (ratings.length - 1);
      const priority = deriveReviewPriority({
        tiered: Boolean(card),
        confidence: card?.confidence ?? null,
        appearances: row.appearances,
        absoluteN: abs?.n ?? 0,
        gap,
        perspectiveCount: perspectiveRows.length,
        perspectiveUniverse,
        staleVersion: staleVersion ?? false,
        versionAttention: version?.attention ?? false,
        ordinalPercentile,
        winRate: row.appearances > 0 ? row.wins / row.appearances : null,
        absoluteQuality: abs?.stars ?? null,
        deconfoundedQuality: deconf?.quality ?? null,
      });

      return {
        row,
        rank: index + 1,
        abs,
        deconf,
        gap,
        perspectiveRows,
        top10: perspectiveRows.filter((entry) => entry.rank <= 10).length,
        card,
        staleVersion,
        version,
        priority,
      };
    })
    .filter((entry) => publishedKeys.has(entry.row.key));

  const selected = key
    ? projected.filter((entry) => entry.row.key === key)
    : (sort === "review-priority"
        ? projected.toSorted(
            (a, b) =>
              b.priority.score - a.priority.score ||
              a.rank - b.rank ||
              a.row.key.localeCompare(b.row.key),
          )
        : projected
      ).slice(0, limit);

  if (key && selected.length === 0) {
    throw new Error(`Published Hrönir key not found: ${key}`);
  }

  console.log(
    "rank\tkey\ttiered\tconfidence\tordinal\tmu\tsigma\tW/N\tabs-ewma\tabs-n\tdeconf\tdeconf-n\tgap\tperspectives\ttop10-perspectives\tstale-version\tversion-attention\tselected-version-W/L\tsignal-agreement\treview-priority\tpriority-reasons",
  );

  for (const entry of selected) {
    const { row, card, staleVersion, version, priority, perspectiveRows } = entry;
    console.log(
      [
        entry.rank,
        row.key,
        card ? "yes" : "no",
        card?.confidence ?? "-",
        fixed(row.ordinal),
        fixed(row.mu),
        fixed(row.sigma),
        `${row.wins}/${row.appearances}`,
        fixed(entry.abs?.stars),
        entry.abs?.n ?? 0,
        fixed(entry.deconf?.quality),
        entry.deconf?.n ?? 0,
        fixed(entry.gap),
        perspectiveRows.length,
        entry.top10,
        staleVersion == null ? "-" : staleVersion ? "yes" : "no",
        version ? (version.attention ? "yes" : "no") : "-",
        version ? `${version.wins}/${version.losses}` : "-",
        priority.signalAgreement,
        priority.score,
        priority.reasons.join(","),
      ].join("\t"),
    );

    if (key) {
      for (const perspective of perspectiveRows.toSorted(
        (a, b) => a.rank - b.rank || a.id.localeCompare(b.id),
      )) {
        console.log(
          `  ${perspective.id}\trank=${perspective.rank}\tordinal=${fixed(perspective.ordinal)}\tW/N=${perspective.wins}/${perspective.appearances}`,
        );
      }
      if (staleVersion != null) {
        console.log(
          `  stale-version\t${staleVersion ? "yes" : "no"}\treviewed-revision=${card?.reviewedRevision ?? "-"}`,
        );
      }
      if (version) {
        console.log(
          `  version-attention\t${version.attention ? "yes" : "no"}\tselected-version-W/L=${version.wins}/${version.losses}\tlosing-perspectives=${version.lossPerspectives}`,
        );
      }
    }
  }

  nextStep(
    "nenhum. `tier-evidence` e `review-priority` são projeções somente leitura; decisões editoriais continuam nos cards OKF canônicos.",
  );
}
