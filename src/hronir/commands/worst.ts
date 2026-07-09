import {
  computeRatings,
  computeAbsoluteQuality,
  MIN_APPEARANCES,
} from "../ranking.js";

interface WorstOptions {
  absolute?: boolean;
  full?: boolean;
}

export function worst(options: WorstOptions = {}) {
  if (options.absolute) {
    // Absolute mode: lowest stars EWMA among posts with n >= MIN_APPEARANCES
    const quality = computeAbsoluteQuality();
    const eligible = [...quality.entries()].filter(
      ([, q]) => q.n >= MIN_APPEARANCES
    );
    if (eligible.length === 0) {
      console.error(
        `Sem posts com n >= ${MIN_APPEARANCES} aparições avaliadas.`
      );
      process.exit(1);
    }
    // Sort by stars ascending (worst first)
    eligible.sort(
      (a, b) => a[1].stars - b[1].stars || a[0].localeCompare(b[0])
    );
    const [key, q] = eligible[0];
    console.log(key);
    console.error(
      `(stars: ${q.stars.toFixed(3)}, n: ${q.n}, rawStars: ${q.rawStars.toFixed(3)})`
    );
    return;
  }

  // Default mode: lowest ordinal among posts with appearances >= MIN_APPEARANCES
  const rows = computeRatings();
  const eligible = rows.filter((r) => r.appearances >= MIN_APPEARANCES);
  if (eligible.length === 0) {
    console.error(`Sem posts com appearances >= ${MIN_APPEARANCES}.`);
    process.exit(1);
  }
  const w = eligible[eligible.length - 1];
  console.log(w.key);
  console.error(
    `(path: ${w.path}, wins: ${w.wins}/${w.appearances}, ordinal: ${w.ordinal.toFixed(3)}, mu: ${w.mu.toFixed(3)}, sigma: ${w.sigma.toFixed(3)})`
  );
}
