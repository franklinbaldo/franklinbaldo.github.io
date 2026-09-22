import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  isPublishedData,
  keyForPath,
  listPosts,
  readPost,
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
    cards.set(String(data.translation_key), { confidence });
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
      const priority = deriveReviewPriority({
        tiered: Boolean(card),
        confidence: card?.confidence ?? null,
        appearances: row.appearances,
        absoluteN: abs?.n ?? 0,
        gap,
        perspectiveCount: perspectiveRows.length,
        perspectiveUniverse,
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
    "rank\tkey\ttiered\tconfidence\tordinal\tmu\tsigma\tW/N\tabs-ewma\tabs-n\tdeconf\tdeconf-n\tgap\tperspectives\ttop10-perspectives\tsignal-agreement\treview-priority\tpriority-reasons",
  );

  for (const entry of selected) {
    const { row, card, priority, perspectiveRows } = entry;
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
    }
  }

  nextStep(
    "nenhum. `tier-evidence` e `review-priority` são projeções somente leitura; decisões editoriais continuam nos cards OKF canônicos.",
  );
}
