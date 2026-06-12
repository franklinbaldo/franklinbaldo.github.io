import { rating, rate, ordinal } from "openskill";
import {
  listMatchFiles,
  readMatch,
  postKey,
  matchesDataVersion,
} from "./matches.js";
import type { RankRow, PerspectiveRankRow } from "./types.js";

export const MIN_APPEARANCES = 3;
export const RANKING_MODEL_VERSION = 3;
export const EWMA_ALPHA = 0.3;
export const MARGIN_W_MIN = 0.1;
// Ridge (L2) penalty for the de-confounding least-squares solve. Shrinks
// factor effects toward 0, guarantees the normal-equations matrix is
// invertible even when a factor level is sparse, and gently regularizes
// thin evidence. Tunable; ~1.0 means a post seen 3× is shrunk ~25%.
export const DECONFOUND_RIDGE = 1.0;

interface RawMatch {
  runAt: string;
  filename: string;
  aKey: string;
  bKey: string;
  aPath: string;
  bPath: string;
  aVersion: string | null;
  bVersion: string | null;
  agentId: string | null;
  perspectiveId: string | null;
  winner: "a" | "b";
  rateA: number | null;
  rateB: number | null;
}

// RFC 0010 §4.7 (E1): one pass over the rate files per command, not one per
// compute*. Memoized against matchesDataVersion so a writeMatch in the same
// process (decide, migrate) invalidates the snapshot.
let _rawCache: { version: number; raw: RawMatch[] } | null = null;

function _loadMatchData(): RawMatch[] {
  const version = matchesDataVersion();
  if (_rawCache && _rawCache.version === version) return _rawCache.raw;
  const raw: RawMatch[] = [];
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    let winner = data.winner as string;
    if (data.override && data.override !== "null")
      winner = data.override as string;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a as { key?: string; slug?: string } | null);
    const bKey = postKey(data.post_b as { key?: string; slug?: string } | null);
    if (!aKey || !bKey) continue;
    if (winner !== "a" && winner !== "b") continue;

    const rawRunAt = (data.run_at ?? data.run_id ?? "") as string | Date;
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);

    const rateA =
      typeof data.rate_a === "number" && Number.isFinite(data.rate_a)
        ? (data.rate_a as number)
        : null;
    const rateB =
      typeof data.rate_b === "number" && Number.isFinite(data.rate_b)
        ? (data.rate_b as number)
        : null;

    const postA = data.post_a as Record<string, unknown> | null;
    const postB = data.post_b as Record<string, unknown> | null;

    raw.push({
      runAt,
      filename: f,
      aKey,
      bKey,
      aPath: (postA?.path as string) || "",
      bPath: (postB?.path as string) || "",
      aVersion: (postA?.version as string) ?? null,
      bVersion: (postB?.version as string) ?? null,
      agentId: data.agent_id ? String(data.agent_id) : null,
      perspectiveId: data.perspective_id ? String(data.perspective_id) : null,
      winner: winner as "a" | "b",
      rateA,
      rateB,
    });
  }
  _rawCache = { version, raw };
  return raw;
}

function _sortMatchData(raw: RawMatch[]): RawMatch[] {
  return [...raw].sort((x, y) => {
    const cmp = x.runAt.localeCompare(y.runAt);
    if (cmp !== 0) return cmp;
    return x.filename.localeCompare(y.filename);
  });
}

// Stable per-post identity for edit detection: peers of the same post live in
// the same directory (RFC 0010), so strip the version filename. Legacy flat
// paths (pre-folder layout) and legacy index.* paths normalize to the same
// id as their migrated v-* successors' directory, keeping continuity across
// the migration. A UUID change under the same id means the content the key
// is being judged on changed — selection swap or in-place edit alike.
function versionTrackId(pathStr: string): string {
  return pathStr.replace(/\/(?:index|v-[^/]+)\.mdx?$/, "");
}

export function _computeRatings(raw: RawMatch[]): RankRow[] {
  const sorted = _sortMatchData(raw);

  const ratings = new Map<string, ReturnType<typeof rating>>();
  const appearances = new Map<string, number>();
  const wins = new Map<string, number>();
  const labels = new Map<string, string>();

  const ensure = (key: string) => {
    if (!ratings.has(key)) ratings.set(key, rating());
    return ratings.get(key)!;
  };

  for (const m of sorted) {
    if (m.aKey === m.bKey) continue;
    const aRating = ensure(m.aKey);
    const bRating = ensure(m.bKey);
    if (m.aPath) labels.set(m.aKey, m.aPath);
    if (m.bPath) labels.set(m.bKey, m.bPath);
    appearances.set(m.aKey, (appearances.get(m.aKey) || 0) + 1);
    appearances.set(m.bKey, (appearances.get(m.bKey) || 0) + 1);

    const winnerKey = m.winner === "a" ? m.aKey : m.bKey;
    const loserKey = m.winner === "a" ? m.bKey : m.aKey;
    const winnerRating = ratings.get(winnerKey)!;
    const loserRating = ratings.get(loserKey)!;

    const [[newWinner], [newLoser]] = rate([[winnerRating], [loserRating]]);

    const rateWinner = m.winner === "a" ? m.rateA : m.rateB;
    const rateLoser = m.winner === "a" ? m.rateB : m.rateA;
    let weight = 1.0;
    if (rateWinner !== null && rateLoser !== null) {
      const margin = Math.abs(rateWinner - rateLoser) / 4;
      weight = MARGIN_W_MIN + (1 - MARGIN_W_MIN) * margin;
    }

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
      path: labels.get(key) || "",
    });
  }
  out.sort((x, y) => y.ordinal - x.ordinal || x.key.localeCompare(y.key));
  return out;
}

export function computeRatings(): RankRow[] {
  return _computeRatings(_loadMatchData());
}

interface QualityEntry {
  stars: number;
  n: number;
  rawStars: number;
}

export function _computeAbsoluteQuality(
  raw: RawMatch[]
): Map<string, QualityEntry> {
  const sorted = _sortMatchData(raw);

  const ewma = new Map<string, number>();
  const count = new Map<string, number>();
  const sum = new Map<string, number>();
  const lastVersionByPost = new Map<string, string>();

  const resetIfEdited = (
    key: string,
    pathStr: string,
    version: string | null
  ) => {
    if (version === null || !pathStr) return;
    const trackId = versionTrackId(pathStr);
    const prev = lastVersionByPost.get(trackId);
    if (prev !== undefined && prev !== version) {
      ewma.delete(key);
      count.delete(key);
      sum.delete(key);
    }
    lastVersionByPost.set(trackId, version);
  };

  const applyRating = (key: string, rateVal: number | null) => {
    if (rateVal === null) return;
    ewma.set(
      key,
      ewma.has(key)
        ? EWMA_ALPHA * rateVal + (1 - EWMA_ALPHA) * ewma.get(key)!
        : rateVal
    );
    count.set(key, (count.get(key) || 0) + 1);
    sum.set(key, (sum.get(key) || 0) + rateVal);
  };

  for (const m of sorted) {
    if (m.aKey === m.bKey) continue;
    resetIfEdited(m.aKey, m.aPath, m.aVersion);
    resetIfEdited(m.bKey, m.bPath, m.bVersion);
    applyRating(m.aKey, m.rateA);
    applyRating(m.bKey, m.rateB);
  }

  const result = new Map<string, QualityEntry>();
  for (const [key, stars] of ewma) {
    const n = count.get(key) || 0;
    const rawStars = n > 0 ? (sum.get(key) || 0) / n : 0;
    result.set(key, { stars, n, rawStars });
  }
  return result;
}

export function computeAbsoluteQuality(): Map<string, QualityEntry> {
  return _computeAbsoluteQuality(_loadMatchData());
}

interface VersionEntry {
  stars: number;
  n: number;
  key: string | undefined;
  path: string | undefined;
}

export function _computeVersionRatings(
  raw: RawMatch[]
): Map<string, VersionEntry> {
  const sorted = _sortMatchData(raw);
  const ewma = new Map<string, number>();
  const count = new Map<string, number>();
  const meta = new Map<string, { key: string; path: string }>();
  const apply = (
    version: string | null,
    key: string,
    pathStr: string,
    rateVal: number | null
  ) => {
    if (!version || rateVal === null) return;
    ewma.set(
      version,
      ewma.has(version)
        ? EWMA_ALPHA * rateVal + (1 - EWMA_ALPHA) * ewma.get(version)!
        : rateVal
    );
    count.set(version, (count.get(version) || 0) + 1);
    meta.set(version, { key, path: pathStr });
  };
  for (const m of sorted) {
    if (m.aKey !== m.bKey) continue;
    apply(m.aVersion, m.aKey, m.aPath, m.rateA);
    apply(m.bVersion, m.bKey, m.bPath, m.rateB);
  }
  const result = new Map<string, VersionEntry>();
  for (const [version, stars] of ewma) {
    const { key, path } = meta.get(version) || {};
    result.set(version, { stars, n: count.get(version) || 0, key, path });
  }
  return result;
}

export function computeVersionRatings(): Map<string, VersionEntry> {
  return _computeVersionRatings(_loadMatchData());
}

export function _solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
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
  const x = new Array(n).fill(0) as number[];
  for (let row = n - 1; row >= 0; row--) {
    let s = b[row];
    for (let c = row + 1; c < n; c++) s -= A[row][c] * x[c];
    x[row] = s / (A[row][row] || 1e-9);
  }
  return x;
}

interface DeconfoundResult {
  quality: Map<string, { quality: number; qDev: number; n: number }>;
  agentBias: Map<string, number>;
  perspectiveBias: Map<string, number>;
  intercept: number;
}

export function _computeDeconfoundedQuality(
  raw: RawMatch[],
  ridge: number = DECONFOUND_RIDGE
): DeconfoundResult {
  const postIdx = new Map<string, number>();
  const agentIdx = new Map<string, number>();
  const perspIdx = new Map<string, number>();
  const idxFor = (map: Map<string, number>, keyName: string | null) => {
    if (keyName == null) return -1;
    if (!map.has(keyName)) map.set(keyName, map.size);
    return map.get(keyName)!;
  };

  interface Obs {
    y: number;
    post: number;
    agent: number;
    persp: number;
  }
  const obs: Obs[] = [];
  const postN = new Map<string, number>();
  for (const m of raw) {
    if (m.aKey === m.bKey) continue;
    const add = (key: string, rateVal: number | null) => {
      if (rateVal === null || !key) return;
      const pi = idxFor(postIdx, key);
      obs.push({
        y: rateVal,
        post: pi,
        agent: idxFor(agentIdx, m.agentId),
        persp: idxFor(perspIdx, m.perspectiveId),
      });
      postN.set(key, (postN.get(key) || 0) + 1);
    };
    add(m.aKey, m.rateA);
    add(m.bKey, m.rateB);
  }

  const empty: DeconfoundResult = {
    quality: new Map(),
    agentBias: new Map(),
    perspectiveBias: new Map(),
    intercept: 0,
  };
  if (obs.length === 0) return empty;

  const P = postIdx.size;
  const A = agentIdx.size;
  const K = perspIdx.size;
  const nParams = 1 + P + A + K;
  const qOff = 1;
  const aOff = 1 + P;
  const pOff = 1 + P + A;

  const XtX = Array.from({ length: nParams }, () =>
    new Array<number>(nParams).fill(0)
  );
  const Xty = new Array<number>(nParams).fill(0);

  for (const o of obs) {
    const cols = [0, qOff + o.post];
    if (o.agent >= 0) cols.push(aOff + o.agent);
    if (o.persp >= 0) cols.push(pOff + o.persp);
    for (const c1 of cols) {
      Xty[c1] += o.y;
      for (const c2 of cols) XtX[c1][c2] += 1;
    }
  }
  for (let c = 1; c < nParams; c++) XtX[c][c] += ridge;

  const beta = _solveLinear(XtX, Xty);

  const intercept = beta[0];
  const quality = new Map<
    string,
    { quality: number; qDev: number; n: number }
  >();
  for (const [key, i] of postIdx) {
    const qDev = beta[qOff + i];
    quality.set(key, {
      quality: intercept + qDev,
      qDev,
      n: postN.get(key) || 0,
    });
  }
  const agentBias = new Map<string, number>();
  for (const [id, i] of agentIdx) agentBias.set(id, beta[aOff + i]);
  const perspectiveBias = new Map<string, number>();
  for (const [id, i] of perspIdx) perspectiveBias.set(id, beta[pOff + i]);

  return { quality, agentBias, perspectiveBias, intercept };
}

export function computeDeconfoundedQuality(
  ridge: number = DECONFOUND_RIDGE
): DeconfoundResult {
  return _computeDeconfoundedQuality(_loadMatchData(), ridge);
}

export function _computePerPerspectiveQuality(
  raw: RawMatch[]
): Map<string, Map<string, QualityEntry>> {
  const sorted = _sortMatchData(raw);
  interface Bucket {
    ewma: Map<string, number>;
    count: Map<string, number>;
    sum: Map<string, number>;
    lastVersionByPost: Map<string, string>;
  }
  const byPersp = new Map<string, Bucket>();

  const bucket = (perspId: string): Bucket => {
    if (!byPersp.has(perspId)) {
      byPersp.set(perspId, {
        ewma: new Map(),
        count: new Map(),
        sum: new Map(),
        lastVersionByPost: new Map(),
      });
    }
    return byPersp.get(perspId)!;
  };

  for (const m of sorted) {
    if (!m.perspectiveId) continue;
    if (m.aKey === m.bKey) continue;
    const b = bucket(m.perspectiveId);

    const resetIfEdited = (
      key: string,
      pathStr: string,
      version: string | null
    ) => {
      if (version === null || !pathStr) return;
      const trackId = versionTrackId(pathStr);
      const prev = b.lastVersionByPost.get(trackId);
      if (prev !== undefined && prev !== version) {
        b.ewma.delete(key);
        b.count.delete(key);
        b.sum.delete(key);
      }
      b.lastVersionByPost.set(trackId, version);
    };
    const applyRating = (key: string, rateVal: number | null) => {
      if (rateVal === null) return;
      b.ewma.set(
        key,
        b.ewma.has(key)
          ? EWMA_ALPHA * rateVal + (1 - EWMA_ALPHA) * b.ewma.get(key)!
          : rateVal
      );
      b.count.set(key, (b.count.get(key) || 0) + 1);
      b.sum.set(key, (b.sum.get(key) || 0) + rateVal);
    };

    resetIfEdited(m.aKey, m.aPath, m.aVersion);
    resetIfEdited(m.bKey, m.bPath, m.bVersion);
    applyRating(m.aKey, m.rateA);
    applyRating(m.bKey, m.rateB);
  }

  const result = new Map<string, Map<string, QualityEntry>>();
  for (const [perspId, b] of byPersp) {
    const inner = new Map<string, QualityEntry>();
    for (const [key, stars] of b.ewma) {
      const n = b.count.get(key) || 0;
      const rawStars = n > 0 ? (b.sum.get(key) || 0) / n : 0;
      inner.set(key, { stars, n, rawStars });
    }
    result.set(perspId, inner);
  }
  return result;
}

export function computePerPerspectiveQuality(): Map<
  string,
  Map<string, QualityEntry>
> {
  return _computePerPerspectiveQuality(_loadMatchData());
}

export function computePerPerspectiveRatings(): Map<
  string,
  PerspectiveRankRow[]
> {
  const byPerspective = new Map<
    string,
    Array<{
      runAt: string;
      aKey: string;
      bKey: string;
      winner: "a" | "b";
    }>
  >();

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    let winner = data.winner as string;
    if (data.override && data.override !== "null")
      winner = data.override as string;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a as { key?: string; slug?: string } | null);
    const bKey = postKey(data.post_b as { key?: string; slug?: string } | null);
    if (!aKey || !bKey) continue;
    if (winner !== "a" && winner !== "b") continue;
    if (aKey === bKey) continue;

    const perspId = data.perspective_id ? String(data.perspective_id) : null;
    if (!perspId) continue;

    const rawRunAt = (data.run_at ?? data.run_id ?? "") as string | Date;
    const runAt =
      rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);

    if (!byPerspective.has(perspId)) byPerspective.set(perspId, []);
    byPerspective
      .get(perspId)!
      .push({ runAt, aKey, bKey, winner: winner as "a" | "b" });
  }

  const result = new Map<string, PerspectiveRankRow[]>();

  for (const [perspId, matches] of byPerspective) {
    matches.sort((x, y) => x.runAt.localeCompare(y.runAt));

    const ratings = new Map<string, ReturnType<typeof rating>>();
    const appearances = new Map<string, number>();
    const wins = new Map<string, number>();

    const ensure = (key: string) => {
      if (!ratings.has(key)) ratings.set(key, rating());
      return ratings.get(key)!;
    };

    for (const m of matches) {
      if (m.aKey === m.bKey) continue;
      const aRating = ensure(m.aKey);
      const bRating = ensure(m.bKey);
      appearances.set(m.aKey, (appearances.get(m.aKey) || 0) + 1);
      appearances.set(m.bKey, (appearances.get(m.bKey) || 0) + 1);

      const winnerKey = m.winner === "a" ? m.aKey : m.bKey;
      const loserKey = m.winner === "a" ? m.bKey : m.aKey;
      const [[newWinner], [newLoser]] = rate([
        [ratings.get(winnerKey)!],
        [ratings.get(loserKey)!],
      ]);
      ratings.set(winnerKey, newWinner);
      ratings.set(loserKey, newLoser);
      wins.set(winnerKey, (wins.get(winnerKey) || 0) + 1);
    }

    const out: PerspectiveRankRow[] = [];
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

export function getProtectedPosts(minAppearances: number = 2): Set<string> {
  const perPerspective = computePerPerspectiveRatings();
  const protected_ = new Set<string>();
  for (const [, rows] of perPerspective) {
    if (rows.length === 0) continue;
    const top = rows[0];
    if (top.appearances >= minAppearances) {
      protected_.add(top.key);
    }
  }
  return protected_;
}
