import fs from "node:fs";
import { rating, predictWin } from "openskill";
import { readPost, getPostUuid } from "../posts.js";
import {
  listAllVersionSlugs,
  listSlugVersions,
  slugForContentPath,
  listEnglishWithKey,
  findTranslations,
  type VersionInfo,
} from "../selection.js";
import { listMatchFiles, readMatch, postKey, gitMtime } from "../matches.js";
import {
  computeRatings,
  computeAbsoluteQuality,
  computeVersionRatings,
  getProtectedPosts,
} from "../ranking.js";
import { pickRandomPerspective, loadPerspective } from "../perspectives.js";
import { pickRandomMood } from "../moods.js";
import {
  type PostSideRaw,
  SESSION_PATH,
  versionStars,
  SELECT_MIN_DUELS,
  printSidePost,
  printDecidePrompt,
  nextStep,
} from "./_shared.js";

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
  for (const slug of listAllVersionSlugs()) {
    const versions = listSlugVersions(slug);
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
  const refFor = (p: string) => `${slugForContentPath(p)}@${getPostUuid(p)}`;
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

export function continueCmd() {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.log("Nenhuma sessão ativa encontrada.");
    nextStep(
      "rode `npx hronir generate-match` para um match avulso, `npm run hronir:init` para uma rodada, ou `npm run hronir:draft-worst`."
    );
    return;
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

  if (session.state === "need_edit") {
    console.log("Fase de matches concluída. Você precisa editar o pior post.");
    nextStep(
      "rode `npm run hronir:draft-worst` para ver os detalhes ou `npm run hronir:end --skip-edit` para ignorar."
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
          "rode `npm run hronir:draft-worst` para ver os detalhes ou `npm run hronir:end --skip-edit` para ignorar."
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
    session.state = "deciding";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    const mood = session.currentMatch?.evaluator_mood;
    try {
      console.log(
        perspectiveBanner(loadPerspective(match.perspective_id), mood)
      );
    } catch (e: unknown) {
      console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
      process.exit(1);
    }
    printSidePost(session, "A");
    printSidePost(session, "B");
    printDecidePrompt(session);
    return;
  }

  // Legacy in-flight states (reading_a / waiting_impression_*) no longer
  // exist (RFC 0016); a session stranded in one of them predates the upgrade.
  if (session.state === "deciding") {
    // Backfill perspective for sessions created before stars-v1.
    if (session.currentMatch && !session.currentMatch.perspective_id) {
      const picked = pickRandomPerspective();
      session.currentMatch.perspective_id = picked.id;
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
      console.log(
        `(perspectiva sorteada para sessão em andamento: ${picked.name})`
      );
    }
    printDecidePrompt(session);
    return;
  }

  console.error(
    `Erro: estado '${session.state}' não existe mais (RFC 0016). Rode \`npm run hronir:end -- --force\` e inicie uma sessão nova.`
  );
  process.exit(1);
}
