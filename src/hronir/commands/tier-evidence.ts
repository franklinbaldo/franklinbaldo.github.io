import {
  computeAbsoluteQuality,
  computeDeconfoundedQuality,
  computePerPerspectiveRatings,
  computeRatings,
} from "../ranking.js";
import { nextStep } from "./_shared.js";

interface TierEvidenceOptions {
  key?: string | null;
  limit?: number;
}

function fixed(value: number | null | undefined): string {
  return value == null ? "-" : value.toFixed(2);
}

/**
 * Read-only projection for editorial tiering. Every value is recomputed from
 * canonical Hrönir rate files; this command deliberately persists nothing.
 */
export function tierEvidence({
  key = null,
  limit = 20,
}: TierEvidenceOptions = {}): void {
  const ratings = computeRatings();
  const absolute = computeAbsoluteQuality();
  const deconfounded = computeDeconfoundedQuality().quality;
  const perPerspective = computePerPerspectiveRatings();

  const selected = key
    ? ratings.filter((row) => row.key === key)
    : ratings.slice(0, limit);

  if (key && selected.length === 0) {
    throw new Error(`Hrönir key not found: ${key}`);
  }

  console.log(
    "rank\tkey\tordinal\tmu\tsigma\tW/N\tabs-ewma\tabs-n\tdeconf\tdeconf-n\tgap\tperspectives\ttop10-perspectives"
  );

  for (const row of selected) {
    const rank = ratings.findIndex((candidate) => candidate.key === row.key) + 1;
    const abs = absolute.get(row.key);
    const deconf = deconfounded.get(row.key);
    const gap =
      abs && deconf ? deconf.quality - abs.stars : null;

    const perspectiveRows: Array<{
      id: string;
      rank: number;
      ordinal: number;
      wins: number;
      appearances: number;
    }> = [];

    for (const [id, rows] of perPerspective) {
      const index = rows.findIndex((candidate) => candidate.key === row.key);
      if (index < 0) continue;
      const perspectiveRow = rows[index];
      perspectiveRows.push({
        id,
        rank: index + 1,
        ordinal: perspectiveRow.ordinal,
        wins: perspectiveRow.wins,
        appearances: perspectiveRow.appearances,
      });
    }

    const top10 = perspectiveRows.filter((entry) => entry.rank <= 10).length;
    console.log(
      [
        rank,
        row.key,
        fixed(row.ordinal),
        fixed(row.mu),
        fixed(row.sigma),
        `${row.wins}/${row.appearances}`,
        fixed(abs?.stars),
        abs?.n ?? 0,
        fixed(deconf?.quality),
        deconf?.n ?? 0,
        fixed(gap),
        perspectiveRows.length,
        top10,
      ].join("\t")
    );

    if (key) {
      for (const perspective of perspectiveRows.sort(
        (a, b) => a.rank - b.rank || a.id.localeCompare(b.id)
      )) {
        console.log(
          `  ${perspective.id}\trank=${perspective.rank}\tordinal=${fixed(perspective.ordinal)}\tW/N=${perspective.wins}/${perspective.appearances}`
        );
      }
    }
  }

  nextStep(
    "nenhum. `tier-evidence` é somente leitura; decisões editoriais continuam nos cards OKF canônicos."
  );
}
