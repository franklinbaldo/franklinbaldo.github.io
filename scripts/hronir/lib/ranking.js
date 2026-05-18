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

    // Normalize run_at: gray-matter parses unquoted ISO timestamps into Date
    // objects, and String(Date) returns locale text ("Mon May 18 ...") that
    // does NOT sort chronologically via localeCompare. Coerce Dates to ISO.
    const rawRunAt = data.run_at ?? data.run_id ?? "";
    const runAt = rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);

    raw.push({
      runAt,
      matchIndex: Number.isFinite(data.match_index) ? data.match_index : 0,
      filename: f,
      aKey,
      bKey,
      aPath: data.post_a?.path || "",
      bPath: data.post_b?.path || "",
      winner,
    });
  }

  // 2. Sort by run_at ascending (OpenSkill is order-sensitive); within a run
  //    (same run_at) break ties by match_index then filename so different
  //    environments produce identical ratings for identical data.
  raw.sort((x, y) => {
    const cmp = x.runAt.localeCompare(y.runAt);
    if (cmp !== 0) return cmp;
    if (x.matchIndex !== y.matchIndex) return x.matchIndex - y.matchIndex;
    return x.filename.localeCompare(y.filename);
  });

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
    if (m.aPath) labels.set(m.aKey, m.aPath);
    if (m.bPath) labels.set(m.bKey, m.bPath);
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
