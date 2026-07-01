import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { execFileSync } from "node:child_process";
import { rating, predictWin } from "openskill";
import {
  OUT_DIR,
  RATES_DIR,
  keyForPath,
  readPost,
  listPosts,
  getPostUuid,
  getPostUuidLegacy,
} from "./posts.js";
import {
  SELECTION_PATH,
  readSelection,
  writeSelection,
  listDirVersions,
  listVersionSlugs,
  listEnglishWithKey,
  findTranslations,
  type SelectionEntries,
  type VersionInfo,
} from "./selection.js";
import {
  listMatchFiles,
  readMatch,
  writeMatch,
  postKey,
  gitMtime,
} from "./matches.js";
import {
  computeRatings,
  computeAbsoluteQuality,
  computeVersionRatings,
  computeDeconfoundedQuality,
  computePerPerspectiveQuality,
  getProtectedPosts,
  MIN_APPEARANCES,
} from "./ranking.js";
import {
  pickRandomPerspective,
  loadPerspective,
  listPerspectives,
} from "./perspectives.js";
import { pickRandomMood, MOODS } from "./moods.js";

type PostSideRaw = { key?: string; slug?: string } | null | undefined;

interface InitOptions {
  skipEdit?: boolean;
  skipRating?: boolean;
  agentId?: string;
  evalLang?: string;
  reviewLang?: string;
  objective?: string;
  minAppearances?: number;
  matches?: number;
  pledge?: string;
  contentMode?: "inline" | "path-only";
  // When true, init creates the session but does NOT auto-call continueCmd
  // (used by generate-match, which drives the display itself, quietly).
  skipAutoContinue?: boolean;
  // When true, a missing --agent-id is allowed and stored as "TODO"; the
  // evaluator is named later at submit-eval (used by generate-match).
  deferAgentId?: boolean;
}

interface WorstOptions {
  absolute?: boolean;
  full?: boolean;
}

interface EndOptions {
  force?: boolean;
  skipEdit?: boolean;
  agentId?: string;
  attest?: string;
}

interface PromoteArgs {
  key?: string;
  draft?: string;
  force?: boolean;
}

interface DiagnoseMatchEntry {
  timestamp?: number;
  [key: string]: unknown;
}

// Word-trigram shingles for near-duplicate detection of review/clash prose.
function shingleSet(text: unknown): Set<string> {
  const words = String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .match(/[\p{L}\p{N}]+/gu);
  const set = new Set<string>();
  if (!words) return set;
  for (let i = 0; i + 2 < words.length; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}
const STALE_BONUS = 3.0;
// Phase 3 (opt-in): objective-aware sampling. When HRONIR_OBJECTIVE is set,
// nudge pair selection toward high-level posts (refine the top) or low-level
// posts (hunt the worst). Default-off → identical behavior to before. The
// weight is deliberately small so it tilts ties without overriding the
// information terms (sigma, stale_bonus).
const OBJECTIVE_WEIGHT = 0.15;
// RFC 0013 §3/§5: the `coverage` objective. The corpus diagnosis showed a very
// thin acervo (max ~4 appearances/work, sigma ≈ prior everywhere), so the
// highest-leverage sampling bias is toward under-covered works. The bonus is
// 1/(1+appearances) per side, weighted enough to dominate the (currently tiny)
// sigma spread without overriding a closeness/stale signal entirely.
const COVERAGE_WEIGHT = 4.0;
// RFC 0013 §8.1: soft cooldown replacing the old binary leader exclusion. A
// per-perspective leader (already ≥2 appearances there) is *deprioritized*, not
// removed — kept below STALE_BONUS so a genuinely stale leader can still surface.
const LEADER_COOLDOWN = 2.0;
const SKILLS_DIR = "scripts/hronir/skills";
const SESSION_PATH = "hronir_session.json";
const MIN_WORDS = 100;
// RFC 0010: stars-v2 adds post_a/b.ref ("slug@uuid") to each side. stars-v1
// files (path/key/version fields) remain readable and are never rewritten.
// RFC 0012 §4.2: stars-v3 adds review_lang + per-side content_lang. Older
// schemas stay valid and classified `legacy`; only stars-v3 is validated for
// the new language fields.
const PROMPT_VERSION = "stars-v3";
const STARS_SCHEMAS = new Set(["stars-v1", "stars-v2", "stars-v3"]);
// Schemas that carry slug@uuid refs and therefore require strict version-uuid
// resolution in the doctor (RFC 0010 §4.3).
const REF_SCHEMAS = new Set(["stars-v2", "stars-v3"]);

function wordCount(s: unknown): number {
  if (!s || typeof s !== "string") return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Detects automated token-stuffing in text fields.
// Catches several Jules/script-generated patterns:
//   1. Underscored ID tokens (revA_1873_abc123_0 — original heuristic)
//   2. Database artifact ref tags embedded in prose ([ref:a1b2c3d4])
//   3. Known Jules session boilerplate prefixes
//   4. Dense random 8-char alphanumeric tokens (≥30% of words, ≥20-word field)
function hasTokenStuffing(s: unknown): boolean {
  if (!s || typeof s !== "string") return false;
  // Pattern 1: underscored token IDs
  const pattern1 = /\b[A-Za-z]+_\d{3,}_[A-Za-z0-9]{4,}_\d+\b/g;
  if ((s.match(pattern1)?.length ?? 0) >= 5) return true;
  // Pattern 2: database artifact ref tags ([ref:a1b2c3d4])
  if (/\[ref:[a-f0-9]{8}\]/.test(s)) return true;
  // Pattern 3: Jules boilerplate framing phrases
  const boilerplates = [
    "Evaluating this English post, uniquely identified as",
    "Clashing these English posts, uniquely identified as",
    "Nesta leitura sob a ótica da perspectiva, notamos o seguinte:",
    "A close reading reveals the following fundamental characteristics:",
    "Reading this through the lens of our perspective, we find:",
    "Comparando ambas as obras através das lentes da nossa perspectiva.",
    "In this direct clash, the differences become evident.",
  ];
  for (const bp of boilerplates) {
    if (s.includes(bp)) return true;
  }
  // Pattern 4: dense random alphanumeric tokens (7–9 chars, mixed letter+digit)
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 20) {
    const tokenCount = words.filter(
      (w) => /^[a-z0-9]{7,9}$/.test(w) && /[a-z]/.test(w) && /[0-9]/.test(w)
    ).length;
    if (tokenCount / words.length >= 0.3) return true;
  }
  return false;
}

function parseRate(raw: unknown, flagName: string): number {
  if (raw == null || String(raw).trim() === "") {
    throw new Error(`Erro: ${flagName} é obrigatório.`);
  }
  const s = String(raw).trim();
  // up to two decimal places, mandatory digit before/after the point if dotted
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    throw new Error(
      `Erro: ${flagName} deve ser um número entre 1.00 e 5.00 com no máximo duas casas decimais (recebido: ${JSON.stringify(raw)}).`
    );
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    throw new Error(
      `Erro: ${flagName} deve estar entre 1.00 e 5.00 (recebido: ${JSON.stringify(raw)}).`
    );
  }
  // round to two decimals to avoid float drift in stored data
  return Math.round(n * 100) / 100;
}

function isValidRate(n: unknown): boolean {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  if (n < 1 || n > 5) return false;
  // accept up to two decimals (allow small float drift)
  const scaled = n * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function latestMatchTimeByKey(): Map<string, number> {
  const out = new Map<string, number>();
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const aKey = postKey(data.post_a as PostSideRaw);
    const bKey = postKey(data.post_b as PostSideRaw);
    const ts =
      data.run_at instanceof Date
        ? data.run_at.getTime()
        : Date.parse(String(data.run_at || data.run_id || "")) || 0;
    if (!ts) continue;
    for (const k of [aKey, bKey]) {
      if (!k) continue;
      const prev = out.get(k) || 0;
      if (ts > prev) out.set(k, ts);
    }
  }
  return out;
}

function utcStamp() {
  const iso = new Date().toISOString();
  return {
    runId: iso.replace(/[:.]/g, "-").replace(/Z$/, ""),
    runAt: iso,
  };
}

function nextStep(text: string): void {
  const border = "━".repeat(80);
  console.log("");
  console.log(border);
  console.log("👉 PRÓXIMO PASSO / NEXT STEP:");
  console.log(border);
  console.log(text);
  console.log(border);
}

export function init(options: InitOptions = {}) {
  console.log(
    `\n\n████████████████████████████████████████████████████████████████████████████████\n█                                                                              █\n█                    🎬 INÍCIO DE UMA NOVA SESSÃO DO HRONIR                     █\n█                                                                              █\n████████████████████████████████████████████████████████████████████████████████\n`
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(RATES_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "critiques"), { recursive: true });

  const skipEdit = !!options.skipEdit;
  const skipRating = !!options.skipRating;
  let agentId = options.agentId;
  if (!agentId || agentId === "TODO") {
    if (!options.deferAgentId) {
      console.error(
        "Erro: --agent-id é obrigatório. Identifique o avaliador explicitamente (ex.: --agent-id claude-opus-4-7 ou --agent-id franklin)."
      );
      process.exit(1);
    }
    // Deferred identity (generate-match): the evaluator is named at submit-eval.
    agentId = "TODO";
  }
  const evalLang = options.evalLang || "pt";
  // RFC 0012 §6: review_lang defaults to the evaluation language when not given.
  const reviewLang = options.reviewLang || evalLang;
  // RFC 0013 §8.2: sampling objective is session provenance. Empty = neutral.
  const objective = options.objective || "";
  const sessionPath = SESSION_PATH;

  if (fs.existsSync(sessionPath)) {
    let existing: Record<string, unknown> | null = null;
    try {
      existing = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    } catch {
      // corrupt session file — let init overwrite it
    }
    if (existing && existing.state !== "done") {
      console.error(
        `Erro: sessão em andamento detectada (estado: '${existing.state}'). ` +
          "Termine com `npm run hronir:end` antes de iniciar uma nova, " +
          "ou force o descarte com `npm run hronir:end -- --force`."
      );
      process.exit(1);
    }
  }

  if (skipRating) {
    const session = {
      target: 0,
      completed: 0,
      agentId,
      evalLang,
      reviewLang,
      objective,
      state: "need_edit",
      skipEdit: false,
      skipRating: true,
      currentMatch: null,
      minAppearances: options.minAppearances || null,
    };
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    console.log(
      `Sessão iniciada diretamente na fase de edição do pior post (--skip-rating ativo).`
    );
    editWorst();
    return;
  }

  const candidates = listEnglishWithKey();
  if (candidates.length < 4) {
    console.error("Erro: mínimo 4 posts para formar pares.");
    process.exit(1);
  }

  const matchesOpt = options.matches != null ? options.matches : 10;
  const pledge = options.pledge?.trim() || null;
  const contentMode =
    options.contentMode === "path-only" ? "path-only" : "inline";
  const session = {
    target: matchesOpt,
    completed: 0,
    agentId,
    evalLang,
    reviewLang,
    objective,
    state: "ready_for_next",
    skipEdit,
    skipRating: false,
    currentMatch: null,
    minAppearances: options.minAppearances || null,
    pledge,
    contentMode,
  };
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  const agentLabel =
    agentId === "TODO" ? "(a definir em submit-eval)" : agentId;
  console.log(
    `Sessão iniciada para ${matchesOpt} matches com agente "${agentLabel}" e avaliações em "${evalLang}".`
  );
  if (pledge) {
    const border = "═".repeat(80);
    console.log("");
    console.log(border);
    console.log("📜 DECLARAÇÃO DE COMPROMISSO DO AVALIADOR");
    console.log(border);
    console.log(`"${pledge}"`);
    console.log(`— ${agentId}`);
    console.log(border);
    console.log("");
  }
  if (skipEdit) {
    console.log("Fase de edição do pior post será pulada (--skip-edit ativo).");
  }
  if (!options.skipAutoContinue) continueCmd();
}

// Curated ranges of generally-visible, assigned Unicode (skips control chars,
// surrogates, and the unassigned wastelands). The evaluator reads whatever
// glyph comes out subjectively — a letter, an arrow, a kanji, a dingbat — and
// lets its shape/feel nudge the mood. Hronir rolls it so the agent can't fake it.
const MOOD_GLYPH_RANGES = [
  [0x21, 0x7e], // ASCII punctuation, digits, letters
  [0xa1, 0x24f], // Latin-1 supplement + Latin Extended-A/B
  [0x370, 0x3ff], // Greek and Coptic
  [0x400, 0x4ff], // Cyrillic
  [0x2190, 0x21ff], // Arrows
  [0x2200, 0x22ff], // Mathematical operators
  [0x2600, 0x26ff], // Miscellaneous symbols
  [0x2700, 0x27bf], // Dingbats
  [0x3041, 0x3096], // Hiragana
  [0x30a1, 0x30fa], // Katakana
  [0x4e00, 0x9fff], // CJK unified ideographs
];

function randomMoodGlyph() {
  const [lo, hi] =
    MOOD_GLYPH_RANGES[Math.floor(Math.random() * MOOD_GLYPH_RANGES.length)];
  const cp = lo + Math.floor(Math.random() * (hi - lo + 1));
  return String.fromCodePoint(cp);
}

// RFC 0010: probability that a generated match is a version duel (the
// selected version vs a sibling challenger) instead of a cross-essay pair.
// Small enough to keep most matches cross-essay; only ever fires when some
// directory actually has a non-selected version.
const VERSION_DUEL_PROB = 0.34;

// Statistical floor: a version needs at least SELECT_MIN_DUELS version
// duels before it's trusted to compete for display at all (§4.2, amended
// 2026-07-01 — selection is stateless now, see select() below).
// SELECT_MARGIN is no longer used for display (no more hysteresis); it
// still biases which version duel pickVersionDuel() schedules next — a
// revision that already leads by this margin in one language is
// prioritized for testing in its siblings, to unblock coupled selection
// faster (§4.4).
const SELECT_MARGIN = 0.3;
const SELECT_MIN_DUELS = 2;

// Stars + duel count for a version, looking up the rating map by the RFC 0010
// UUID first and the legacy body-only UUID (stars-v1 rate files) second.
function versionStars(
  ratings: Map<string, { stars: number; n: number }>,
  v: VersionInfo
): { stars: number; n: number } | null {
  return ratings.get(v.uuid) ?? ratings.get(v.legacyUuid) ?? null;
}

// RFC 0010 §4.4: version duels run in every directory with at least two
// versions, any language. The challenger is the non-selected publishable
// version with the fewest duels (tiebreak: newest). Candidates whose revision
// (draftCreatedAt) already qualified in a sibling language are prioritized so
// coupled selections unblock fast.
function pickVersionDuel() {
  const ratings = computeVersionRatings();
  const candidates: Array<{
    key: string;
    lang: string;
    selectedPath: string;
    challengerPath: string;
    duelsN: number;
    createdAt: number;
    priority: boolean;
  }> = [];

  // Revisions (draftCreatedAt) whose challenger already cleared the
  // hysteresis bar in some directory.
  const qualifiedRevisions = new Set<string>();
  const dirVersions = new Map<string, VersionInfo[]>();
  for (const slug of Object.keys(readSelection())) {
    const versions = listDirVersions(slug);
    dirVersions.set(slug, versions);
    const selected = versions.find((v) => v.selected);
    if (!selected) continue;
    const selStars = versionStars(ratings, selected);
    for (const v of versions) {
      if (v.selected || !v.draftCreatedAt) continue;
      const vs = versionStars(ratings, v);
      if (
        vs &&
        selStars &&
        vs.n >= SELECT_MIN_DUELS &&
        vs.stars - selStars.stars >= SELECT_MARGIN
      ) {
        qualifiedRevisions.add(v.draftCreatedAt);
      }
    }
  }

  for (const [slug, versions] of dirVersions) {
    const selected = versions.find((v) => v.selected);
    if (!selected) continue;
    const challengers = versions.filter((v) => !v.selected && v.published);
    if (challengers.length === 0) continue;
    challengers.sort((a, b) => {
      const na = versionStars(ratings, a)?.n ?? 0;
      const nb = versionStars(ratings, b)?.n ?? 0;
      if (na !== nb) return na - nb;
      return b.file.localeCompare(a.file); // newest first
    });
    const challenger = challengers[0];
    candidates.push({
      key: selected.translationKey ?? slug,
      lang: selected.lang,
      selectedPath: selected.path,
      challengerPath: challenger.path,
      duelsN: versionStars(ratings, challenger)?.n ?? 0,
      createdAt: challenger.draftCreatedAt
        ? Date.parse(challenger.draftCreatedAt)
        : 0,
      priority: Boolean(
        challenger.draftCreatedAt &&
        qualifiedRevisions.has(challenger.draftCreatedAt) &&
        (versionStars(ratings, challenger)?.n ?? 0) < SELECT_MIN_DUELS
      ),
    });
  }

  if (candidates.length === 0) return null;
  const pool = candidates.some((c) => c.priority)
    ? candidates.filter((c) => c.priority)
    : candidates;
  // Fewest duels first (spread coverage), then newest draft first (a
  // just-created draft shouldn't wait behind a backlog of stale ones),
  // jitter only breaks true ties.
  pool.sort((a, b) => {
    if (a.duelsN !== b.duelsN) return a.duelsN - b.duelsN;
    if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
    return Math.random() - 0.5;
  });
  return pool[0];
}

function generateNextMatch(sessionObjective?: string) {
  // RFC 0013 §8.1: no hard exclusion. Every published post stays eligible; a
  // per-perspective leader is only deprioritized via a cooldown in the score.
  const eligible = listEnglishWithKey();

  const leaders = getProtectedPosts(2);
  const leaderCooldown = (key: string) =>
    leaders.has(key) ? LEADER_COOLDOWN : 0;
  if (leaders.size > 0) {
    console.log(
      `(${leaders.size} líder(es) de perspectiva despriorizado(s) por cooldown: ${[...leaders].join(", ")})`
    );
  }

  const ranking = computeRatings();
  const ratingByKey = new Map();
  const appByKey = new Map<string, number>();
  for (const r of ranking) {
    ratingByKey.set(r.key, { mu: r.mu, sigma: r.sigma });
    appByKey.set(r.key, r.appearances);
  }
  const getRating = (key: string) => ratingByKey.get(key) ?? rating();

  const lastMatchTime = latestMatchTimeByKey();
  const staleByKey = new Map();
  for (const c of eligible) {
    const lastMatch = lastMatchTime.get(c.translationKey) || 0;
    if (lastMatch === 0) {
      staleByKey.set(c.translationKey, false);
      continue;
    }
    // Use previousVersion.timestamp (written by edit-commit) as the canonical
    // "post was intentionally edited" signal. Fall back to gitMtime for posts
    // that have never gone through edit-commit.
    const postData = readPost(c.path);
    const prevVersion = postData?.previousVersion as
      | { timestamp?: string }
      | undefined;
    const prevTimestamp = prevVersion?.timestamp
      ? Date.parse(String(prevVersion.timestamp)) || 0
      : 0;
    const mtime = prevTimestamp > 0 ? prevTimestamp : gitMtime(c.path);
    staleByKey.set(c.translationKey, mtime > lastMatch);
  }
  const staleBonus = (key: string) => (staleByKey.get(key) ? STALE_BONUS : 0);

  // RFC 0013 §8.2: the objective is session-provenance first (persisted at
  // init), with HRONIR_OBJECTIVE as a legacy fallback. `coverage` prefers
  // under-sampled works; `refine-top`/`hunt-worst` tilt toward high/low level
  // pairs. Unset → score untouched.
  const objective = sessionObjective || process.env.HRONIR_OBJECTIVE || "";
  const objectiveSign =
    objective === "refine-top" ? 1 : objective === "hunt-worst" ? -1 : 0;
  if (objective) console.log(`(objetivo de amostragem: ${objective})`);

  // coverage: reward low-appearance works (1/(1+appearances) per side).
  const coverageBonus =
    objective === "coverage"
      ? (a: string, b: string) =>
          COVERAGE_WEIGHT *
          (1 / (1 + (appByKey.get(a) ?? 0)) + 1 / (1 + (appByKey.get(b) ?? 0)))
      : () => 0;
  const levelByKey = new Map();
  if (objectiveSign !== 0) {
    for (const [key, q] of computeAbsoluteQuality())
      levelByKey.set(key, q.stars);
  }
  const level = (key: string) => levelByKey.get(key) ?? 3.0;
  const objectiveBonus = (a: string, b: string) =>
    objectiveSign === 0
      ? 0
      : OBJECTIVE_WEIGHT * objectiveSign * (level(a) + level(b));

  const pairs = [];
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const a = eligible[i];
      const b = eligible[j];
      const ra = getRating(a.translationKey);
      const rb = getRating(b.translationKey);
      const [pA] = predictWin([[ra], [rb]]);
      const score =
        -Math.abs(pA - 0.5) +
        ra.sigma +
        rb.sigma +
        staleBonus(a.translationKey) +
        staleBonus(b.translationKey) +
        objectiveBonus(a.translationKey, b.translationKey) +
        coverageBonus(a.translationKey, b.translationKey) -
        leaderCooldown(a.translationKey) -
        leaderCooldown(b.translationKey);
      pairs.push({
        a,
        b,
        score,
        pA,
        sa: ra.sigma,
        sb: rb.sigma,
        jitter: Math.random(),
      });
    }
  }
  pairs.sort((x, y) => y.score - x.score || x.jitter - y.jitter);

  const chosen = pairs[0];
  if (!chosen) {
    console.error("Não há pares elegíveis disponíveis no momento.");
    process.exit(1);
  }

  let { a, b } = chosen;
  if (Math.random() < 0.5) [a, b] = [b, a];

  const sessionPath = SESSION_PATH;
  let agentId = "TODO";
  let evalLang = "pt";
  if (fs.existsSync(sessionPath)) {
    const s = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    agentId = s.agentId || "TODO";
    evalLang = s.evalLang || "pt";
  }

  // For each post, randomly pick which language version to show. The ranking
  // key is always the translationKey (derived from EN), but the evaluator
  // reads whichever language is randomly selected. Only publishable variants
  // enter the draw — a draft or scheduled translation must not be evaluated
  // and affect the shared key's ranking.
  function pickLangVariant(post: { path: string; translationKey: string }) {
    const variants = findTranslations(post.translationKey, {
      publishedOnly: true,
    });
    if (variants.length <= 1) return { path: post.path, lang: "en" };
    const v = variants[Math.floor(Math.random() * variants.length)];
    return { path: v.path, lang: v.lang || "en" };
  }
  const aVariant = pickLangVariant(a);
  const bVariant = pickLangVariant(b);

  const perspective = pickRandomPerspective();
  const recordedMoods = [];
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    if (
      data.evaluator_mood_after &&
      typeof data.evaluator_mood_after === "string" &&
      data.evaluator_mood_after.trim()
    ) {
      recordedMoods.push(data.evaluator_mood_after.trim());
    }
  }
  const evaluatorMood = pickRandomMood(recordedMoods);

  // RFC 0010 §4.3: stable version addressing. slug = folder name, uuid =
  // content identity; together they survive renames, selection swaps and
  // pruning.
  const refFor = (p: string) =>
    `${path.basename(path.dirname(p))}@${getPostUuid(p)}`;
  const sideFor = (key: string, p: string, lang: string) => ({
    key,
    path: p,
    display_lang: lang,
    content_lang: lang, // RFC 0012 §6: explicit language of this side's text
    version: getPostUuid(p),
    ref: refFor(p),
  });

  // RFC 0010: occasionally run a version duel (the selected version vs a
  // sibling challenger, any language) so competing versions get rated. Only
  // fires when some directory has a challenger; otherwise falls back to the
  // cross-essay pair chosen above.
  const duel = Math.random() < VERSION_DUEL_PROB ? pickVersionDuel() : null;
  let postA, postB;
  if (duel) {
    postA = sideFor(duel.key, duel.selectedPath, duel.lang);
    postB = sideFor(duel.key, duel.challengerPath, duel.lang);
    console.log(
      `Gerado match: DUELO DE VERSÃO (${duel.key}/${duel.lang}) — selecionada vs desafiante. Perspectiva: ${perspective.name}.`
    );
  } else {
    postA = sideFor(a.translationKey, aVariant.path, aVariant.lang);
    postB = sideFor(b.translationKey, bVariant.path, bVariant.lang);
    console.log(
      `Gerado match (active sampling). Perspectiva: ${perspective.name}. Idiomas: ${aVariant.lang}/${bVariant.lang}.`
    );
  }
  return {
    post_a: postA,
    post_b: postB,
    agent_id: agentId,
    eval_lang: evalLang,
    perspective_id: perspective.id,
    evaluator_mood: evaluatorMood,
    // Random Unicode glyph the evaluator reads subjectively (together with the
    // initial mood and what the match made them feel) to shape the after-mood.
    mood_glyph: randomMoodGlyph(),
  };
}

function perspectiveBanner(
  perspective: { name: string; id: string; summary: string; body: string },
  mood: string | null | undefined
): string {
  const border = "━".repeat(80);
  const lines = [
    border,
    `🎭 PERSPECTIVA DESTE MATCH: ${perspective.name} (${perspective.id})`,
    border,
    perspective.summary,
    "",
    perspective.body,
    border,
  ];
  if (mood) {
    lines.push(`🌡️  ESTADO INICIAL DO AVALIADOR:\n${mood}`);
    lines.push(border);
  }
  lines.push("");
  return lines.join("\n");
}

// RFC 0010 §4.3: the cached path in an in-flight match is a hint; the stable
// address is ref = slug@uuid. If the file moved between match generation and
// evaluation (rename, prune), find the peer with the same UUID — current or
// legacy — in the slug's directory. Exits with a clear message when the
// content is gone for good instead of crashing on readFileSync.
function resolveSidePath(
  side: { path?: string; ref?: string; key?: string } | null | undefined,
  label: string
): string {
  const ref = side?.ref;
  let slug: string | null = null;
  let uuid: string | null = null;
  if (ref && ref.includes("@")) {
    const at = ref.lastIndexOf("@");
    slug = ref.slice(0, at);
    uuid = ref.slice(at + 1);
  }
  if (side?.path && fs.existsSync(side.path)) {
    // Pre-stars-v2 session without ref: the path is all we have.
    if (!uuid) return side.path;
    // The path is only authoritative while it still carries the duelled
    // content — an in-place edit mid-session would otherwise attribute the
    // evaluation to the old UUID over the new text.
    if (
      getPostUuid(side.path) === uuid ||
      getPostUuidLegacy(side.path) === uuid
    ) {
      return side.path;
    }
  }
  if (slug && uuid) {
    const hit = listDirVersions(slug).find(
      (v) => v.uuid === uuid || v.legacyUuid === uuid
    );
    if (hit) return hit.path;
  }
  console.error(
    `Erro: o conteúdo do post ${label} do match atual não existe mais (path=${side?.path ?? "?"}, ref=${ref ?? "—"}).`
  );
  console.error(
    "A versão foi removida, renomeada ou editada após a geração do match. Rode `npm run hronir:end -- --force` e inicie nova sessão."
  );
  process.exit(1);
}

// Render one side (A or B) of the current match: header, slug, file path,
// optional Suno links, and the content (or a path-only pointer). Shared by
// `continue` (post A), `first-impression-a` (post B) and `generate-match`.
function printSidePost(session: any, side: "A" | "B") {
  const match = session.currentMatch;
  const post = side === "A" ? match?.post_a : match?.post_b;
  const p = resolveSidePath(post, side);
  const slug = post?.key || "(slug desconhecido)";
  const content = fs.readFileSync(p, "utf8");
  const sunoId = matter(content).data.sunoId;
  const pathOnly = session.contentMode === "path-only";
  const border = "━".repeat(80);
  const header =
    side === "A" ? "📄 PRIMEIRO POST (A) " : "📄 SEGUNDO POST (B) ";
  console.log(header + "━".repeat(Math.max(0, 80 - header.length)));
  console.log(`Slug: ${slug}`);
  console.log(`Arquivo: ${p}`);
  if (sunoId) {
    console.log(`🎵 Suno Song Page: https://suno.com/song/${sunoId}`);
    console.log(
      `🔊 Direct Audio URL (MP3): https://cdn1.suno.ai/${sunoId}.mp3`
    );
    console.log(
      `💡 Agente multimodal: você pode baixar/ouvir o MP3 acima para informar sua avaliação.`
    );
  }
  console.log(`${border}\n`);
  if (!pathOnly) {
    console.log(content);
    console.log(`\n${border}\n`);
  } else {
    console.log(`[content-mode: path-only — leia o arquivo em: ${p}]`);
    console.log(`\n${border}\n`);
  }
}

export function continueCmd(opts: { quiet?: boolean } = {}) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.log("Nenhuma sessão ativa encontrada.");
    nextStep(
      "rode `npm run hronir:init` para começar uma rodada ou `npm run hronir:edit-worst`."
    );
    return;
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

  if (session.state === "need_edit") {
    console.log("Fase de matches concluída. Você precisa editar o pior post.");
    nextStep(
      "rode `npm run hronir:edit-worst` para ver os detalhes ou `npm run hronir:end --skip-edit` para ignorar."
    );
    return;
  }

  if (session.state === "ready_for_next") {
    if (session.completed >= session.target) {
      if (session.skipEdit) {
        console.log(`Sessão concluída! (${session.target} matches avaliados).`);
        fs.unlinkSync(sessionPath);
        console.log("Fase de edição do pior post pulada (--skip-edit ativa).");
        console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
      } else {
        session.state = "need_edit";
        fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
        console.log(
          `Sessão de matches concluída! (${session.target} matches avaliados).`
        );
        nextStep(
          "rode `npm run hronir:edit-worst` para ver os detalhes ou `npm run hronir:end --skip-edit` para ignorar."
        );
      }
      return;
    }

    const title = ` MATCH ${session.completed + 1} DE ${session.target} `;
    const padding = Math.max(0, Math.floor((80 - title.length) / 2));
    const padStr = "━".repeat(padding);
    console.log(`\n${padStr}${title}${padStr}\n`);
    const match = generateNextMatch(session.objective);
    session.currentMatch = match;
    session.state = "reading_a";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  }

  if (session.state === "reading_a") {
    // Backfill perspective for in-flight sessions created before stars-v1:
    // pick one now and persist so the rest of the flow has a stable lens.
    if (session.currentMatch && !session.currentMatch.perspective_id) {
      const picked = pickRandomPerspective();
      session.currentMatch.perspective_id = picked.id;
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
      console.log(
        `(perspectiva sorteada para sessão em andamento: ${picked.name})`
      );
    }
    const perspectiveId = session.currentMatch?.perspective_id;
    if (perspectiveId) {
      try {
        const mood = session.currentMatch?.evaluator_mood;
        console.log(perspectiveBanner(loadPerspective(perspectiveId), mood));
      } catch (e: unknown) {
        console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
        process.exit(1);
      }
    }

    printSidePost(session, "A");

    session.state = "waiting_impression_a";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    // generate-match drives its own flow (post B + decide prompt) right after
    // this, so it suppresses the first-impression-a hint that the legacy flow
    // prints here.
    if (!opts.quiet) {
      nextStep(
        `Rode para registrar a primeira impressão do Post A: npm run hronir:first-impression-a "<texto>"`
      );
    }
    return;
  }

  if (session.state === "waiting_impression_a") {
    nextStep(
      `Aguardando primeira impressão do Post A. Rode: npm run hronir:first-impression-a "<texto>"`
    );
    return;
  }

  if (session.state === "waiting_impression_b") {
    nextStep(
      `Aguardando primeira impressão do Post B. Rode: npm run hronir:first-impression-b "<texto>"`
    );
    return;
  }

  if (session.state === "deciding") {
    nextStep(
      `Você precisa decidir o match atual. Rode (--after-mood primeiro): npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
    );
    return;
  }
}

export function firstImpressionA(args: string[]) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "waiting_impression_a") {
    console.error(
      `Erro: Estado atual é '${session.state}', esperado 'waiting_impression_a'.`
    );
    process.exit(1);
  }

  const text = args.join(" ").trim();
  if (!text) {
    console.error(
      "Erro: Você deve fornecer o texto da sua primeira impressão do Post A."
    );
    process.exit(1);
  }

  session.currentMatch.impression_a = text;

  const perspectiveId = session.currentMatch?.perspective_id;
  const border = "━".repeat(80);
  if (perspectiveId) {
    try {
      const perspective = loadPerspective(perspectiveId);
      console.log(`\n${border}`);
      console.log(
        `🎭 Lembrete da perspectiva: ${perspective.name}\n${perspective.summary}`
      );
      console.log(`${border}\n`);
    } catch (e: unknown) {
      console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
      process.exit(1);
    }
  }

  printSidePost(session, "B");

  session.state = "waiting_impression_b";
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  nextStep(
    `Rode para registrar a primeira impressão do Post B: npm run hronir:first-impression-b "<texto>"`
  );
}

export function firstImpressionB(args: string[]) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "waiting_impression_b") {
    console.error(
      `Erro: Estado atual é '${session.state}', esperado 'waiting_impression_b'.`
    );
    process.exit(1);
  }

  const text = args.join(" ").trim();
  if (!text) {
    console.error(
      "Erro: Você deve fornecer o texto da sua primeira impressão do Post B."
    );
    process.exit(1);
  }

  session.currentMatch.impression_b = text;
  session.state = "deciding";
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  printDecidePrompt(session);
}

// Print the decide instructions for the current match: perspective line,
// glyph + initial mood, slugs, formatting/length rules and the example
// command. Shared by `first-impression-b` and `generate-match`.
function printDecidePrompt(session: any) {
  const currentMatch = session.currentMatch;
  const perspectiveId = currentMatch.perspective_id;
  let perspective = null;
  if (perspectiveId) {
    try {
      perspective = loadPerspective(perspectiveId);
    } catch (e: unknown) {
      console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
      process.exit(1);
    }
  }

  const aSlug = currentMatch.post_a?.key || "(slug desconhecido)";
  const bSlug = currentMatch.post_b?.key || "(slug desconhecido)";
  const moodGlyph = currentMatch.mood_glyph ?? null;
  const moodGlyphCp = moodGlyph
    ? "U+" +
      moodGlyph.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
    : null;
  const initialMood = currentMatch.evaluator_mood ?? null;
  const evalLang = currentMatch.eval_lang || session.evalLang || "pt";
  const evalLangLabel = evalLang === "pt" ? "português" : evalLang;

  const perspectiveLine = perspective
    ? `Avalie a partir da perspectiva: ${perspective.name} (id: ${perspectiveId}). A perspectiva é fixa para este match — não há override.`
    : "(sem perspectiva atribuída — sessão inconsistente; rode novamente `npm run hronir:continue`)";

  const border = "━".repeat(80);
  const stepLines = [
    perspectiveLine,
    "",
    border,
    `🔣 SEU GLIFO (Unicode aleatório): ${moodGlyph ?? "—"}  (${moodGlyphCp ?? "—"})`,
    `🌡️  SEU MOOD INICIAL: ${initialMood ?? "—"}`,
    border,
    "PRIMEIRO, antes de tudo, decida o seu --after-mood. O Hronir sorteou o",
    "glifo acima por você — leia-o subjetivamente. Combine essa leitura com",
    "o seu mood inicial e com o que estes dois posts e o",
    "confronto entre eles te fizeram sentir. Desse caldo sai o seu estado",
    "interno agora — e é ele que vai colorir o tom com que você escreve as",
    "resenhas e o clash a seguir. Por isso o --after-mood é a PRIMEIRA flag.",
    "",
    `Slugs deste match: A = "${aSlug}", B = "${bSlug}".`,
    "Nas resenhas e no confronto, refira-se a cada post pelo seu slug",
    '(ex.: "' +
      aSlug +
      '"), não por "Post A" / "Post B". Isso mantém os relatos',
    "legíveis fora do contexto efêmero do match.",
    "",
    "Atribua estrelas (1.00–5.00) a cada post e escreva uma resenha de cada,",
    "depois um confronto. O vencedor é derivado mecanicamente: quem",
    "tiver mais estrelas. Empates são rejeitados — comprometa-se.",
    "",
    "As resenhas e o confronto são renderizados como Markdown — pode usar",
    "ênfase, listas, blockquotes para citar trechos, e emojis quando ajudarem",
    "a marcar tom ou veredito. Use a formatação a serviço da leitura, sem exagero.",
    "",
    "Além de avaliar, fique à vontade para sugerir melhorias concretas ao post",
    "(o que cortar, expandir, reordenar) e apontar conteúdo relevante que veio",
    "à mente sobre o assunto — uma referência, um autor, um exemplo, um link.",
    "Essas sugestões alimentam a fase de edição; quanto mais específicas, melhor.",
    "",
    `🌐 LÍNGUA DE AVALIAÇÃO: ${evalLangLabel} (eval_lang: ${evalLang}). Escreva --review-a, --review-b e --clash nessa língua. O post pode estar em outra língua — não importa: a avaliação é sempre em ${evalLangLabel}.`,
    "",
    "- --after-mood: [PRIMEIRA flag; máx. 250 chars] Seu estado interno agora, em",
    "  primeira pessoa, decidido a partir do glifo + mood inicial + o que o match",
    "  te fez sentir. Pode ser incompleto, sensorial, mundano — o que estiver na",
    "  cabeça ou no corpo. NÃO descreva os posts. NÃO repita o mood inicial do banner.",
    '  Ex.: "Estou com vontade de assistir a um filme agora — algo longo e sem pressa."',
    '  Ex.: "Preciso sentir grama nos pés agora."',
    '  Ex.: "Estou ansioso para a viagem do mês que vem — fico pensando no aeroporto às 6h da manhã."',
    "- --rate-a / --rate-b: número de 1.00 a 5.00 com até duas casas decimais (proibido empate)",
    "- --review-a / --review-b: mínimo 100 palavras cada, escritas a partir da perspectiva atribuída, referindo-se ao post pelo slug",
    "- --clash: mínimo 100 palavras, narra o confronto entre os dois posts (pelos slugs) pela ótica da perspectiva",
    "",
    border,
    `Para decidir, rode (--after-mood primeiro):`,
    `npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`,
    border,
  ];
  nextStep(stepLines.join("\n"));
}

export function next(initOptions = {}) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.log("Nenhuma sessão ativa: iniciando nova rodada.");
    init(initOptions);
    return;
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  console.log(
    `Sessão detectada: state=${session.state}, ${session.completed ?? 0}/${session.target ?? 0} matches.`
  );

  if (session.state === "deciding") {
    nextStep(
      `Decisão pendente. Rode (--after-mood primeiro): npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
    );
    return;
  }

  if (session.state === "need_edit") {
    if (session.worstKey) {
      console.log(
        `Edição em andamento para "${session.worstKey}". Baseline já registrado — não vou refazer snapshot.`
      );
      nextStep(
        `Edite os rascunhos e rode \`npm run hronir:draft-commit -- --msg "<mensagem>"\` para fechar a rodada.`
      );
      return;
    }
    editWorst();
    return;
  }

  continueCmd();
}

// Minimal one-shot API (no separate `init`, no first-impression steps).
// `generate-match` starts a fresh 1-match session (skip-edit, so the single
// `submit-eval` closes the round), prints BOTH posts, the glyph + initial mood,
// and the decide instructions, leaving the session in `deciding`. If a session
// is already in progress it just advances it, like `next`.
export function generateMatch(initOptions = {}) {
  if (!fs.existsSync(SESSION_PATH)) {
    // Create the session without init's auto-continue, then drive the display
    // ourselves (quietly, no first-impression hint). --agent-id is optional
    // here; the evaluator is named at submit-eval (deferAgentId).
    init({
      ...initOptions,
      matches: 1,
      skipEdit: true,
      skipAutoContinue: true,
      deferAgentId: true,
    });
  }
  // Advance ready_for_next → perspective banner + post A (or report the current
  // state for a resumed session).
  continueCmd({ quiet: true });
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  // Only the fresh-read state has a post B left to show + a decide prompt to
  // print. Any other state (resume mid-decide, completed, need_edit) was
  // already handled by continueCmd above.
  if (session.state !== "waiting_impression_a") return;
  // First impressions are skipped in this API (they carry no downstream use);
  // impression_a/b stay null unless passed to `submit-eval`.
  printSidePost(session, "B");
  session.state = "deciding";
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  printDecidePrompt(session);
}

// Reprint the glyph (with its U+ codepoint) and the initial mood for the
// current match. The glyph is also shown by `generate-match`; this is for
// re-reading it without regenerating.
export function getGlipho() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(
      "Erro: Nenhuma sessão ativa. Rode `npx hronir generate-match` primeiro."
    );
    process.exit(1);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  const match = session.currentMatch;
  if (!match) {
    console.error(
      "Erro: nenhum match ativo. Rode `npx hronir generate-match` primeiro."
    );
    process.exit(1);
  }
  const glyph = match.mood_glyph ?? null;
  const cp = glyph
    ? "U+" + glyph.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
    : "—";
  console.log(`🔣 SEU GLIFO (Unicode aleatório): ${glyph ?? "—"}  (${cp})`);
  console.log(`🌡️  SEU MOOD INICIAL: ${match.evaluator_mood ?? "—"}`);
}

export function decide(args: string[]) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa. Não é possível decidir.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "deciding") {
    console.error(
      `Erro: Estado atual é '${session.state}', esperado 'deciding'. Rode npm run hronir:continue.`
    );
    process.exit(1);
  }

  const currentMatch = session.currentMatch;
  if (!currentMatch || !currentMatch.post_a || !currentMatch.post_b) {
    console.error(
      "Erro: sessão sem match atual. Rode `npm run hronir:continue` para gerar um match."
    );
    process.exit(1);
  }

  const draft = session.draftDecision || {};
  let agentId = session.agentId || "TODO";
  let clash = draft.clash || "";
  let reviewA = draft.review_a || "";
  let reviewB = draft.review_b || "";
  let rateA =
    draft.rate_a !== undefined && draft.rate_a !== null
      ? String(draft.rate_a)
      : null;
  let rateB =
    draft.rate_b !== undefined && draft.rate_b !== null
      ? String(draft.rate_b)
      : null;
  let afterMood =
    draft.evaluator_mood_after !== undefined &&
    draft.evaluator_mood_after !== null
      ? String(draft.evaluator_mood_after)
      : null;

  let clashAppend = "";
  let reviewAAppend = "";
  let reviewBAppend = "";

  const saveDraft = () => {
    session.draftDecision = {
      clash,
      review_a: reviewA,
      review_b: reviewB,
      rate_a:
        rateA !== null ? (isNaN(Number(rateA)) ? rateA : Number(rateA)) : null,
      rate_b:
        rateB !== null ? (isNaN(Number(rateB)) ? rateB : Number(rateB)) : null,
      evaluator_mood_after: afterMood,
    };
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  };

  const removedFlags = new Set([
    "--winner",
    "--winner-defense",
    "--defense",
    "--loser-critique",
    "--critique",
    "--perspective",
    "--eval-lang",
    "--lang",
  ]);
  function readDecideFlag(flagName: string, idx: number): string {
    const v = args[idx + 1];
    if (v == null) {
      console.error(`Erro: ${flagName} exige um valor.`);
      process.exit(1);
    }
    if (v.startsWith("--")) {
      console.error(
        `Erro: ${flagName} exige um valor, mas recebeu outra flag (${v}).`
      );
      process.exit(1);
    }
    return v;
  }

  for (let i = 0; i < args.length; i++) {
    if (removedFlags.has(args[i])) {
      if (args[i] === "--perspective") {
        console.error(
          "Erro: --perspective não é uma flag de decide. A perspectiva é sorteada e fixada em `continue`; o avaliador a recebe via banner antes de decidir, sem poder sobrescrever."
        );
      } else if (args[i] === "--eval-lang" || args[i] === "--lang") {
        console.error(
          "Erro: --eval-lang só é aceita em `init`. A língua de avaliação é fixa pela sessão."
        );
      } else {
        console.error(
          `Erro: a flag ${args[i]} foi removida. Use --rate-a / --rate-b (1.00–5.00) e --review-a / --review-b. O vencedor é derivado das estrelas.`
        );
      }
      process.exit(1);
    }
    if (
      args[i] === "--agent-id" ||
      args[i] === "--agent" ||
      args[i] === "--model"
    ) {
      agentId = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--clash") {
      clash = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--review-a") {
      reviewA = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--review-b") {
      reviewB = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--clash-append") {
      clashAppend = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--review-a-append") {
      reviewAAppend = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--review-b-append") {
      reviewBAppend = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--rate-a") {
      rateA = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--rate-b") {
      rateB = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--after-mood") {
      afterMood = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--impression-a") {
      // Optional: first impressions carry no downstream use, but `submit-eval`
      // may still record them. Written straight onto the match for the rate file.
      session.currentMatch.impression_a = readDecideFlag(args[i], i);
      i++;
    } else if (args[i] === "--impression-b") {
      session.currentMatch.impression_b = readDecideFlag(args[i], i);
      i++;
    }
  }

  if (clashAppend) {
    clash = (clash ? clash + " " : "") + clashAppend;
  }
  if (reviewAAppend) {
    reviewA = (reviewA ? reviewA + " " : "") + reviewAAppend;
  }
  if (reviewBAppend) {
    reviewB = (reviewB ? reviewB + " " : "") + reviewBAppend;
  }

  if (!agentId || agentId === "TODO") {
    console.error(
      "Erro: --agent-id é obrigatório. Passe-o aqui (ex.: submit-eval --agent-id 'this is my id' ...) ou defina no init."
    );
    process.exit(1);
  }

  let parsedRateA: number;
  let parsedRateB: number;
  try {
    parsedRateA = parseRate(rateA, "--rate-a");
  } catch (err: any) {
    saveDraft();
    console.error(err.message);
    console.error(
      `Nota: Seus dados parciais foram salvos no rascunho de decisão.`
    );
    process.exit(1);
  }

  try {
    parsedRateB = parseRate(rateB, "--rate-b");
  } catch (err: any) {
    saveDraft();
    console.error(err.message);
    console.error(
      `Nota: Seus dados parciais foram salvos no rascunho de decisão.`
    );
    process.exit(1);
  }

  if (parsedRateA === parsedRateB) {
    saveDraft();
    console.error(
      `Erro: --rate-a e --rate-b não podem ser iguais (${parsedRateA.toFixed(2)} x ${parsedRateB.toFixed(2)}). Comprometa-se.`
    );
    process.exit(1);
  }

  const wcClash = wordCount(clash);
  const wcReviewA = wordCount(reviewA);
  const wcReviewB = wordCount(reviewB);

  if (wcClash < MIN_WORDS) {
    saveDraft();
    console.error(
      `Erro: --clash precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcClash}).`
    );
    console.error(
      `Nota: Rascunho salvo. Você pode complementar usando a flag: --clash-append "<confronto complementar>"`
    );
    process.exit(1);
  }
  if (wcReviewA < MIN_WORDS) {
    saveDraft();
    console.error(
      `Erro: --review-a precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcReviewA}).`
    );
    console.error(
      `Nota: Rascunho salvo. Você pode complementar usando a flag: --review-a-append "<resenha A complementar>"`
    );
    process.exit(1);
  }
  if (wcReviewB < MIN_WORDS) {
    saveDraft();
    console.error(
      `Erro: --review-b precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcReviewB}).`
    );
    console.error(
      `Nota: Rascunho salvo. Você pode complementar usando a flag: --review-b-append "<resenha B complementar>"`
    );
    process.exit(1);
  }

  if (afterMood !== null) {
    const moodStr = String(afterMood).trim();
    if (moodStr.length > 250) {
      saveDraft();
      console.error(
        `Erro: --after-mood excede 250 caracteres (recebido: ${moodStr.length}). Seja mais conciso.`
      );
      console.error(
        `Nota: Rascunho salvo. Repita o decide apenas com um --after-mood mais curto; os demais campos serão recuperados do rascunho.`
      );
      process.exit(1);
    }
  }

  // Pre-PR sessions can land in state=deciding with no perspective_id on
  // currentMatch — continueCmd's backfill only fires from reading_a. Pick
  // one here so the upgrade doesn't strand the session.
  let perspectiveId = currentMatch.perspective_id;
  if (!perspectiveId) {
    const picked = pickRandomPerspective();
    perspectiveId = picked.id;
    currentMatch.perspective_id = picked.id;
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    console.log(
      `(perspectiva sorteada para sessão em andamento: ${picked.name})`
    );
  }
  let perspective;
  try {
    perspective = loadPerspective(perspectiveId);
  } catch (e: unknown) {
    console.error(`Erro: ${(e as Error).message}`);
    process.exit(1);
  }

  const winner = parsedRateA > parsedRateB ? "a" : "b";

  const { runId, runAt } = utcStamp();
  const aKey = currentMatch.post_a.key;
  const bKey = currentMatch.post_b.key;
  const matchFile = path.join(RATES_DIR, `${runId}_${aKey}_x_${bKey}.md`);

  // RFC 0012 §6: review_lang is the session language for editorial (work)
  // duels; for a version duel both sides are the same linguistic version, so
  // the critique is written in that content language (rule 3).
  const evalLangValue = currentMatch.eval_lang || session.evalLang || "pt";
  const contentLangA =
    currentMatch.post_a.content_lang ||
    currentMatch.post_a.display_lang ||
    null;
  const reviewLang =
    aKey === bKey
      ? contentLangA || session.reviewLang || evalLangValue
      : session.reviewLang || evalLangValue;

  // RFC 0012 §4.2: stars-v3 requires per-side content_lang. Sessions started
  // before this field existed carry sides with only display_lang, so backfill
  // it here — otherwise a session spanning the upgrade would write a stars-v3
  // file the doctor rejects.
  const withContentLang = (side: Record<string, unknown>) => ({
    ...side,
    content_lang:
      (side.content_lang as string) ||
      (side.display_lang as string) ||
      evalLangValue,
  });

  const data = {
    run_id: runId,
    run_at: runAt,
    post_a: withContentLang(currentMatch.post_a),
    post_b: withContentLang(currentMatch.post_b),
    winner,
    agent_id: agentId,
    content_mode: session.contentMode ?? "inline",
    objective: session.objective || null,
    eval_lang: evalLangValue,
    review_lang: reviewLang,
    prompt_version: PROMPT_VERSION,
    season: 1,
    override: null,
    perspective_id: perspective.id,
    evaluator_mood: currentMatch.evaluator_mood ?? null,
    mood_glyph: currentMatch.mood_glyph ?? null,
    evaluator_mood_after: afterMood ? String(afterMood).trim() || null : null,
    impression_a: currentMatch.impression_a ?? null,
    impression_b: currentMatch.impression_b ?? null,
    rate_a: parsedRateA,
    rate_b: parsedRateB,
    clash,
    review_a: reviewA,
    review_b: reviewB,
  };

  fs.mkdirSync(RATES_DIR, { recursive: true });
  writeMatch(matchFile, data, "");

  console.log(
    `Match ${path.basename(matchFile)} criado com sucesso! (perspectiva: ${perspective.name}, ${parsedRateA.toFixed(2)}★ vs ${parsedRateB.toFixed(2)}★, vencedor: ${winner})`
  );

  session.completed += 1;
  session.state = "ready_for_next";
  session.currentMatch = null;
  delete session.draftDecision;
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  nextStep("Rode `npm run hronir:continue` para ir para o próximo passo.");
}

// `submit-eval` is `decide` plus auto-finalize. In the one-shot API the single
// match completes the round, so advance once (continueCmd) to close the session
// — instead of leaving it at `ready_for_next` waiting for a manual `continue`.
// Only finalizes a *completed* round; a still-incomplete multi-match session is
// left untouched (no surprise auto-generation of the next match).
export function submitEval(args: string[]) {
  decide(args);
  // decide exits the process on validation failure; reaching here means success.
  if (!fs.existsSync(SESSION_PATH)) return;
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  if (
    session.state === "ready_for_next" &&
    (session.completed ?? 0) >= (session.target ?? 0)
  ) {
    continueCmd();
  }
}

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
    "Rode `npm run hronir:edit-worst` para iniciar a edição do pior ranqueado (ou `npm run hronir:worst` apenas para inspeção)."
  );
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

// Phase 3 diagnostics: de-confounded quality + evaluator/perspective biases +
// per-perspective leaders. Read-only; never mutates state. Posts below
// MIN_APPEARANCES are shown but flagged low-confidence.
export function diagnose() {
  const { quality, agentBias, perspectiveBias, intercept } =
    computeDeconfoundedQuality();
  const absolute = computeAbsoluteQuality();

  if (quality.size === 0) {
    console.log("Sem observações com estrelas (schema stars-v1) para modelar.");
    nextStep("nenhum. Rode alguns matches com rate_a/rate_b primeiro.");
    return;
  }

  // Rows sorted by de-confounded quality DESC. `gap` = de-confounded − raw
  // EWMA: negative means the raw stars were inflated by generous evaluators or
  // perspectives (the post got an easy crowd); positive means deflated.
  const rows = [...quality.entries()]
    .map(([key, q]) => {
      const raw = absolute.get(key);
      const rawStars = raw ? raw.stars : null;
      return {
        key,
        deconf: q.quality,
        rawStars,
        gap: rawStars === null ? null : q.quality - rawStars,
        n: q.n,
      };
    })
    .sort((a, b) => b.deconf - a.deconf || a.key.localeCompare(b.key));

  console.log(`# de-confounded quality (intercept μ=${intercept.toFixed(3)})`);
  console.log(`rank\tkey\tdeconf\traw\tgap\tn`);
  rows.forEach((r, i) => {
    const conf = r.n >= MIN_APPEARANCES ? "" : "\t(baixa-confiança)";
    const rawStr = r.rawStars === null ? "-" : r.rawStars.toFixed(2);
    const gapStr =
      r.gap === null ? "-" : (r.gap >= 0 ? "+" : "") + r.gap.toFixed(2);
    console.log(
      `${i + 1}\t${r.key}\t${r.deconf.toFixed(2)}\t${rawStr}\t${gapStr}\t${r.n}${conf}`
    );
  });

  // Evaluator bias: who rates systematically high/low, net of which posts and
  // perspectives they happened to draw.
  const agents = [...agentBias.entries()].sort((a, b) => b[1] - a[1]);
  if (agents.length > 0) {
    console.log(`\n# evaluator bias (α — alto = avalia generoso)`);
    for (const [id, bias] of agents) {
      console.log(`${(bias >= 0 ? "+" : "") + bias.toFixed(3)}\t${id}`);
    }
  }

  // Perspective bias: which reader personas are structurally harsh/generous.
  const persps = [...perspectiveBias.entries()].sort((a, b) => b[1] - a[1]);
  if (persps.length > 0) {
    console.log(`\n# perspective bias (π — alto = perspectiva generosa)`);
    for (const [id, bias] of persps) {
      console.log(`${(bias >= 0 ? "+" : "") + bias.toFixed(3)}\t${id}`);
    }
  }

  // Per-perspective leaders: the top post in each perspective's own stars EWMA.
  const perPersp = computePerPerspectiveQuality();
  if (perPersp.size > 0) {
    console.log(`\n# líder por perspectiva (stars EWMA dentro da perspectiva)`);
    const ids = [...perPersp.keys()].sort();
    for (const id of ids) {
      const inner = perPersp.get(id)!;
      const top = [...inner.entries()].sort(
        (a, b) => b[1].stars - a[1].stars || a[0].localeCompare(b[0])
      )[0];
      if (top) {
        console.log(
          `${id}\t→ ${top[0]} (${top[1].stars.toFixed(2)}, n=${top[1].n})`
        );
      }
    }
  }

  nextStep(
    "nenhum. `diagnose` é só leitura — use os vieses pra calibrar, não muda estado."
  );
}

// RFC 0010 §4.8: single defense collector for both sides. `side` picks which
// end of each match must hit `keys`; the loser's review surfaces as `critique`
// (callers for winners simply ignore it).
function collectDefenses(
  keys: string[],
  side: "winner" | "loser",
  { limit = 5 } = {}
) {
  const set = new Set(keys);
  const out = [];
  for (const f of listMatchFiles()) {
    const { data, content } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a as PostSideRaw);
    const bKey = postKey(data.post_b as PostSideRaw);
    const winnerSideKey = winner === "a" ? aKey : bKey;
    const loserSideKey = winner === "a" ? bKey : aKey;
    const sideKey = side === "winner" ? winnerSideKey : loserSideKey;
    if (!sideKey || !set.has(sideKey)) continue;

    // Stars-schema matches (stars-v1+) carry symmetric review_a/review_b;
    // older new-schema matches use winner_defense/loser_critique; legacy
    // matches keep prose in the body.
    let body = "";
    let parsedCritique = null;
    const perspectiveLabel = data.perspective_id
      ? `[Perspectiva]: ${data.perspective_id}\n\n`
      : "";
    if (data.review_a || data.review_b) {
      const c = data.clash && data.clash !== "TODO" ? data.clash : "";
      const winnerReview =
        winner === "a" ? data.review_a || "" : data.review_b || "";
      const loserReview =
        winner === "a" ? data.review_b || "" : data.review_a || "";
      const rateWinner = winner === "a" ? data.rate_a : data.rate_b;
      const rateLoser = winner === "a" ? data.rate_b : data.rate_a;
      const starsLine =
        rateWinner != null && rateLoser != null
          ? `[Estrelas] vencedor ${rateWinner}★ vs perdedor ${rateLoser}★\n\n`
          : "";
      body = `${perspectiveLabel}${starsLine}[Confronto]\n${c}\n\n[Resenha do vencedor]\n${winnerReview}`;
      parsedCritique = loserReview || null;
    } else if (data.clash || data.winner_defense || data.loser_critique) {
      const c = data.clash && data.clash !== "TODO" ? data.clash : "";
      const w =
        data.winner_defense && data.winner_defense !== "TODO"
          ? data.winner_defense
          : "";
      const l =
        data.loser_critique && data.loser_critique !== "TODO"
          ? data.loser_critique
          : "";
      body = `${perspectiveLabel}[Confronto]\n${c}\n\n[Defesa]\n${w}`;
      parsedCritique = l || null;
    } else {
      body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
      if (!body) continue;
      parsedCritique = data.critique || null;
      const clashMatch = body.match(
        /# O Confronto\s*\n([\s\S]*?)(?=# O Vencedor|# O Perdedor|$)/i
      );
      const winnerMatch = body.match(
        /# O Vencedor\s*\n([\s\S]*?)(?=# O Confronto|# O Perdedor|$)/i
      );
      const loserMatch = body.match(
        /# O Perdedor\s*\n([\s\S]*?)(?=# O Confronto|# O Vencedor|$)/i
      );
      if (clashMatch || winnerMatch || loserMatch) {
        const parsedClash = clashMatch ? clashMatch[1].trim() : "";
        const parsedWinner = winnerMatch ? winnerMatch[1].trim() : "";
        const parsedLoser = loserMatch ? loserMatch[1].trim() : "";
        body = `[Confronto]\n${parsedClash}\n\n[Defesa]\n${parsedWinner}`;
        parsedCritique = parsedLoser;
      } else {
        const parts = body.split(
          /\n---\s*\n\s*(?:#+\s*)?Critique(?:\s*:)?\s*\n/i
        );
        if (parts.length > 1) {
          body = parts[0].trim();
          parsedCritique = parts[1].trim();
        }
      }
    }

    out.push({
      file: path.basename(f),
      runId: data.run_id || "",
      runAt: data.run_at || "",
      winner: winnerSideKey,
      loser: loserSideKey,
      body,
      critique: parsedCritique,
    });
  }
  out.sort((a, b) =>
    String(b.runAt || b.runId).localeCompare(String(a.runAt || a.runId))
  );
  return out.slice(0, limit);
}

function getRecentlyEditedKeys(limit = 2): string[] {
  // Cooldown is derived from previousVersion.timestamp on each post's
  // frontmatter (linked-list of edits, only the immediate predecessor is
  // stored per file). Legacy posts still using editHistory[] are honored
  // via fallback. The most recent edit timestamp across all translations
  // of a key wins.
  const posts = listPosts().map((p) => ({ path: p, data: readPost(p) }));
  // The RFC 0010 migration stamped every migrated file with one shared
  // draftCreatedAt. A stamp that appears under more than one translationKey
  // is that batch marker, not an individual edit — draft-worst stamps all
  // translations of a *single* key per run — so it never counts toward
  // cooldown (it would park two arbitrary migrated keys there forever).
  const keysByDraftStamp = new Map<string, Set<string>>();
  for (const { data } of posts) {
    if (!data.translationKey || !data.draftCreatedAt) continue;
    const stamp = String(data.draftCreatedAt);
    let keys = keysByDraftStamp.get(stamp);
    if (!keys) keysByDraftStamp.set(stamp, (keys = new Set()));
    keys.add(String(data.translationKey));
  }
  const latestByKey = new Map();
  for (const { data } of posts) {
    if (!data.translationKey) continue;
    let latest = 0;
    const consider = (ts: unknown) => {
      const t = ts ? Date.parse(String(ts)) || 0 : 0;
      if (t > latest) latest = t;
    };
    consider(
      (data.previousVersion as Record<string, unknown> | undefined)?.timestamp
    );
    // RFC 0003: a recent draft (or one just promoted) also puts the key on
    // cooldown, so draft-worst doesn't re-draft the same post every round.
    consider(data.draftCommittedAt);
    const draftStamp = data.draftCreatedAt ? String(data.draftCreatedAt) : null;
    if (draftStamp && keysByDraftStamp.get(draftStamp)!.size === 1) {
      consider(draftStamp);
    }
    if (Array.isArray(data.editHistory)) {
      for (const entry of data.editHistory as Array<Record<string, unknown>>)
        consider(entry?.timestamp);
    }
    if (!latest) continue;
    const key = String(data.translationKey);
    const prevLatest = latestByKey.get(key) || 0;
    if (latest > prevLatest) latestByKey.set(key, latest);
  }
  return [...latestByKey.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export function editWorst() {
  const sessionPath = SESSION_PATH;
  let minApps = MIN_APPEARANCES;
  if (fs.existsSync(sessionPath)) {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    const midMatch = ["reading_a", "reading_b", "deciding"].includes(
      session.state
    );
    const matchesPending = (session.target ?? 0) > (session.completed ?? 0);
    if (midMatch || (session.state === "ready_for_next" && matchesPending)) {
      console.error(
        `Erro: Há um match em andamento (estado: ${session.state}, ${session.completed ?? 0}/${session.target ?? 0}).`
      );
      console.error(
        `Finalize a avaliação dos matches com \`npm run hronir:continue\` / \`npm run hronir:decide\` antes de editar o pior post.`
      );
      process.exit(1);
    }
    if (
      session.minAppearances !== undefined &&
      session.minAppearances !== null
    ) {
      minApps = session.minAppearances;
    }
  }

  const rows = computeRatings();
  if (rows.length === 0) {
    console.error("Sem matches preenchidos suficientes para ranquear.");
    process.exit(1);
  }
  const eligible = rows.filter((r) => r.appearances >= minApps);
  if (eligible.length === 0) {
    console.log(`Volume insuficiente para edit-worst.`);
    console.log(`Mínimo: ${minApps} aparições por post.`);
    console.log(
      `Elegíveis: ${eligible.length} posts de ${rows.length} no ranking total.`
    );
    console.log(`Próxima rodada pode acumular mais sinal.`);
    nextStep("nenhum. Termine a rodada com PR só dos matches.");
    return;
  }

  // rows are sorted by ordinal DESC (best first); worst eligible is the last.
  // We skip posts that were edited in the last two edit cycles, posts with a
  // pending draft, and posts with no surviving file (rated in the past but
  // since deleted from src/content/blog/ — the rating history outlives the
  // file, and computeRatings() has no way to know that).
  const recentlyEdited = getRecentlyEditedKeys(2);
  const duelRatings = computeVersionRatings();
  const missingFileKeys: string[] = [];
  let worstRow = null;
  let worstRowFiles: ReturnType<typeof findTranslations> = [];
  for (let i = eligible.length - 1; i >= 0; i--) {
    const row = eligible[i];
    if (recentlyEdited.includes(row.key)) continue;
    // RFC 0010: don't pile drafts — skip keys that still have a pending
    // challenger (a non-selected publishable version awaiting its duels).
    // A version that already duelled enough and didn't win is a settled
    // loser (prune candidate), not a pending draft — it must not block
    // draft-worst forever the way the old v-*-prev archive did (bug V4).
    const hasDraft = findTranslations(row.key).some((t) => {
      const slug = path.basename(path.dirname(t.path));
      return listDirVersions(slug).some(
        (v) =>
          !v.selected &&
          v.published &&
          (versionStars(duelRatings, v)?.n ?? 0) < SELECT_MIN_DUELS
      );
    });
    if (hasDraft) continue;
    const translationFiles = findTranslations(row.key).filter((t) =>
      fs.existsSync(t.path)
    );
    if (translationFiles.length === 0) {
      missingFileKeys.push(row.key);
      continue;
    }
    worstRow = row;
    worstRowFiles = translationFiles;
    break;
  }

  if (!worstRow) {
    console.log(
      "Aviso: Todos os posts elegíveis foram editados recentemente, têm rascunho pendente, ou não têm arquivo correspondente. Usando o pior colocado absoluto com arquivo válido."
    );
    for (let i = eligible.length - 1; i >= 0; i--) {
      const row = eligible[i];
      const translationFiles = findTranslations(row.key).filter((t) =>
        fs.existsSync(t.path)
      );
      if (translationFiles.length > 0) {
        worstRow = row;
        worstRowFiles = translationFiles;
        break;
      }
    }
  }

  if (missingFileKeys.length > 0) {
    console.log(
      `Aviso: post(s) com histórico de avaliação mas sem arquivo (deletados sem atualizar o ranking), pulados: ${missingFileKeys.join(", ")}. Rode \`npm run hronir:doctor\` para diagnóstico.`
    );
  }

  if (!worstRow) {
    console.error(
      "Erro: nenhum post elegível tem arquivo correspondente em src/content/blog/. " +
        "Rode `npm run hronir:doctor` para diagnóstico."
    );
    process.exit(1);
  }

  const topRows = eligible.filter((r) => r.key !== worstRow.key).slice(0, 3);
  const topKeys = topRows.map((r) => r.key);

  const translationFiles = worstRowFiles;

  // RFC 0010: non-destructive drafting. Copy each selected version into a
  // sibling draft <slug>/v-<timestamp>.<ext> for the agent to edit. The
  // selected version stays untouched; the draft competes with it in later
  // version duels, and `hronir:select` swaps the winner in when it clears
  // the hysteresis bar. Lineage lives in-repo via `supersedes` (the
  // selected version's content UUID).
  const { runId: draftStamp } = utcStamp();
  const draftCreatedAt = new Date().toISOString();
  const drafts = [];
  for (const fileInfo of translationFiles) {
    const canonicalUuid = getPostUuid(fileInfo.path);
    const dir = path.dirname(fileInfo.path);
    const ext = path.extname(fileInfo.path).slice(1) || "md";
    const draftPath = path.join(dir, `v-${draftStamp}.${ext}`);
    const parsed = matter(fs.readFileSync(fileInfo.path, "utf8"));
    parsed.data.supersedes = canonicalUuid;
    parsed.data.draftCreatedAt = draftCreatedAt;
    fs.writeFileSync(
      draftPath,
      matter.stringify(parsed.content, parsed.data),
      "utf8"
    );
    drafts.push({
      lang: fileInfo.lang,
      draftPath,
      canonicalPath: fileInfo.path,
      canonicalUuid,
    });
    console.log(
      `[draft-worst] Rascunho criado: ${draftPath} (supersedes ${canonicalUuid})`
    );
  }

  // Persist worstKey/drafts so draft-commit can close the loop, creating a
  // minimal session if draft-worst was invoked standalone.
  const session = fs.existsSync(SESSION_PATH)
    ? JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"))
    : {
        target: 0,
        completed: 0,
        agentId: "human",
        evalLang: null,
        state: "need_edit",
        skipEdit: false,
        skipRating: true,
        currentMatch: null,
        minAppearances: minApps,
      };
  session.state = "need_edit";
  session.worstKey = worstRow.key;
  session.drafts = drafts;
  delete session.originalVersions;
  delete session.replacedAtCommit;
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));

  console.log(`# Pior ranqueado (≥${minApps} aparições): ${worstRow.key}`);
  for (const d of drafts) {
    console.log(
      `# [${d.lang}] canônica ${d.canonicalPath} (UUIDv5 ${d.canonicalUuid}) → rascunho ${d.draftPath}`
    );
  }
  console.log(
    `# Ordinal: ${worstRow.ordinal.toFixed(3)} (mu ${worstRow.mu.toFixed(3)}, sigma ${worstRow.sigma.toFixed(3)}, wins ${worstRow.wins}/${worstRow.appearances})`
  );
  console.log(
    `# Elegíveis: ${eligible.length} de ${rows.length} no ranking total`
  );
  console.log("");
  console.log("# Top 3 (contraste): " + topKeys.join(", "));
  console.log("");
  console.log("=== CONTEÚDO DO POST WORST ===");
  console.log("");

  if (worstRow.path && fs.existsSync(worstRow.path)) {
    console.log(fs.readFileSync(worstRow.path, "utf8"));
  } else {
    console.log(`(arquivo não encontrado: ${worstRow.path})`);
  }

  console.log("");
  console.log("=== DEFESAS EM QUE ESTE POST PERDEU ===");
  console.log("");
  const losses = collectDefenses([worstRow.key], "loser", { limit: 5 });
  if (losses.length === 0) {
    console.log("(nenhuma defesa textual encontrada em derrotas)");
  } else {
    for (const d of losses) {
      console.log(`--- ${d.file}`);
      console.log(`(venceu: ${d.winner})`);
      console.log("");
      console.log(d.body);
      console.log("");
      if (d.critique) {
        console.log(`(critica / dica para melhorar):`);
        console.log(d.critique);
        console.log("");
      }
    }
  }

  console.log("=== DEFESAS DE POSTS QUE VENCERAM (top 3) ===");
  console.log("");
  const wins = collectDefenses(topKeys, "winner", { limit: 5 });
  if (wins.length === 0) {
    console.log("(nenhuma defesa textual encontrada para o top 3)");
  } else {
    for (const d of wins) {
      console.log(`--- ${d.file}`);
      console.log(`(vencedor: ${d.winner}, contra: ${d.loser})`);
      console.log("");
      console.log(d.body);
      console.log("");
    }
  }

  const stepLines = [
    "Antes de editar, leia AS DUAS skills:",
    `- ${SKILLS_DIR}/franklin-blog/SKILL.md`,
    `- ${SKILLS_DIR}/franklin-essay/SKILL.md`,
    "",
    "Decida qual aplicar ao post worst.",
    "Default: franklin-blog. Use franklin-essay APENAS se o post for",
    "argumentativo-formal (paper-shaped, defesa de tese, citação",
    "acadêmica densa). Em caso de dúvida, blog.",
    "",
    "Edite os RASCUNHOS abaixo (NÃO as versões selecionadas — elas ficam intactas).",
    "Cada rascunho é uma nova versão que vai conviver e competir com a selecionada:",
  ];
  for (const d of drafts) {
    stepLines.push(`- [${d.lang}] ${d.draftPath}`);
  }
  stepLines.push(
    "",
    "Diminua o gap observado entre este post e os melhores, mantendo o espírito do post.",
    "",
    "Após editar os rascunhos, registre-os e encerre a rodada rodando:",
    'npm run hronir:draft-commit -- --msg "Sua mensagem explicando o que fez e o porquê"'
  );
  nextStep(stepLines.join("\n"));
}

function buildPathToKeyIndex() {
  const idx = new Map();
  for (const p of listPosts()) {
    idx.set(p, keyForPath(p));
  }
  return idx;
}

export function migrate({ dryRun = false } = {}) {
  const pathToKey = buildPathToKeyIndex();
  const files = listMatchFiles();
  let changed = 0;
  let renamed = 0;
  let skipped = 0;
  const warnings = [];

  for (const f of files) {
    const { data, content } = readMatch(f);
    const aPath = (data.post_a as PostSideRaw & { path?: string })?.path;
    const bPath = (data.post_b as PostSideRaw & { path?: string })?.path;
    if (!aPath || !bPath) {
      warnings.push(`${f}: post_a.path / post_b.path ausente`);
      skipped++;
      continue;
    }
    const aKey = pathToKey.get(aPath);
    const bKey = pathToKey.get(bPath);
    if (!aKey || !bKey) {
      warnings.push(`${f}: path não encontrado (${aPath} ou ${bPath})`);
      skipped++;
      continue;
    }

    const oldKeyA = postKey(data.post_a as PostSideRaw);
    const oldKeyB = postKey(data.post_b as PostSideRaw);
    const hadSlugA = "slug" in ((data.post_a as object) || {});
    const hadSlugB = "slug" in ((data.post_b as object) || {});
    const fmChanged =
      oldKeyA !== aKey || oldKeyB !== bKey || hadSlugA || hadSlugB;

    const newFm = { ...data };
    newFm.post_a = { key: aKey, path: aPath };
    newFm.post_b = { key: bKey, path: bPath };

    const filenameNeeded = `${data.run_id}_${aKey}_x_${bKey}.md`;
    const currentBase = path.basename(f);
    const targetPath = path.join(path.dirname(f), filenameNeeded);
    const needsRename = currentBase !== filenameNeeded;

    if (dryRun) {
      if (fmChanged || needsRename) {
        console.log(`would migrate: ${currentBase} -> ${filenameNeeded}`);
        changed++;
      }
      continue;
    }

    if (fmChanged) {
      writeMatch(f, newFm, content);
      changed++;
    }

    if (needsRename) {
      if (fs.existsSync(targetPath) && targetPath !== f) {
        warnings.push(
          `${f}: destino já existe (${targetPath}), mantendo nome atual`
        );
      } else {
        fs.renameSync(f, targetPath);
        renamed++;
      }
    }
  }

  console.log(
    `migrate: ${changed} frontmatters alterados, ${renamed} arquivos renomeados, ${skipped} pulados`
  );
  if (warnings.length) {
    console.log("\nAvisos:");
    for (const w of warnings) console.log("  - " + w);
  }
  nextStep("Rode `npm run hronir:doctor` para confirmar zero inconsistências.");
}

export function doctor() {
  const pathToKey = buildPathToKeyIndex();
  const issues = [];
  // Non-blocking findings: expected, self-healing states that shouldn't fail
  // CI (e.g. a translation group temporarily on different revisions — see
  // RFC 0010 §4.4 amendment 2026-07-01, common now that selection has no
  // hysteresis to hold languages back while a sibling catches up).
  const warnings: string[] = [];

  if (fs.existsSync(SESSION_PATH)) {
    issues.push(
      `Sessão ativa do Hronir detectada (${SESSION_PATH}). Finalize a rodada antes de commitar.`
    );
  }

  // Validate the perspectives directory once up front so a malformed
  // file is caught even when no match references it yet.
  try {
    const ps = listPerspectives();
    if (ps.length === 0) {
      issues.push(
        `scripts/hronir/perspectives/: nenhum arquivo de perspectiva encontrado.`
      );
    }
  } catch (e: unknown) {
    issues.push(`scripts/hronir/perspectives/: ${(e as Error).message}`);
  }

  // UUIDs vivos por slug (atual + legacy de cada peer), lazy por diretório,
  // e o conjunto slug@uuid do registro de podas — base da checagem estrita
  // de versões-fantasma em rate files stars-v2.
  const dirUuidsBySlug = new Map<string, Set<string>>();
  const dirUuids = (slug: string): Set<string> => {
    let s = dirUuidsBySlug.get(slug);
    if (!s) {
      s = new Set();
      for (const v of listDirVersions(slug)) {
        s.add(v.uuid);
        s.add(v.legacyUuid);
      }
      dirUuidsBySlug.set(slug, s);
    }
    return s;
  };
  const prunedUuids = new Set<string>();
  if (fs.existsSync(PRUNED_PATH)) {
    try {
      const reg = JSON.parse(fs.readFileSync(PRUNED_PATH, "utf8"));
      for (const e of reg.pruned ?? []) {
        if (e.uuid) prunedUuids.add(`${e.slug}@${e.uuid}`);
        if (e.legacyUuid) prunedUuids.add(`${e.slug}@${e.legacyUuid}`);
      }
    } catch (e: unknown) {
      issues.push(`${PRUNED_PATH}: não parseia (${(e as Error).message})`);
    }
  }

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const base = path.basename(f);

    if (!data.run_id) issues.push(`${base}: sem run_id`);
    if (!data.post_a || !data.post_b) {
      issues.push(`${base}: post_a/post_b faltando`);
      continue;
    }

    const postA = data.post_a as Record<string, unknown>;
    const postB = data.post_b as Record<string, unknown>;
    if (postA.slug || postB.slug) {
      issues.push(`${base}: ainda usa 'slug' (formato legado)`);
    }

    const aKey = postA.key as string | undefined;
    const bKey = postB.key as string | undefined;
    const aPath = postA.path as string | undefined;
    const bPath = postB.path as string | undefined;
    const aVersion = postA.version as string | undefined;
    const bVersion = postB.version as string | undefined;

    // RFC 0010 §4.3: path é cache de resolução, version (UUID) é identidade.
    // Após a migração (index.* → v-*), um select ou um prune, o path gravado
    // no rate file pode deixar de existir. Para stars-v2 o UUID precisa
    // resolver de verdade: um peer atual (uuid ou legacy) ou uma entrada no
    // registro de podas — senão é versão-fantasma (typo, deleção acidental).
    // stars-v1 gravou o UUID body-only da época do duelo; edições in-place
    // posteriores tornam esse hash irrecuperável, então basta a pasta do
    // post existir.
    const isRefSchema = REF_SCHEMAS.has(String(data.prompt_version));
    const tolerableGone = (
      p: string | undefined,
      version: string | undefined
    ) => {
      if (!p || !version || !fs.existsSync(path.dirname(p))) return false;
      if (!isRefSchema) return true;
      const slug = path.basename(path.dirname(p));
      return (
        dirUuids(slug).has(version) || prunedUuids.has(`${slug}@${version}`)
      );
    };

    if (!aKey) issues.push(`${base}: post_a.key ausente`);
    if (!bKey) issues.push(`${base}: post_b.key ausente`);
    if ((!aPath || !fs.existsSync(aPath)) && !tolerableGone(aPath, aVersion))
      issues.push(`${base}: post_a.path inexistente (${aPath})`);
    if ((!bPath || !fs.existsSync(bPath)) && !tolerableGone(bPath, bVersion))
      issues.push(`${base}: post_b.path inexistente (${bPath})`);

    if (aPath && fs.existsSync(aPath)) {
      const expected = pathToKey.get(aPath);
      if (expected && aKey && expected !== aKey) {
        issues.push(
          `${base}: post_a.key=${aKey} mas translationKey real é ${expected}`
        );
      }
    }
    if (bPath && fs.existsSync(bPath)) {
      const expected = pathToKey.get(bPath);
      if (expected && bKey && expected !== bKey) {
        issues.push(
          `${base}: post_b.key=${bKey} mas translationKey real é ${expected}`
        );
      }
    }

    // Schema detection.
    //   - stars-v1: explicit prompt_version marker only. We deliberately do
    //     NOT infer stars-schema from a stray rate_a/rate_b field, so a
    //     hand-edited legacy match doesn't get retroactively reclassified.
    //   - new-schema (pre-stars): `agent_id` set, prose in frontmatter.
    //   - legacy: neither marker — accepted as-is for historical compatibility.
    const isStarsSchema = STARS_SCHEMAS.has(String(data.prompt_version));
    const isNewSchema = !!data.agent_id || isStarsSchema;

    // Stars-schema invariants are independent of agent_id presence: a match
    // produced by the new flow must pass them regardless of whether the file
    // also has the agent_id field (which is itself required below).
    if (isStarsSchema && data.winner !== "TODO") {
      if (!data.agent_id || data.agent_id === "TODO") {
        issues.push(`${base}: o campo 'agent_id' está ausente ou é 'TODO'`);
      }
      if (!data.clash || data.clash === "TODO") {
        issues.push(
          `${base}: o campo 'clash' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.clash) < MIN_WORDS) {
        issues.push(
          `${base}: 'clash' tem ${wordCount(data.clash)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.clash)) {
        issues.push(
          `${base}: 'clash' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (
        !data.eval_lang ||
        typeof data.eval_lang !== "string" ||
        !data.eval_lang.trim()
      ) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
      }
      // RFC 0012 §6: stars-v3 carries explicit language provenance. Validated
      // only for stars-v3 — older files stay legacy and are not reproved.
      if (String(data.prompt_version) === "stars-v3") {
        const reviewLang = data.review_lang;
        const aContentLang = (data.post_a as Record<string, unknown> | null)
          ?.content_lang as string | undefined;
        const bContentLang = (data.post_b as Record<string, unknown> | null)
          ?.content_lang as string | undefined;
        if (
          !reviewLang ||
          typeof reviewLang !== "string" ||
          !reviewLang.trim()
        ) {
          issues.push(`${base}: stars-v3 sem 'review_lang'`);
        }
        if (!aContentLang) {
          issues.push(`${base}: stars-v3 sem 'post_a.content_lang'`);
        }
        if (!bContentLang) {
          issues.push(`${base}: stars-v3 sem 'post_b.content_lang'`);
        }
        // Version duel: both sides are the same linguistic version, so the
        // critique must be written in that content language (RFC 0012 §6 rule 3).
        if (
          aKey &&
          bKey &&
          aKey === bKey &&
          typeof reviewLang === "string" &&
          aContentLang &&
          reviewLang !== aContentLang
        ) {
          issues.push(
            `${base}: duelo de versão stars-v3 com review_lang≠content_lang (${reviewLang}≠${aContentLang})`
          );
        }
      }
      const ra = data.rate_a;
      const rb = data.rate_b;
      if (!isValidRate(ra)) {
        issues.push(
          `${base}: 'rate_a' deve ser número 1.00-5.00 com até duas decimais (got ${ra})`
        );
      }
      if (!isValidRate(rb)) {
        issues.push(
          `${base}: 'rate_b' deve ser número 1.00-5.00 com até duas decimais (got ${rb})`
        );
      }
      if (isValidRate(ra) && isValidRate(rb)) {
        // Compare at the two-decimal-rounded integer level so drifted floats
        // (e.g. 4.25000001 vs 4.25) are caught as ties, matching how
        // parseRate stores values and how isValidRate tolerates drift.
        const ra100 = Math.round((ra as number) * 100);
        const rb100 = Math.round((rb as number) * 100);
        if (ra100 === rb100) {
          issues.push(`${base}: rate_a == rate_b (${ra}); empate proibido`);
        } else {
          const derivedWinner = ra100 > rb100 ? "a" : "b";
          if (data.winner !== derivedWinner) {
            issues.push(
              `${base}: winner=${data.winner} não bate com rate_a=${ra}, rate_b=${rb} (derivado: ${derivedWinner})`
            );
          }
        }
      }
      if (!data.review_a || data.review_a === "TODO") {
        issues.push(
          `${base}: o campo 'review_a' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.review_a) < MIN_WORDS) {
        issues.push(
          `${base}: 'review_a' tem ${wordCount(data.review_a)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.review_a)) {
        issues.push(
          `${base}: 'review_a' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (!data.review_b || data.review_b === "TODO") {
        issues.push(
          `${base}: o campo 'review_b' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.review_b) < MIN_WORDS) {
        issues.push(
          `${base}: 'review_b' tem ${wordCount(data.review_b)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.review_b)) {
        issues.push(
          `${base}: 'review_b' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (!data.perspective_id) {
        issues.push(
          `${base}: o campo 'perspective_id' está ausente (obrigatório para schema stars)`
        );
      } else {
        try {
          loadPerspective(String(data.perspective_id));
        } catch (e: unknown) {
          issues.push(
            `${base}: perspective_id "${data.perspective_id}" não corresponde a nenhum arquivo em scripts/hronir/perspectives/`
          );
        }
      }
      if (data.evaluator_mood_after != null) {
        const moodAfter = String(data.evaluator_mood_after).trim();
        if (moodAfter.length > 250) {
          issues.push(
            `${base}: 'evaluator_mood_after' tem ${moodAfter.length} chars (máximo 250)`
          );
        }
        if (MOODS.includes(moodAfter)) {
          issues.push(
            `${base}: 'evaluator_mood_after' é idêntico a um mood pré-definido — escreva algo original em primeira pessoa`
          );
        }
      }
      // Impression stub detection: Jules used "-- Impression A for [slug] under [perspective]"
      // as a placeholder comment. Real first-impressions are actual prose.
      const STUB_IMPRESSION_RE = /^-- Impression [AB] for /;
      if (
        data.impression_a != null &&
        STUB_IMPRESSION_RE.test(String(data.impression_a))
      ) {
        issues.push(
          `${base}: 'impression_a' é um stub de template, não uma impressão real`
        );
      }
      if (
        data.impression_b != null &&
        STUB_IMPRESSION_RE.test(String(data.impression_b))
      ) {
        issues.push(
          `${base}: 'impression_b' é um stub de template, não uma impressão real`
        );
      }
    } else if (isNewSchema && data.winner !== "TODO") {
      // Pre-stars new-schema matches: require the fields exist but don't
      // enforce the 100-word floor retroactively (rule did not exist at write time).
      if (!data.clash || data.clash === "TODO") {
        issues.push(
          `${base}: o campo 'clash' no frontmatter está ausente ou é 'TODO'`
        );
      }
      if (
        !data.eval_lang ||
        typeof data.eval_lang !== "string" ||
        !data.eval_lang.trim()
      ) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
      }
      // Accept either the original winner_defense/loser_critique fields OR the
      // migrated review_a/review_b fields (migrate-passion-to-stars.js converts
      // passion-v1 files to the stars-v1 field layout while preserving prompt_version).
      const hasMigratedContent =
        (data.review_a && data.review_a !== "TODO") ||
        (data.review_b && data.review_b !== "TODO");
      if (!hasMigratedContent) {
        if (!data.winner_defense || data.winner_defense === "TODO") {
          issues.push(
            `${base}: o campo 'winner_defense' no frontmatter está ausente ou é 'TODO'`
          );
        }
        if (!data.loser_critique || data.loser_critique === "TODO") {
          issues.push(
            `${base}: o campo 'loser_critique' no frontmatter está ausente ou é 'TODO'`
          );
        }
      }
    }

    const expectedName = `${data.run_id}_${aKey}_x_${bKey}.md`;
    if (aKey && bKey && base !== expectedName) {
      issues.push(
        `${base}: nome de arquivo difere do esperado (${expectedName})`
      );
    }
  }

  // RFC 0010: selection-v1 validation. Every entry must point at an existing
  // file whose UUID matches; no two versions in a directory may share a UUID;
  // every directory with a publishable version must be selected; selected
  // versions of a translation group should sit on the same revision.
  {
    const selection = readSelection();
    if (Object.keys(selection).length === 0) {
      issues.push(
        `${SELECTION_PATH}: ausente ou vazio — rode \`npm run hronir:select\`.`
      );
    }
    for (const [slug, entry] of Object.entries(selection)) {
      const p = path.join("src/content/blog", entry.file);
      if (!fs.existsSync(p)) {
        issues.push(
          `${SELECTION_PATH}: ${slug} aponta para arquivo inexistente (${entry.file})`
        );
        continue;
      }
      const uuid = getPostUuid(p);
      if (uuid !== entry.uuid) {
        issues.push(
          `${SELECTION_PATH}: ${slug} uuid divergente (registrado ${entry.uuid}, arquivo ${uuid}) — rode \`npm run hronir:select\``
        );
      }
    }
    const groupRevisions = new Map<string, Map<string, string[]>>();
    for (const slug of listVersionSlugs()) {
      const versions = listDirVersions(slug);
      const byUuid = new Map<string, string[]>();
      for (const v of versions) {
        if (!byUuid.has(v.uuid)) byUuid.set(v.uuid, []);
        byUuid.get(v.uuid)!.push(v.file);
      }
      for (const [uuid, files] of byUuid) {
        if (files.length > 1) {
          issues.push(
            `${slug}/: versões com UUID duplicado (${uuid}): ${files.join(", ")} — estado degenerado, remova as cópias`
          );
        }
      }
      if (!selection[slug] && versions.some((v) => v.published)) {
        issues.push(
          `${slug}/: tem versão publicável mas não está em ${SELECTION_PATH} — rode \`npm run hronir:select\``
        );
      }
      // Divergence report (§4.4): selected versions of a translation group
      // should share a revision; null draftCreatedAt never pairs, so groups
      // containing them are skipped (no false positives for new posts).
      const sel = versions.find((v) => v.selected);
      if (sel?.translationKey && sel.draftCreatedAt) {
        if (!groupRevisions.has(sel.translationKey)) {
          groupRevisions.set(sel.translationKey, new Map());
        }
        const revs = groupRevisions.get(sel.translationKey)!;
        if (!revs.has(sel.draftCreatedAt)) revs.set(sel.draftCreatedAt, []);
        revs.get(sel.draftCreatedAt)!.push(slug);
      }
    }
    for (const [key, revs] of groupRevisions) {
      if (revs.size > 1) {
        const detail = [...revs.entries()]
          .map(([rev, slugs]) => `${slugs.join("+")}=${rev}`)
          .join(" vs ");
        warnings.push(
          `grupo "${key}" divergente entre línguas (${detail}) — próxima rodada de draft-worst/select deve reconvergir`
        );
      }
    }
  }

  // Advisory: scheduled-publish front-matter sanity.
  // Flag posts that pair draft:true with a publishDate (operator likely meant
  // one or the other), or that have an invalid publishDate value.
  const now = new Date();
  for (const p of listPosts()) {
    const data = readPost(p);
    const base = path.basename(p);
    if (data.publishDate != null) {
      const pd = new Date(data.publishDate as string | number | Date);
      if (Number.isNaN(pd.valueOf())) {
        issues.push(`${base}: publishDate inválido (${data.publishDate})`);
        continue;
      }
      if (data.draft === true) {
        issues.push(
          `${base}: draft:true combinado com publishDate — escolha um dos dois (publishDate=${pd.toISOString()})`
        );
      }
      const year = pd.getUTCFullYear();
      if (year < 2000 || year > now.getUTCFullYear() + 10) {
        issues.push(
          `${base}: publishDate fora da faixa plausível (${pd.toISOString()})`
        );
      }
    }
  }

  // Single dedup pass: duplicate after-moods + duplicate matches
  const seenAfterMoods = new Map(); // normalised text → first filename
  const seenEvalText = []; // [{ ref: "file#field", shingles: Set }]
  const seen = new Map(); // run_id::pair → first filepath
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const base = path.basename(f);

    if (data.evaluator_mood_after) {
      const norm = String(data.evaluator_mood_after).trim().toLowerCase();
      if (norm) {
        if (seenAfterMoods.has(norm)) {
          issues.push(
            `${base}: 'evaluator_mood_after' duplicado (já aparece em ${seenAfterMoods.get(norm)}) — cada mood deve ser único`
          );
        } else {
          seenAfterMoods.set(norm, base);
        }
      }
    }

    // Lazy-evaluation guard: review_a/review_b/clash prose must not be reused
    // across matches. Catches both verbatim copies and "templated" text where
    // only post names were swapped (near-duplicates), which a low-effort or
    // broken session emits in bulk.
    for (const field of ["review_a", "review_b", "clash"]) {
      const v = data[field];
      if (typeof v === "string" && v.trim()) {
        const shingles = shingleSet(v);
        if (shingles.size >= 10) {
          let dupOf = null;
          for (const prev of seenEvalText) {
            if (jaccard(shingles, prev.shingles) >= 0.85) {
              dupOf = prev.ref;
              break;
            }
          }
          if (dupOf) {
            issues.push(
              `${base}: '${field}' quase-idêntico a ${dupOf} — avaliação preguiçosa/templada; cada review/clash deve ser original`
            );
          } else {
            seenEvalText.push({ ref: `${base}#${field}`, shingles });
          }
        }
      }
    }

    const aKey = (data.post_a as Record<string, unknown>)?.key as
      | string
      | undefined;
    const bKey = (data.post_b as Record<string, unknown>)?.key as
      | string
      | undefined;
    if (!aKey || !bKey) continue;
    const pair = [aKey, bKey].sort().join("|");
    const sig = `${data.run_id}::${pair}`;
    if (seen.has(sig)) {
      issues.push(
        `duplicate: ${path.basename(seen.get(sig))} e ${base} (mesmo run_id + par)`
      );
    } else {
      seen.set(sig, f);
    }
  }

  // RFC 0011: warn about genre field violations in music posts.
  // Warnings (not errors): won't block hronir sessions; guide content cleanup.
  {
    const GENRE_PROMPT_RE = /[:;,]/;
    const selection = readSelection();
    const genreWarnings: string[] = [];
    for (const [slug, entry] of Object.entries(selection)) {
      const p = path.join("src/content/blog", entry.file);
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf-8");
      if (!raw.includes("postType") || !raw.includes("music")) continue;
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[1];
      // Extract genre array items (simple list parsing)
      const genreBlock = fm.match(/^genre:\n((?:  -.+\n?)*)/m);
      if (!genreBlock) continue;
      const items = [...genreBlock[1].matchAll(/  - (.+)/g)].map((m) =>
        m[1].replace(/^["']|["']$/g, "").trim()
      );
      if (items.length > 5) {
        genreWarnings.push(
          `${slug}: genre tem ${items.length} items (máx 5) — rode a migração RFC 0011`
        );
      }
      for (const item of items) {
        if (item.length > 40) {
          genreWarnings.push(
            `${slug}: genre label muito longo (${item.length} chars): "${item.slice(0, 60)}..." — use sunoStyle para descrições longas`
          );
          break;
        }
        if (GENRE_PROMPT_RE.test(item)) {
          genreWarnings.push(
            `${slug}: genre label parece prompt Suno ("${item.slice(0, 60)}"...) — mova para sunoStyle`
          );
          break;
        }
      }
    }
    for (const w of genreWarnings) {
      console.warn(`  [warn] ${w}`);
    }
  }

  // Check for staged files outside the safe commit paths.
  // Only staged files matter — untracked/modified may be build artefacts.
  // Jules sometimes creates temp artefacts (decide_args*.json, rewrite_*.mjs,
  // etc.) that must NOT be staged — the autopilot rejects PRs that touch files
  // outside .routines/hronir/ and src/content/blog/.
  try {
    const SAFE_RE = /^(\.routines\/hronir\/|src\/content\/blog\/)/;
    // --diff-filter=ACMR: only flag Added, Copied, Modified, Renamed — not Deleted (D).
    // Deletions of out-of-scope files are legitimate cleanup; the autopilot only
    // rejects PRs that *add or modify* content outside the safe prefixes.
    const staged = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { encoding: "utf8" }
    )
      .split("\n")
      .filter(Boolean);
    for (const f of staged) {
      if (!SAFE_RE.test(f)) {
        issues.push(
          `Arquivo fora dos caminhos permitidos está staged: ${f} — faça \`git restore --staged ${f}\` antes de commitar (o autopilot rejeita PRs que tocam arquivos fora de .routines/hronir/ e src/content/blog/).`
        );
      }
    }
  } catch {
    // git not available or not a repo — skip silently
  }

  if (warnings.length > 0) {
    console.log(`doctor: ${warnings.length} aviso(s) (não bloqueiam):`);
    for (const w of warnings) console.log("  - " + w);
  }

  if (issues.length === 0) {
    console.log("doctor: 0 inconsistências.");
    return 0;
  }

  console.log(`doctor: ${issues.length} inconsistências:`);
  for (const i of issues) console.log("  - " + i);
  process.exitCode = 1;
  return issues.length;
}

export function end(options: EndOptions = {}) {
  const sessionPath = SESSION_PATH;

  if (options.force) {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    console.log("Sessão finalizada de forma forçada (--force ativa).");
    console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
    return;
  }

  if (fs.existsSync(sessionPath)) {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

    const matchesPending = (session.target ?? 0) > (session.completed ?? 0);
    const midMatch = ["reading_a", "reading_b", "deciding"].includes(
      session.state
    );
    if (midMatch || matchesPending) {
      console.error("Erro: A rodada ainda não foi concluída.");
      console.error(
        `Estado: ${session.state}, ${session.completed ?? 0}/${session.target ?? 0} matches.`
      );
      console.error(
        "Rode `npm run hronir:continue` para retomar, ou `npm run hronir:end -- --force` para descartar a sessão."
      );
      process.exit(1);
    }

    if (
      !options.skipEdit &&
      session.state === "need_edit" &&
      session.worstKey
    ) {
      console.error("Erro: Há uma edição pendente que não foi registrada.");
      console.error(`Post editado: ${session.worstKey}`);
      console.error("");
      console.error(
        "Para registrar suas alterações e encerrar a rodada, rode:"
      );
      console.error(
        `  npm run hronir:draft-commit -- --msg "Sua mensagem explicando o que fez e o porquê"`
      );
      process.exit(1);
    }

    const attest = options.attest?.trim() || null;
    const pledgeFromSession = (session.pledge as string | null) || null;
    fs.unlinkSync(sessionPath);

    if (attest || pledgeFromSession) {
      const border = "═".repeat(80);
      console.log("");
      console.log(border);
      console.log("📜 ENCERRAMENTO DA SESSÃO — DECLARAÇÕES DO AVALIADOR");
      console.log(border);
      if (pledgeFromSession) {
        console.log(`Compromisso inicial: "${pledgeFromSession}"`);
      }
      if (attest) {
        console.log(`Atestado final:      "${attest}"`);
      }
      console.log(border);
      console.log("");
    }
  }
  if (options.skipEdit) {
    console.log("Fase de edição do pior post pulada (--skip-edit ativa).");
  }
  console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
}

export function editCommit(msg: string) {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(
      "Erro: Nenhuma sessão do Hronir ativa. Rode 'npm run hronir:init' primeiro."
    );
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));

  if (session.state !== "need_edit") {
    console.error(
      `Erro: A sessão atual não está na fase de edição (estado: ${session.state}).`
    );
    process.exit(1);
  }

  const worstKey = session.worstKey;
  const drafts = session.drafts || [];

  if (!worstKey) {
    console.error(
      "Erro: worstKey não encontrado na sessão. Sessão pode estar corrompida."
    );
    process.exit(1);
  }

  if (drafts.length === 0) {
    console.error(
      "Erro: nenhum rascunho registrado na sessão. Rode `npm run hronir:draft-worst` novamente."
    );
    process.exit(1);
  }

  // Validate that every draft actually diverged from its canonical (the body
  // UUID changed). An untouched draft means the edit phase wasn't done.
  const timestamp = new Date().toISOString();
  let anyUnchanged = false;
  for (const d of drafts) {
    if (!fs.existsSync(d.draftPath)) {
      console.error(
        `Erro: o rascunho ${d.draftPath} (${d.lang}) não existe mais.`
      );
      anyUnchanged = true;
      continue;
    }
    if (getPostUuid(d.draftPath) === d.canonicalUuid) {
      console.error(
        `Erro: o rascunho ${d.draftPath} (${d.lang}) não foi modificado (UUID igual à canônica).`
      );
      anyUnchanged = true;
    }
  }

  if (anyUnchanged) {
    console.error("Edite TODOS os rascunhos antes de registrar.");
    process.exit(1);
  }

  // Finalize each draft: keep the supersedes link and record the edit message.
  // The selected version is never touched — the draft coexists with it as a
  // competing version (`hronir:select` swaps it in if it wins its duels).
  for (const d of drafts) {
    const parsed = matter(fs.readFileSync(d.draftPath, "utf8"));
    parsed.data.supersedes = d.canonicalUuid;
    parsed.data.draftMsg = msg;
    parsed.data.draftCommittedAt = timestamp;
    delete parsed.data.replacedVersion;
    fs.writeFileSync(
      d.draftPath,
      matter.stringify(parsed.content, parsed.data),
      "utf8"
    );
    console.log(
      `[draft-commit] ${d.draftPath} (${d.lang}): canônica ${d.canonicalUuid} → rascunho ${getPostUuid(d.draftPath)}`
    );
  }

  // Close the session
  fs.unlinkSync(SESSION_PATH);

  console.log("");
  console.log(`✅ Rascunho(s) registrado(s) com sucesso!`);
  console.log(`   Mensagem: "${msg}"`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Post: ${worstKey}`);
  console.log(`   Versões competidoras: ${drafts.length}`);
  console.log("");
  console.log(
    "As versões convivem lado a lado com as selecionadas (intactas) e vão"
  );
  console.log(
    "competir nos próximos duelos. `npm run hronir:select` troca a exibida quando uma vencer."
  );
  console.log("Commit as alterações com git normalmente.");
}

// ── RFC 0010 §4.2/§4.4: ranking-driven selection (amended 2026-07-01) ───────

const PRUNED_PATH = "src/generated/versions-pruned.json";
const PRUNE_MARGIN = 0.5;
const PRUNE_MIN_DUELS = 3;

// Fallback when nothing qualifies (§4.2 rule 2): the version that predates
// any draft challenge — i.e. has no draftCreatedAt — is the safe default,
// never a fresh untested draft. This is what makes rule 2 safe without
// persisted state: an established post's original file always beats an
// unproven challenger by default, and only a genuinely new directory (a
// single version, necessarily without a draftCreatedAt) reaches this via
// "nothing to compare against". If every version already carries a
// draftCreatedAt (the original was pruned), fall back to the oldest by
// filename — still never the newest, which would be the least tested.
function fallbackIncumbent(versions: VersionInfo[]): VersionInfo | null {
  const published = versions.filter((v) => v.published);
  if (published.length === 0) return null;
  return published.find((v) => !v.draftCreatedAt) ?? published[0];
}

// Highest-rated publishable candidate among `versions` (n ≥ SELECT_MIN_DUELS
// required to compete at all — an untested draft doesn't win on a fluke).
// Ties broken by more duels, then newest file. Null when nobody has enough
// evidence yet — the caller falls back to fallbackIncumbent (§4.2 rule 2).
function pickHighestRated(
  ratings: Map<string, { stars: number; n: number }>,
  versions: VersionInfo[]
): VersionInfo | null {
  const rated = versions.filter((v) => {
    if (!v.published) return false;
    const vs = versionStars(ratings, v);
    return vs != null && vs.n >= SELECT_MIN_DUELS;
  });
  if (rated.length === 0) return null;
  return rated.reduce((best, v) => {
    const bs = versionStars(ratings, best)!;
    const vs = versionStars(ratings, v)!;
    if (vs.stars !== bs.stars) return vs.stars > bs.stars ? v : best;
    if (vs.n !== bs.n) return vs.n > bs.n ? v : best;
    return v.file > best.file ? v : best;
  });
}

// RFC 0010 §4.2/§4.4 (amended 2026-07-01): recompute versions-selected.json
// as a pure function of the version-duel ranking and the version files
// currently on disk — no memory of any prior selection (hysteresis was
// dropped; see revision history). For each directory the highest-rated
// publishable version with n ≥ SELECT_MIN_DUELS wins outright; directories
// with no qualified candidate fall back to fallbackIncumbent — the
// pre-draft original, never an untested fresh draft (fixes a P1 found in
// review: falling back to "newest publishable" would publish every
// draft-worst edit immediately, on zero duels).
// Translation groups (§4.4) advance together only to a revision
// (draftCreatedAt) where EVERY sibling's counterpart is individually
// qualified (n ≥ SELECT_MIN_DUELS) — an untested pair must never win by
// default either. Otherwise each sibling decides alone and hronir:doctor
// reports the group as divergent.
export function select({ dryRun = false } = {}) {
  const ratings = computeVersionRatings();

  const dirs = new Map<string, VersionInfo[]>();
  for (const slug of listVersionSlugs()) {
    const versions = listDirVersions(slug);
    if (versions.length > 0) dirs.set(slug, versions);
  }

  // Translation groups (slugs sharing a translationKey). Directories without
  // a key form trivial single-member groups.
  const groups = new Map<string, string[]>();
  for (const [slug, versions] of dirs) {
    const key =
      versions.find((v) => v.translationKey)?.translationKey ??
      `__solo__${slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slug);
  }

  const result: SelectionEntries = {};
  const setResult = (slug: string, v: VersionInfo) => {
    result[slug] = { file: v.file, uuid: v.uuid };
  };

  for (const [, slugs] of groups) {
    const members = slugs.map((s) => ({ slug: s, versions: dirs.get(s)! }));
    let coupled = false;

    if (members.length > 1) {
      // §4.4: revisions with a publishable counterpart in every member.
      const revisionCoverage = new Map<string, number>();
      for (const m of members) {
        const revs = new Set(
          m.versions
            .filter((v) => v.published && v.draftCreatedAt)
            .map((v) => v.draftCreatedAt!)
        );
        for (const r of revs) {
          revisionCoverage.set(r, (revisionCoverage.get(r) ?? 0) + 1);
        }
      }
      const commonRevisions = [...revisionCoverage]
        .filter(([, n]) => n === members.length)
        .map(([r]) => r);

      // A common revision only advances the group when every member's
      // counterpart of it is individually qualified — never on a fresh,
      // untested pair. Among qualifying revisions, prefer the one with the
      // highest worst-case (min across members) rating.
      let best: { rev: string; minStars: number } | null = null;
      for (const rev of commonRevisions) {
        let minStars = Infinity;
        let allQualified = true;
        for (const m of members) {
          const v = m.versions.find(
            (x) => x.published && x.draftCreatedAt === rev
          )!;
          const vs = versionStars(ratings, v);
          if (!vs || vs.n < SELECT_MIN_DUELS) {
            allQualified = false;
            break;
          }
          minStars = Math.min(minStars, vs.stars);
        }
        if (allQualified && (!best || minStars > best.minStars)) {
          best = { rev, minStars };
        }
      }

      if (best) {
        for (const m of members) {
          const v = m.versions.find(
            (x) => x.published && x.draftCreatedAt === best!.rev
          )!;
          setResult(m.slug, v);
          console.log(
            `[select] ${m.slug}: grupo avança para revisão ${best!.rev} (${v.file})`
          );
        }
        coupled = true;
      } else if (commonRevisions.length > 0) {
        console.log(
          `[select] grupo de ${members.map((m) => m.slug).join(", ")}: revisão comum existe mas nenhuma contraparte tem ${SELECT_MIN_DUELS}+ duelos — cada língua decide sozinha`
        );
      }
    }
    if (coupled) continue;

    for (const m of members) {
      const winner =
        pickHighestRated(ratings, m.versions) ?? fallbackIncumbent(m.versions);
      if (winner) setResult(m.slug, winner);
    }
  }

  if (dryRun) {
    console.log("select: dry-run — nada gravado.");
    return;
  }
  const wrote = writeSelection(result);
  console.log(
    wrote
      ? `select: seleção atualizada (${Object.keys(result).length} slugs) em ${SELECTION_PATH}.`
      : `select: nenhuma mudança — ${SELECTION_PATH} intacto.`
  );
}

interface PrunedEntry {
  slug: string;
  uuid: string;
  legacyUuid: string;
  lang: string;
  prunedAt: string;
}

function registerPruned(entries: PrunedEntry[]) {
  let registry: { _meta: { schema: string }; pruned: PrunedEntry[] } = {
    _meta: { schema: "pruned-v1" },
    pruned: [],
  };
  if (fs.existsSync(PRUNED_PATH)) {
    // A malformed registry (merge conflict, partial write) must abort the
    // prune: rebuilding from scratch would silently drop every previously
    // registered permalink — and their source files are already gone, so
    // the redirects would be unrecoverable.
    try {
      registry = JSON.parse(fs.readFileSync(PRUNED_PATH, "utf8"));
    } catch (e) {
      throw new Error(
        `${PRUNED_PATH} existe mas não parseia (${(e as Error).message}). ` +
          "Repare o registro manualmente antes de podar."
      );
    }
    if (!Array.isArray(registry?.pruned)) {
      throw new Error(
        `${PRUNED_PATH} sem o array "pruned" esperado (schema pruned-v1). ` +
          "Repare o registro manualmente antes de podar."
      );
    }
  }
  const seen = new Set(registry.pruned.map((e) => `${e.slug}@${e.uuid}`));
  for (const e of entries) {
    if (seen.has(`${e.slug}@${e.uuid}`)) continue;
    registry.pruned.push(e);
    seen.add(`${e.slug}@${e.uuid}`);
  }
  registry.pruned.sort((a, b) =>
    `${a.slug}@${a.uuid}`.localeCompare(`${b.slug}@${b.uuid}`)
  );
  fs.mkdirSync(path.dirname(PRUNED_PATH), { recursive: true });
  fs.writeFileSync(PRUNED_PATH, JSON.stringify(registry, null, 2) + "\n");
}

// RFC 0010 §4.4: prune non-selected versions that have clearly lost — the
// selected version leads by ≥ PRUNE_MARGIN stars over ≥ PRUNE_MIN_DUELS
// version duels. Never the selected version, never the last file in a
// directory. Every removed slug@uuid is registered in versions-pruned.json so
// the build emits a redirect for its public permalink (no 404s).
export function prune({ dryRun = false } = {}) {
  const ratings = computeVersionRatings();
  const selection = readSelection();
  const removed: Array<{ v: VersionInfo; margin: number; n: number }> = [];

  for (const slug of Object.keys(selection)) {
    const versions = listDirVersions(slug);
    const selected = versions.find((v) => v.selected);
    if (!selected) continue;
    const selStars = versionStars(ratings, selected);
    if (!selStars) continue;
    for (const v of versions) {
      if (v.selected) continue;
      const vs = versionStars(ratings, v);
      if (!vs) continue;
      const margin = selStars.stars - vs.stars;
      if (vs.n >= PRUNE_MIN_DUELS && margin >= PRUNE_MARGIN) {
        removed.push({ v, margin, n: vs.n });
      }
    }
  }

  if (removed.length === 0) {
    console.log("prune: nenhuma versão elegível para poda.");
    return;
  }

  // Register permalinks BEFORE deleting: registerPruned aborts on a
  // malformed registry, and at that point nothing has been removed yet. A
  // crash between the write and the unlinks leaves at worst a redirect for
  // a still-existing version, which the next prune run cleans up.
  if (!dryRun) {
    const prunedAt = new Date().toISOString();
    registerPruned(
      removed.map(({ v }) => ({
        slug: v.slug,
        uuid: v.uuid,
        legacyUuid: v.legacyUuid,
        lang: v.lang,
        prunedAt,
      }))
    );
  }

  for (const { v, margin, n } of removed) {
    if (dryRun) {
      console.log(
        `[prune dry-run] ${v.path} (-${margin.toFixed(2)}★ vs selecionada, n=${n})`
      );
    } else {
      fs.unlinkSync(v.path);
      console.log(
        `[prune] removido ${v.path} (-${margin.toFixed(2)}★ vs selecionada, n=${n}) — permalink registrado em ${PRUNED_PATH}`
      );
    }
  }

  const label = dryRun ? "dry-run" : "removida(s)";
  console.log(`\nprune: ${removed.length} versão(ões) ${label}.`);
  if (dryRun) {
    console.log("Rode sem --dry-run para remover.");
  }
}
