// Music-ranking equivalent of src/hronir/ranking.ts's computeRatings —
// same openskill + margin-weighted update, ported (not imported: the text
// version is tightly coupled to matches.ts's file-scanning cache and
// version-duel/deconfounding machinery that doesn't apply here — see
// docs/rfcs/0018-hronir-de-musica.md for what was deliberately dropped).
import { rating, rate, ordinal } from "openskill";
import { loadDuels } from "./duels.js";
import type { RawMatch, RankRow } from "./types.js";

export const MARGIN_W_MIN = 0.1;

function toRawMatches(): RawMatch[] {
  return loadDuels().map((d) => ({
    runAt: d.runAt,
    runId: d.runId,
    aKey: d.aKey,
    bKey: d.bKey,
    winner: d.winner,
    rateA: d.rateA,
    rateB: d.rateB,
  }));
}

function sortMatches(raw: RawMatch[]): RawMatch[] {
  return [...raw].sort((x, y) => {
    const cmp = x.runAt.localeCompare(y.runAt);
    return cmp !== 0 ? cmp : x.runId.localeCompare(y.runId);
  });
}

export function _computeRatings(raw: RawMatch[]): RankRow[] {
  const sorted = sortMatches(raw);

  const ratings = new Map<string, ReturnType<typeof rating>>();
  const appearances = new Map<string, number>();
  const wins = new Map<string, number>();

  const ensure = (key: string) => {
    if (!ratings.has(key)) ratings.set(key, rating());
    return ratings.get(key)!;
  };

  for (const m of sorted) {
    if (m.aKey === m.bKey) continue; // no self-duels in this system, but stay defensive
    ensure(m.aKey);
    ensure(m.bKey);
    appearances.set(m.aKey, (appearances.get(m.aKey) || 0) + 1);
    appearances.set(m.bKey, (appearances.get(m.bKey) || 0) + 1);

    const winnerKey = m.winner === "a" ? m.aKey : m.bKey;
    const loserKey = m.winner === "a" ? m.bKey : m.aKey;
    const winnerRating = ratings.get(winnerKey)!;
    const loserRating = ratings.get(loserKey)!;

    const [[newWinner], [newLoser]] = rate([[winnerRating], [loserRating]]);

    const rateWinner = m.winner === "a" ? m.rateA : m.rateB;
    const rateLoser = m.winner === "a" ? m.rateB : m.rateA;
    const margin = Math.abs(rateWinner - rateLoser) / 4;
    const weight = MARGIN_W_MIN + (1 - MARGIN_W_MIN) * margin;

    ratings.set(winnerKey, {
      mu: winnerRating.mu + weight * (newWinner.mu - winnerRating.mu),
      sigma:
        winnerRating.sigma + weight * (newWinner.sigma - winnerRating.sigma),
    } as ReturnType<typeof rating>);
    ratings.set(loserKey, {
      mu: loserRating.mu + weight * (newLoser.mu - loserRating.mu),
      sigma: loserRating.sigma + weight * (newLoser.sigma - loserRating.sigma),
    } as ReturnType<typeof rating>);
    wins.set(winnerKey, (wins.get(winnerKey) || 0) + 1);
  }

  const out: RankRow[] = [];
  for (const [key, r] of ratings) {
    out.push({
      key,
      mu: r.mu,
      sigma: r.sigma,
      ordinal: ordinal(r),
      appearances: appearances.get(key) || 0,
      wins: wins.get(key) || 0,
    });
  }
  out.sort((x, y) => y.ordinal - x.ordinal || x.key.localeCompare(y.key));
  return out;
}

export function computeRatings(): RankRow[] {
  return _computeRatings(toRawMatches());
}

/** appearances-only lookup, cheap enough to recompute per pairing call
 *  without threading a shared cache through pairing.ts. */
export function appearanceCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of computeRatings()) counts.set(r.key, r.appearances);
  return counts;
}
