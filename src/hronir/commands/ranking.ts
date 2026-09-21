import {
  computeRatings,
  computeAbsoluteQuality,
  MIN_APPEARANCES,
} from "../ranking.js";
import { nextStep } from "./_shared.js";

function fmt(n: number, w = 6) {
  return n.toFixed(3).padStart(w);
}

export function ranking() {
  const rows = computeRatings();
  const quality = computeAbsoluteQuality();

  // Compute divergence: only for posts with n >= MIN_APPEARANCES in quality map.
  // p = 1 - rank/(N-1) where rank is 0-based position in eligible-subset ordering.
  const eligible = rows.filter((r) => {
    const q = quality.get(r.key);
    return q && q.n >= MIN_APPEARANCES;
  });
  const N = eligible.length;

  // ordinal rank within eligible (rows is already sorted ordinal DESC)
  const ordinalRankMap = new Map();
  for (let i = 0; i < eligible.length; i++) {
    ordinalRankMap.set(eligible[i].key, i);
  }

  // stars rank within eligible (sort stars DESC, lower index = better = lower rank)
  const byStars = [...eligible].sort((a, b) => {
    const qa = quality.get(a.key);
    const qb = quality.get(b.key);
    return (qb?.stars ?? 0) - (qa?.stars ?? 0) || a.key.localeCompare(b.key);
  });
  const starsRankMap = new Map();
  for (let i = 0; i < byStars.length; i++) {
    starsRankMap.set(byStars[i].key, i);
  }

  console.log(`rank\tkey\tordinal\tmu\tsigma\tW/N\tstars\tn\tdiv`);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const q = quality.get(r.key);

    const starsStr = q ? q.stars.toFixed(2) : "-";
    const nStr = q ? String(q.n) : "0";

    let divStr = "-";
    if (q && q.n >= MIN_APPEARANCES && N > 1) {
      const ordRank = ordinalRankMap.get(r.key);
      const starRank = starsRankMap.get(r.key);
      const pOrd = 1 - ordRank / (N - 1);
      const pStar = 1 - starRank / (N - 1);
      const div = pOrd - pStar;
      divStr = (div >= 0 ? "+" : "") + div.toFixed(2);
    }

    console.log(
      `${i + 1}\t${r.key}\t${fmt(r.ordinal)}\t${fmt(r.mu)}\t${fmt(r.sigma)}\t${r.wins}/${r.appearances}\t${starsStr}\t${nStr}\t${divStr}`
    );
  }
  nextStep(
    "Rode `npm run hronir:draft-worst` para iniciar a edição do pior ranqueado."
  );
}
