import { rating, rate, ordinal } from "openskill";
import { listMatchFiles, readMatch, postKey } from "./matches.js";

export const MIN_APPEARANCES = 3;
export const RANKING_MODEL_VERSION = 2;
export const EWMA_ALPHA = 0.3;
export const MARGIN_W_MIN = 0.1;

// Internal: load and normalize all match data from disk.
// Returns raw match objects with rateA/rateB fields (null for old schema).
function _loadMatchData() {
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
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);

    // Rates: null for old schema (passion-v1), numeric for stars-v1+
    const rateA =
      typeof data.rate_a === "number" && Number.isFinite(data.rate_a)
        ? data.rate_a
        : null;
    const rateB =
      typeof data.rate_b === "number" && Number.isFinite(data.rate_b)
        ? data.rate_b
        : null;

    raw.push({
      runAt,
      matchIndex: Number.isFinite(data.match_index) ? data.match_index : 0,
      filename: f,
      aKey,
      bKey,
      aPath: data.post_a?.path || "",
      bPath: data.post_b?.path || "",
      aVersion: data.post_a?.version ?? null,
      bVersion: data.post_b?.version ?? null,
      winner,
      rateA,
      rateB,
    });
  }
  return raw;
}

// Internal: deterministic sort of raw match data.
// Sort by run_at ascending (OpenSkill is order-sensitive); within a run
// (same run_at) break ties by match_index then filename so different
// environments produce identical ratings for identical data.
function _sortMatchData(raw) {
  return [...raw].sort((x, y) => {
    const cmp = x.runAt.localeCompare(y.runAt);
    if (cmp !== 0) return cmp;
    if (x.matchIndex !== y.matchIndex) return x.matchIndex - y.matchIndex;
    return x.filename.localeCompare(y.filename);
  });
}

// Pure function: takes pre-normalized match data array, returns sorted ranking array.
// This is where Phase 2 margin-aware scaling is applied.
export function _computeRatings(raw) {
  const sorted = _sortMatchData(raw);

  // Iterate, maintain Map<key, rating>, update appearances/wins.
  const ratings = new Map();
  const appearances = new Map();
  const wins = new Map();
  const labels = new Map();

  const ensure = (key) => {
    if (!ratings.has(key)) ratings.set(key, rating());
    return ratings.get(key);
  };

  for (const m of sorted) {
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

    // Phase 2: Scale mu delta by normalized margin.
    // Falls back to weight=1.0 when rates absent (old schema = identical to v1).
    const rateWinner = m.winner === "a" ? m.rateA : m.rateB;
    const rateLoser = m.winner === "a" ? m.rateB : m.rateA;
    let weight = 1.0;
    if (rateWinner !== null && rateLoser !== null) {
      const margin = Math.abs(rateWinner - rateLoser) / 4; // ∈ [0.0025, 1]
      weight = MARGIN_W_MIN + (1 - MARGIN_W_MIN) * margin;
    }

    ratings.set(
      winnerKey,
      rating({
        mu: winnerRating.mu + weight * (newWinner.mu - winnerRating.mu),
        sigma: newWinner.sigma,
      })
    );
    ratings.set(
      loserKey,
      rating({
        mu: loserRating.mu + weight * (newLoser.mu - loserRating.mu),
        sigma: newLoser.sigma,
      })
    );
    wins.set(winnerKey, (wins.get(winnerKey) || 0) + 1);
  }

  // Build sorted output (ordinal DESC = best first; tie-break alphabetical).
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

export function computeRatings() {
  return _computeRatings(_loadMatchData());
}

// Pure function: compute EWMA-based absolute quality map from raw match data.
// Returns Map<key, { stars: ewmaValue, n: ratedCount, rawStars: simpleAvg }>
// Only posts that appear in at least one rated match are included.
// Edit detection: when post_a.version / post_b.version changes between
// consecutive matches, the post was edited — pre-edit ratings are stale
// and the EWMA resets to the first post-edit observation.
export function _computeAbsoluteQuality(raw) {
  const sorted = _sortMatchData(raw);

  const ewma = new Map(); // key → current EWMA value
  const count = new Map(); // key → number of rated appearances (post-last-edit)
  const sum = new Map(); // key → sum of raw star values (for rawStars)
  const lastVersion = new Map(); // key → version string from last match

  const resetIfEdited = (key, version) => {
    if (version === null) return;
    const prev = lastVersion.get(key);
    if (prev !== undefined && prev !== version) {
      ewma.delete(key);
      count.delete(key);
      sum.delete(key);
    }
    lastVersion.set(key, version);
  };

  for (const m of sorted) {
    resetIfEdited(m.aKey, m.aVersion);
    resetIfEdited(m.bKey, m.bVersion);

    // Update post A if rated
    if (m.rateA !== null) {
      const key = m.aKey;
      if (!ewma.has(key)) {
        ewma.set(key, m.rateA);
      } else {
        ewma.set(key, EWMA_ALPHA * m.rateA + (1 - EWMA_ALPHA) * ewma.get(key));
      }
      count.set(key, (count.get(key) || 0) + 1);
      sum.set(key, (sum.get(key) || 0) + m.rateA);
    }

    // Update post B if rated
    if (m.rateB !== null) {
      const key = m.bKey;
      if (!ewma.has(key)) {
        ewma.set(key, m.rateB);
      } else {
        ewma.set(key, EWMA_ALPHA * m.rateB + (1 - EWMA_ALPHA) * ewma.get(key));
      }
      count.set(key, (count.get(key) || 0) + 1);
      sum.set(key, (sum.get(key) || 0) + m.rateB);
    }
  }

  const result = new Map();
  for (const [key, stars] of ewma) {
    const n = count.get(key) || 0;
    const rawStars = n > 0 ? (sum.get(key) || 0) / n : 0;
    result.set(key, { stars, n, rawStars });
  }
  return result;
}

export function computeAbsoluteQuality() {
  return _computeAbsoluteQuality(_loadMatchData());
}

// Returns a Map<perspectiveId, Array<{key, ordinal, appearances, wins}>>
// Each array is sorted ordinal DESC (best first), containing only posts that
// appeared in at least one duel under that perspective.
export function computePerPerspectiveRatings() {
  const byPerspective = new Map(); // perspectiveId → Array<match>

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    if (!aKey || !bKey) continue;
    if (winner !== "a" && winner !== "b") continue;

    const perspId = data.perspective_id ? String(data.perspective_id) : null;
    if (!perspId) continue;

    const rawRunAt = data.run_at ?? data.run_id ?? "";
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);

    if (!byPerspective.has(perspId)) byPerspective.set(perspId, []);
    byPerspective.get(perspId).push({ runAt, aKey, bKey, winner });
  }

  const result = new Map();

  for (const [perspId, matches] of byPerspective) {
    matches.sort((x, y) => x.runAt.localeCompare(y.runAt));

    const ratings = new Map();
    const appearances = new Map();
    const wins = new Map();

    const ensure = (key) => {
      if (!ratings.has(key)) ratings.set(key, rating());
      return ratings.get(key);
    };

    for (const m of matches) {
      const aRating = ensure(m.aKey);
      const bRating = ensure(m.bKey);
      appearances.set(m.aKey, (appearances.get(m.aKey) || 0) + 1);
      appearances.set(m.bKey, (appearances.get(m.bKey) || 0) + 1);

      const winnerKey = m.winner === "a" ? m.aKey : m.bKey;
      const loserKey = m.winner === "a" ? m.bKey : m.aKey;
      const [[newWinner], [newLoser]] = rate([
        [ratings.get(winnerKey)],
        [ratings.get(loserKey)],
      ]);
      ratings.set(winnerKey, newWinner);
      ratings.set(loserKey, newLoser);
      wins.set(winnerKey, (wins.get(winnerKey) || 0) + 1);
    }

    const out = [];
    for (const [key, r] of ratings) {
      out.push({
        key,
        ordinal: ordinal(r),
        appearances: appearances.get(key) || 0,
        wins: wins.get(key) || 0,
      });
    }
    out.sort((x, y) => y.ordinal - x.ordinal || x.key.localeCompare(y.key));
    result.set(perspId, out);
  }

  return result;
}

// Returns a Set<string> of post keys that lead at least one perspective
// ranking (with >= minAppearances duels in that perspective). These posts
// are "protected" and should be excluded from new match generation.
export function getProtectedPosts(minAppearances = 2) {
  const perPerspective = computePerPerspectiveRatings();
  const protected_ = new Set();
  for (const [, rows] of perPerspective) {
    if (rows.length === 0) continue;
    const top = rows[0];
    if (top.appearances >= minAppearances) {
      protected_.add(top.key);
    }
  }
  return protected_;
}
