import { rating, rate, ordinal } from "openskill";
import { listMatchFiles, readMatch, postKey } from "./matches.js";

export function computeRatings() {
  // 1. Load matches, filter winner != TODO, resolve effective_winner.
  const raw = [];
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    if (!aKey || !bKey) continue;
    if (winner !== "a" && winner !== "b") continue;

    raw.push({
      runAt: String(data.run_at || data.run_id || ""),
      aKey,
      bKey,
      aPath: data.post_a?.path || "",
      bPath: data.post_b?.path || "",
      winner,
    });
  }

  // 2. Sort by run_at ascending (stable temporal order matters for OpenSkill).
  raw.sort((x, y) => x.runAt.localeCompare(y.runAt));

  // 3. Iterate, maintain Map<key, rating>, update appearances/wins.
  const ratings = new Map();
  const appearances = new Map();
  const wins = new Map();
  const labels = new Map();

  const ensure = (key) => {
    if (!ratings.has(key)) ratings.set(key, rating());
    return ratings.get(key);
  };

  for (const m of raw) {
    const aRating = ensure(m.aKey);
    const bRating = ensure(m.bKey);
    labels.set(m.aKey, m.aPath);
    labels.set(m.bKey, m.bPath);
    appearances.set(m.aKey, (appearances.get(m.aKey) || 0) + 1);
    appearances.set(m.bKey, (appearances.get(m.bKey) || 0) + 1);

    const winnerKey = m.winner === "a" ? m.aKey : m.bKey;
    const loserKey = m.winner === "a" ? m.bKey : m.aKey;
    const winnerRating = ratings.get(winnerKey);
    const loserRating = ratings.get(loserKey);

    const [[newWinner], [newLoser]] = rate([[winnerRating], [loserRating]]);
    ratings.set(winnerKey, newWinner);
    ratings.set(loserKey, newLoser);
    wins.set(winnerKey, (wins.get(winnerKey) || 0) + 1);
  }

  // 4. Build sorted output (ordinal DESC = best first; tie-break alphabetical).
  const out = [];
  for (const [key, r] of ratings) {
    out.push({
      key,
      mu: r.mu,
      sigma: r.sigma,
      ordinal: ordinal(r),
      appearances: appearances.get(key) || 0,
      wins: wins.get(key) || 0,
      path: labels.get(key) || "",
    });
  }
  out.sort((x, y) => y.ordinal - x.ordinal || x.key.localeCompare(y.key));
  return out;
}
