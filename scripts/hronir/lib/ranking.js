import { rating, rate, ordinal } from "openskill";
import { listMatchFiles, readMatch, postKey } from "./matches.js";

export const MIN_APPEARANCES = 3;
export const RANKING_MODEL_VERSION = 2;
export const EWMA_ALPHA = 0.3;
export const MARGIN_W_MIN = 0.1;
// Ridge (L2) penalty for the de-confounding least-squares solve. Shrinks
// factor effects toward 0, guarantees the normal-equations matrix is
// invertible even when a factor level is sparse, and gently regularizes
// thin evidence. Tunable; ~1.0 means a post seen 3× is shrunk ~25%.
export const DECONFOUND_RIDGE = 1.0;

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
      agentId: data.agent_id ? String(data.agent_id) : null,
      perspectiveId: data.perspective_id ? String(data.perspective_id) : null,
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
    // RFC 0003: version duels (same essay key, different content version) feed
    // only the per-version track (computeVersionRatings), never the per-essay
    // OpenSkill — a team can't play itself.
    if (m.aKey === m.bKey) continue;
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
// Edit detection: when a SPECIFIC language file's content version changes
// between matches (a real edit), the post's pre-edit ratings are stale and
// the EWMA resets. Tracking is keyed by `path` (the language file), NOT by
// `key` (the translationKey): a key is shared across translations and the
// match generator picks a language variant at random per match, so keying the
// reset on `key` would fire on every EN↔PT alternation and wipe the EWMA for
// multilingual posts (n would rarely reach MIN_APPEARANCES).
export function _computeAbsoluteQuality(raw) {
  const sorted = _sortMatchData(raw);

  const ewma = new Map(); // key → current EWMA value
  const count = new Map(); // key → number of rated appearances (post-last-edit)
  const sum = new Map(); // key → sum of raw star values (for rawStars)
  const lastVersionByPath = new Map(); // path → last-seen content version

  const resetIfEdited = (key, path, version) => {
    if (version === null || !path) return;
    const prev = lastVersionByPath.get(path);
    if (prev !== undefined && prev !== version) {
      ewma.delete(key);
      count.delete(key);
      sum.delete(key);
    }
    lastVersionByPath.set(path, version);
  };

  const applyRating = (key, rate) => {
    if (rate === null) return;
    ewma.set(
      key,
      ewma.has(key)
        ? EWMA_ALPHA * rate + (1 - EWMA_ALPHA) * ewma.get(key)
        : rate
    );
    count.set(key, (count.get(key) || 0) + 1);
    sum.set(key, (sum.get(key) || 0) + rate);
  };

  for (const m of sorted) {
    if (m.aKey === m.bKey) continue; // RFC 0003: version duels skip the per-essay track
    resetIfEdited(m.aKey, m.aPath, m.aVersion);
    resetIfEdited(m.bKey, m.bPath, m.bVersion);
    applyRating(m.aKey, m.rateA);
    applyRating(m.bKey, m.rateB);
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

// RFC 0003: per-version quality from version duels (matches where both sides
// share the essay key but differ in content version). EWMA of the stars each
// version received, keyed by the content-version UUID. Decides which version
// to promote to canonical.
export function _computeVersionRatings(raw) {
  const sorted = _sortMatchData(raw);
  const ewma = new Map(); // version-uuid → EWMA stars
  const count = new Map(); // version-uuid → number of duels rated
  const meta = new Map(); // version-uuid → { key, path }
  const apply = (version, key, path, rate) => {
    if (!version || rate === null) return;
    ewma.set(
      version,
      ewma.has(version)
        ? EWMA_ALPHA * rate + (1 - EWMA_ALPHA) * ewma.get(version)
        : rate
    );
    count.set(version, (count.get(version) || 0) + 1);
    meta.set(version, { key, path });
  };
  for (const m of sorted) {
    if (m.aKey !== m.bKey) continue; // only version duels
    apply(m.aVersion, m.aKey, m.aPath, m.rateA);
    apply(m.bVersion, m.bKey, m.bPath, m.rateB);
  }
  const result = new Map();
  for (const [version, stars] of ewma) {
    const { key, path } = meta.get(version) || {};
    result.set(version, { stars, n: count.get(version) || 0, key, path });
  }
  return result;
}

export function computeVersionRatings() {
  return _computeVersionRatings(_loadMatchData());
}

// Solve a symmetric positive-definite linear system A·x = b by Gaussian
// elimination with partial pivoting. A is an array of rows (each an array);
// b is a flat array. Returns x. A and b are mutated in place. The ridge
// penalty added by the caller guarantees A is non-singular, but a tiny pivot
// epsilon guards against degenerate columns just in case.
export function _solveLinear(A, b) {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    // Partial pivot: find the row with the largest |value| in this column.
    let pivot = col;
    let best = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col]);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }
    if (pivot !== col) {
      [A[col], A[pivot]] = [A[pivot], A[col]];
      [b[col], b[pivot]] = [b[pivot], b[col]];
    }
    const diag = A[col][col] || 1e-9;
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / diag;
      if (factor === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= factor * A[col][c];
      b[r] -= factor * b[col];
    }
  }
  // Back-substitution.
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let s = b[row];
    for (let c = row + 1; c < n; c++) s -= A[row][c] * x[c];
    x[row] = s / (A[row][row] || 1e-9);
  }
  return x;
}

// Pure function: de-confound absolute quality with a ridge least-squares model.
// Each rated side of each clash is one observation:
//     rate = μ + q[post] + α[agent] + π[perspective] + ε
// Estimated by minimizing Σε² + λ(Σq² + Σα² + Σπ²) — the intercept μ is
// unpenalized, so it absorbs the grand mean while factor effects shrink
// toward 0 (and stay identifiable despite the dummy/intercept collinearity).
//
// Returns {
//   quality: Map<key, { quality: μ+q, qDev: q, n }>,   // de-confounded level
//   agentBias: Map<agentId, bias>,                       // α (rates high/low)
//   perspectiveBias: Map<perspectiveId, bias>,           // π (harsh/generous)
//   intercept: μ,
// }
// Posts whose rate is null (old schema) contribute no observation.
export function _computeDeconfoundedQuality(raw, ridge = DECONFOUND_RIDGE) {
  // Collect observations and assign dense indices per factor level.
  const postIdx = new Map();
  const agentIdx = new Map();
  const perspIdx = new Map();
  const idxFor = (map, keyName) => {
    if (keyName == null) return -1;
    if (!map.has(keyName)) map.set(keyName, map.size);
    return map.get(keyName);
  };

  const obs = []; // { y, post, agent, persp }  (indices; -1 = absent)
  const postN = new Map();
  for (const m of raw) {
    const add = (key, rate, path) => {
      if (rate === null || !key) return;
      const pi = idxFor(postIdx, key);
      obs.push({
        y: rate,
        post: pi,
        agent: idxFor(agentIdx, m.agentId),
        persp: idxFor(perspIdx, m.perspectiveId),
      });
      postN.set(key, (postN.get(key) || 0) + 1);
    };
    add(m.aKey, m.rateA, m.aPath);
    add(m.bKey, m.rateB, m.bPath);
  }

  const empty = {
    quality: new Map(),
    agentBias: new Map(),
    perspectiveBias: new Map(),
    intercept: 0,
  };
  if (obs.length === 0) return empty;

  const P = postIdx.size;
  const A = agentIdx.size;
  const K = perspIdx.size;
  // Parameter layout: [μ, q_0..q_{P-1}, α_0..α_{A-1}, π_0..π_{K-1}]
  const nParams = 1 + P + A + K;
  const qOff = 1;
  const aOff = 1 + P;
  const pOff = 1 + P + A;

  // Build normal equations XᵀX (with ridge on the diagonal) and Xᵀy directly,
  // without materializing the (obs × nParams) design matrix.
  const XtX = Array.from({ length: nParams }, () => new Array(nParams).fill(0));
  const Xty = new Array(nParams).fill(0);

  for (const o of obs) {
    const cols = [0, qOff + o.post];
    if (o.agent >= 0) cols.push(aOff + o.agent);
    if (o.persp >= 0) cols.push(pOff + o.persp);
    for (const c1 of cols) {
      Xty[c1] += o.y;
      for (const c2 of cols) XtX[c1][c2] += 1;
    }
  }
  // Ridge: penalize every coefficient except the intercept (column 0).
  for (let c = 1; c < nParams; c++) XtX[c][c] += ridge;

  const beta = _solveLinear(XtX, Xty);

  const intercept = beta[0];
  const quality = new Map();
  for (const [key, i] of postIdx) {
    const qDev = beta[qOff + i];
    quality.set(key, {
      quality: intercept + qDev,
      qDev,
      n: postN.get(key) || 0,
    });
  }
  const agentBias = new Map();
  for (const [id, i] of agentIdx) agentBias.set(id, beta[aOff + i]);
  const perspectiveBias = new Map();
  for (const [id, i] of perspIdx) perspectiveBias.set(id, beta[pOff + i]);

  return { quality, agentBias, perspectiveBias, intercept };
}

export function computeDeconfoundedQuality(ridge = DECONFOUND_RIDGE) {
  return _computeDeconfoundedQuality(_loadMatchData(), ridge);
}

// Pure function: per-(perspective, post) EWMA of stars. Mirrors
// _computeAbsoluteQuality but buckets observations by perspective_id, so each
// perspective gets its own absolute track. Same path-keyed reset-on-edit.
// Returns Map<perspectiveId, Map<key, { stars, n, rawStars }>>.
export function _computePerPerspectiveQuality(raw) {
  const sorted = _sortMatchData(raw);
  const byPersp = new Map(); // perspId → { ewma, count, sum, lastVersionByPath }

  const bucket = (perspId) => {
    if (!byPersp.has(perspId)) {
      byPersp.set(perspId, {
        ewma: new Map(),
        count: new Map(),
        sum: new Map(),
        lastVersionByPath: new Map(),
      });
    }
    return byPersp.get(perspId);
  };

  for (const m of sorted) {
    if (!m.perspectiveId) continue;
    const b = bucket(m.perspectiveId);

    const resetIfEdited = (key, path, version) => {
      if (version === null || !path) return;
      const prev = b.lastVersionByPath.get(path);
      if (prev !== undefined && prev !== version) {
        b.ewma.delete(key);
        b.count.delete(key);
        b.sum.delete(key);
      }
      b.lastVersionByPath.set(path, version);
    };
    const applyRating = (key, rate) => {
      if (rate === null) return;
      b.ewma.set(
        key,
        b.ewma.has(key)
          ? EWMA_ALPHA * rate + (1 - EWMA_ALPHA) * b.ewma.get(key)
          : rate
      );
      b.count.set(key, (b.count.get(key) || 0) + 1);
      b.sum.set(key, (b.sum.get(key) || 0) + rate);
    };

    resetIfEdited(m.aKey, m.aPath, m.aVersion);
    resetIfEdited(m.bKey, m.bPath, m.bVersion);
    applyRating(m.aKey, m.rateA);
    applyRating(m.bKey, m.rateB);
  }

  const result = new Map();
  for (const [perspId, b] of byPersp) {
    const inner = new Map();
    for (const [key, stars] of b.ewma) {
      const n = b.count.get(key) || 0;
      const rawStars = n > 0 ? (b.sum.get(key) || 0) / n : 0;
      inner.set(key, { stars, n, rawStars });
    }
    result.set(perspId, inner);
  }
  return result;
}

export function computePerPerspectiveQuality() {
  return _computePerPerspectiveQuality(_loadMatchData());
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
