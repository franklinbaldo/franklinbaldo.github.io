import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { execFileSync } from "node:child_process";
import { rating, predictWin } from "openskill";
import {
  OUT_DIR,
  RATES_DIR,
  listEnglishWithKey,
  keyForPath,
  readPost,
  listPosts,
  getPostUuid,
  findTranslations,
} from "./posts.js";
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

// Word-trigram shingles for near-duplicate detection of review/clash prose.
function shingleSet(text) {
  const words = String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .match(/[\p{L}\p{N}]+/gu);
  const set = new Set();
  if (!words) return set;
  for (let i = 0; i + 2 < words.length; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return set;
}

function jaccard(a, b) {
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
const SKILLS_DIR = "scripts/hronir/skills";
const ARCHIVE_DIR = path.join(OUT_DIR, "archive");
const EDITS_DIR = path.join(OUT_DIR, "edits");
const SESSION_PATH = "hronir_session.json";
const MIN_WORDS = 100;
const PROMPT_VERSION = "stars-v1";
const GITHUB_BLOB_BASE =
  "https://github.com/franklinbaldo/franklinbaldo.github.io/blob";

function currentHeadSha() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

function githubBlobUrl(sha, filepath) {
  return `${GITHUB_BLOB_BASE}/${sha}/${filepath}`;
}

// True if `filepath` has staged or unstaged changes against HEAD, or is
// untracked. Used by edit-worst to refuse running when the working-tree
// content of a target post diverges from the version that the captured
// HEAD permalink will resolve to — otherwise the stored (uuid, url) pair
// in previousVersion would describe two different files.
function isFileDirtyAtHead(filepath) {
  try {
    execFileSync("git", ["diff", "--quiet", "HEAD", "--", filepath], {
      stdio: ["ignore", "ignore", "ignore"],
    });
  } catch {
    return true;
  }
  try {
    execFileSync(
      "git",
      ["diff", "--quiet", "--cached", "HEAD", "--", filepath],
      {
        stdio: ["ignore", "ignore", "ignore"],
      }
    );
  } catch {
    return true;
  }
  return false;
}

function wordCount(s) {
  if (!s || typeof s !== "string") return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function parseRate(raw, flagName) {
  if (raw == null || String(raw).trim() === "") {
    console.error(`Erro: ${flagName} é obrigatório.`);
    process.exit(1);
  }
  const s = String(raw).trim();
  // up to two decimal places, mandatory digit before/after the point if dotted
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    console.error(
      `Erro: ${flagName} deve ser um número entre 1.00 e 5.00 com no máximo duas casas decimais (recebido: ${JSON.stringify(raw)}).`
    );
    process.exit(1);
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    console.error(
      `Erro: ${flagName} deve estar entre 1.00 e 5.00 (recebido: ${JSON.stringify(raw)}).`
    );
    process.exit(1);
  }
  // round to two decimals to avoid float drift in stored data
  return Math.round(n * 100) / 100;
}

function isValidRate(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  if (n < 1 || n > 5) return false;
  // accept up to two decimals (allow small float drift)
  const scaled = n * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function latestMatchTimeByKey() {
  const out = new Map();
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
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
    runId: iso.replace(/[:.]/g, "-").replace(/-\d+Z$/, ""),
    runAt: iso.replace(/\.\d+Z$/, "Z"),
  };
}

function nextStep(text) {
  console.log("");
  console.log(
    "================================================================================"
  );
  console.log("👉 NEXT STEP:");
  console.log(
    "================================================================================"
  );
  console.log(text);
  console.log(
    "================================================================================"
  );
}

export function init(options = {}) {
  console.log(
    `\n\n████████████████████████████████████████████████████████████████████████████████\n█                                                                              █\n█                    🎬 INÍCIO DE UMA NOVA SESSÃO DO HRONIR                     █\n█                                                                              █\n████████████████████████████████████████████████████████████████████████████████\n`
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(RATES_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "critiques"), { recursive: true });

  const skipEdit = !!options.skipEdit;
  const skipRating = !!options.skipRating;
  const agentId = options.agentId;
  if (!agentId || agentId === "TODO") {
    console.error(
      "Erro: --agent-id é obrigatório. Identifique o avaliador explicitamente (ex.: --agent-id claude-opus-4-7 ou --agent-id franklin)."
    );
    process.exit(1);
  }
  const evalLang = options.evalLang || "pt";
  const sessionPath = SESSION_PATH;

  if (skipRating) {
    const session = {
      target: 0,
      completed: 0,
      agentId,
      evalLang,
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

  const matchesOpt = options.matches || 10;
  const session = {
    target: matchesOpt,
    completed: 0,
    agentId,
    evalLang,
    state: "ready_for_next",
    skipEdit,
    skipRating: false,
    currentMatch: null,
    minAppearances: options.minAppearances || null,
  };
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  console.log(
    `Sessão iniciada para ${matchesOpt} matches com agente "${agentId}" e avaliações em "${evalLang}".`
  );
  if (skipEdit) {
    console.log("Fase de edição do pior post será pulada (--skip-edit ativo).");
  }
  continueCmd();
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

function generateNextMatch() {
  const allCandidates = listEnglishWithKey();

  // Exclude posts that currently lead any per-perspective ranking (≥2 duels).
  // A post on top in some perspective has already "won" there; keep the pool
  // moving by giving others a chance to challenge.
  const protected_ = getProtectedPosts(2);
  const candidates =
    protected_.size > 0
      ? allCandidates.filter((c) => !protected_.has(c.translationKey))
      : allCandidates;
  if (protected_.size > 0) {
    console.log(
      `(${protected_.size} post(s) protegido(s) — lideram um ranking de perspectiva: ${[...protected_].join(", ")})`
    );
  }
  // Fallback: if protection would leave fewer than 4 candidates, ignore it.
  const eligible = candidates.length >= 4 ? candidates : allCandidates;

  const ranking = computeRatings();
  const ratingByKey = new Map();
  for (const r of ranking) ratingByKey.set(r.key, { mu: r.mu, sigma: r.sigma });
  const getRating = (key) => ratingByKey.get(key) ?? rating();

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
    const prevTimestamp = postData?.previousVersion?.timestamp
      ? Date.parse(String(postData.previousVersion.timestamp)) || 0
      : 0;
    const mtime = prevTimestamp > 0 ? prevTimestamp : gitMtime(c.path);
    staleByKey.set(c.translationKey, mtime > lastMatch);
  }
  const staleBonus = (key) => (staleByKey.get(key) ? STALE_BONUS : 0);

  // Phase 3 (opt-in): objective-aware sampling. `refine-top` prefers high-level
  // pairs, `hunt-worst` prefers low-level pairs. Level = absolute stars EWMA;
  // posts without stars yet get a neutral 3.0 so they're neither chased nor
  // avoided. Default (env unset) leaves the score untouched.
  const objective = process.env.HRONIR_OBJECTIVE || "";
  const objectiveSign =
    objective === "refine-top" ? 1 : objective === "hunt-worst" ? -1 : 0;
  const levelByKey = new Map();
  if (objectiveSign !== 0) {
    for (const [key, q] of computeAbsoluteQuality())
      levelByKey.set(key, q.stars);
    console.log(`(objetivo de amostragem: ${objective})`);
  }
  const level = (key) => levelByKey.get(key) ?? 3.0;
  const objectiveBonus = (a, b) =>
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
        objectiveBonus(a.translationKey, b.translationKey);
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
  let matchIndex = 1;
  let agentId = "TODO";
  let evalLang = "pt";
  if (fs.existsSync(sessionPath)) {
    const s = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    matchIndex = s.completed + 1;
    agentId = s.agentId || "TODO";
    evalLang = s.evalLang || "pt";
  }

  // For each post, randomly pick which language version to show. The ranking
  // key is always the translationKey (derived from EN), but the evaluator
  // reads whichever language is randomly selected.
  function pickLangVariant(post) {
    const variants = findTranslations(post.translationKey);
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

  console.log(
    `Gerado match ${matchIndex} (active sampling). Perspectiva: ${perspective.name}. Idiomas: ${aVariant.lang}/${bVariant.lang}.`
  );
  return {
    match_index: matchIndex,
    post_a: {
      key: a.translationKey,
      path: aVariant.path,
      display_lang: aVariant.lang,
      version: getPostUuid(aVariant.path),
    },
    post_b: {
      key: b.translationKey,
      path: bVariant.path,
      display_lang: bVariant.lang,
      version: getPostUuid(bVariant.path),
    },
    agent_id: agentId,
    eval_lang: evalLang,
    perspective_id: perspective.id,
    evaluator_mood: evaluatorMood,
    // Random Unicode glyph the evaluator reads subjectively (together with the
    // initial mood and what the match made them feel) to shape the after-mood.
    mood_glyph: randomMoodGlyph(),
  };
}

function perspectiveBanner(perspective, mood) {
  const lines = [
    "================================================================================",
    `🎭 PERSPECTIVA DESTE MATCH: ${perspective.name}`,
    `   id: ${perspective.id}`,
    "================================================================================",
    perspective.summary,
    "",
    perspective.body,
    "================================================================================",
  ];
  if (mood) {
    lines.push(`🌡️  ESTADO DO AVALIADOR: ${mood}`);
    lines.push(
      "================================================================================"
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function continueCmd() {
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
          "rode `npm run hronir:edit-worst` para iniciar a etapa de edição do pior post."
        );
      }
      return;
    }

    console.log(
      `\n=== MATCH ${session.completed + 1} DE ${session.target} ===\n`
    );
    const match = generateNextMatch();
    session.currentMatch = match;
    session.state = "reading_a";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  }

  if (session.state === "reading_a") {
    const aPath = session.currentMatch?.post_a?.path;
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
      } catch (e) {
        console.error(`Erro ao carregar perspectiva: ${e.message}`);
        process.exit(1);
      }
    }

    const aSlug = session.currentMatch?.post_a?.key || "(slug desconhecido)";
    console.log(`=== PRIMEIRO POST (A) — slug: ${aSlug} ===\n`);
    console.log(fs.readFileSync(aPath, "utf8"));
    console.log("\n---\n");

    session.state = "reading_b";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    nextStep(`rode \`npm run hronir:continue\` para ler o SEGUNDO POST.`);
    return;
  }

  if (session.state === "reading_b") {
    const bPath = session.currentMatch?.post_b?.path;
    const perspectiveId = session.currentMatch?.perspective_id;
    let perspective = null;
    if (perspectiveId) {
      try {
        perspective = loadPerspective(perspectiveId);
        console.log(
          `🎭 Lembrete da perspectiva: ${perspective.name} — ${perspective.summary}\n`
        );
      } catch (e) {
        console.error(`Erro ao carregar perspectiva: ${e.message}`);
        process.exit(1);
      }
    }

    const bSlug = session.currentMatch?.post_b?.key || "(slug desconhecido)";
    console.log(`=== SEGUNDO POST (B) — slug: ${bSlug} ===\n`);
    console.log(fs.readFileSync(bPath, "utf8"));
    console.log("\n---\n");

    session.state = "deciding";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    const aSlug = session.currentMatch?.post_a?.key || "(slug desconhecido)";
    const moodGlyph = session.currentMatch?.mood_glyph ?? null;
    const moodGlyphCp = moodGlyph
      ? "U+" +
        moodGlyph.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
      : null;
    const initialMood = session.currentMatch?.evaluator_mood ?? null;

    const perspectiveLine = perspective
      ? `Avalie a partir da perspectiva: ${perspective.name} (id: ${perspectiveId}). A perspectiva é fixa para este match — não há override.`
      : "(sem perspectiva atribuída — sessão inconsistente; rode novamente `npm run hronir:continue`)";

    const stepLines = [
      perspectiveLine,
      "",
      "================================================================================",
      `🔣 SEU GLIFO (Unicode aleatório): ${moodGlyph ?? "—"}  (${moodGlyphCp ?? "—"})`,
      `🌡️  SEU MOOD INICIAL: ${initialMood ?? "—"}`,
      "================================================================================",
      "PRIMEIRO, antes de tudo, decida o seu --after-mood. O Hronir sorteou o",
      "glifo acima por você — leia-o subjetivamente (não há tabela: a forma, o",
      "traço, o que aquele caractere evoca em você, decida como pesa). Combine",
      "essa leitura com o seu mood inicial e com o que estes dois posts e o",
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
      `Para decidir, rode (--after-mood primeiro):`,
      `npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`,
    ];
    nextStep(stepLines.join("\n"));
    return;
  }

  if (session.state === "deciding") {
    nextStep(
      `Você precisa decidir o match atual. Rode (--after-mood primeiro): npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
    );
    return;
  }
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
        `Edite os arquivos do post e rode \`npm run hronir:edit-commit -- --msg "<mensagem>"\` para fechar a rodada.`
      );
      return;
    }
    editWorst();
    return;
  }

  continueCmd();
}

export function decide(args) {
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

  let agentId = session.agentId || "TODO";
  let clash = "";
  let reviewA = "";
  let reviewB = "";
  let rateA = null;
  let rateB = null;
  let afterMood = null;

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
    )
      agentId = args[++i];
    else if (args[i] === "--clash") clash = args[++i];
    else if (args[i] === "--review-a") reviewA = args[++i];
    else if (args[i] === "--review-b") reviewB = args[++i];
    else if (args[i] === "--rate-a") rateA = args[++i];
    else if (args[i] === "--rate-b") rateB = args[++i];
    else if (args[i] === "--after-mood") afterMood = args[++i];
  }

  if (!agentId || agentId === "TODO") {
    console.error(
      "Erro: --agent-id deve ser especificado ou definido no init."
    );
    process.exit(1);
  }

  const parsedRateA = parseRate(rateA, "--rate-a");
  const parsedRateB = parseRate(rateB, "--rate-b");
  if (parsedRateA === parsedRateB) {
    console.error(
      `Erro: --rate-a e --rate-b não podem ser iguais (${parsedRateA.toFixed(2)} x ${parsedRateB.toFixed(2)}). Comprometa-se.`
    );
    process.exit(1);
  }

  const wcClash = wordCount(clash);
  const wcReviewA = wordCount(reviewA);
  const wcReviewB = wordCount(reviewB);
  if (wcClash < MIN_WORDS) {
    console.error(
      `Erro: --clash precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcClash}).`
    );
    process.exit(1);
  }
  if (wcReviewA < MIN_WORDS) {
    console.error(
      `Erro: --review-a precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcReviewA}).`
    );
    process.exit(1);
  }
  if (wcReviewB < MIN_WORDS) {
    console.error(
      `Erro: --review-b precisa ter pelo menos ${MIN_WORDS} palavras (recebido: ${wcReviewB}).`
    );
    process.exit(1);
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
  } catch (e) {
    console.error(`Erro: ${e.message}`);
    process.exit(1);
  }

  const winner = parsedRateA > parsedRateB ? "a" : "b";

  const { runId, runAt } = utcStamp();
  const aKey = currentMatch.post_a.key;
  const bKey = currentMatch.post_b.key;
  const matchFile = path.join(RATES_DIR, `${runId}_${aKey}_x_${bKey}.md`);

  const data = {
    run_id: runId,
    run_at: runAt,
    match_index: currentMatch.match_index,
    post_a: currentMatch.post_a,
    post_b: currentMatch.post_b,
    winner,
    agent_id: agentId,
    eval_lang: currentMatch.eval_lang || session.evalLang || "pt",
    prompt_version: PROMPT_VERSION,
    season: 1,
    override: null,
    perspective_id: perspective.id,
    evaluator_mood: currentMatch.evaluator_mood ?? null,
    mood_glyph: currentMatch.mood_glyph ?? null,
    evaluator_mood_after: afterMood
      ? String(afterMood).trim().slice(0, 250) || null
      : null,
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
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  nextStep("Rode `npm run hronir:continue` para ir para o próximo passo.");
}

function fmt(n, w = 6) {
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

export function worst(options = {}) {
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
      const inner = perPersp.get(id);
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

function collectDefensesForLoser(loserKey, limit = 5) {
  const out = [];
  for (const f of listMatchFiles()) {
    const { data, content } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    const loserSide = winner === "a" ? "b" : "a";
    const loserSideKey = loserSide === "a" ? aKey : bKey;
    const winnerSideKey = winner === "a" ? aKey : bKey;
    if (loserSideKey !== loserKey) continue;

    // Stars-schema matches (post-#stars-v1) carry symmetric review_a/review_b;
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

function collectDefensesForWinners(winnerKeys, limit = 5) {
  const set = new Set(winnerKeys);
  const out = [];
  for (const f of listMatchFiles()) {
    const { data, content } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    const winnerSideKey = winner === "a" ? aKey : bKey;
    const loserSideKey = winner === "a" ? bKey : aKey;
    if (!set.has(winnerSideKey)) continue;

    let body;
    const perspectiveLabel = data.perspective_id
      ? `[Perspectiva]: ${data.perspective_id}\n\n`
      : "";
    if (data.review_a || data.review_b) {
      const c = data.clash && data.clash !== "TODO" ? data.clash : "";
      const winnerReview =
        winner === "a" ? data.review_a || "" : data.review_b || "";
      const rateWinner = winner === "a" ? data.rate_a : data.rate_b;
      const rateLoser = winner === "a" ? data.rate_b : data.rate_a;
      const starsLine =
        rateWinner != null && rateLoser != null
          ? `[Estrelas] vencedor ${rateWinner}★ vs perdedor ${rateLoser}★\n\n`
          : "";
      body = `${perspectiveLabel}${starsLine}[Confronto]\n${c}\n\n[Resenha do vencedor]\n${winnerReview}`;
    } else if (data.clash || data.winner_defense) {
      const c = data.clash && data.clash !== "TODO" ? data.clash : "";
      const w =
        data.winner_defense && data.winner_defense !== "TODO"
          ? data.winner_defense
          : "";
      body = `${perspectiveLabel}[Confronto]\n${c}\n\n[Defesa]\n${w}`;
    } else {
      body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
      if (!body) continue;
      const clashMatch = body.match(
        /# O Confronto\s*\n([\s\S]*?)(?=# O Vencedor|# O Perdedor|$)/i
      );
      const winnerMatch = body.match(
        /# O Vencedor\s*\n([\s\S]*?)(?=# O Confronto|# O Perdedor|$)/i
      );
      if (clashMatch || winnerMatch) {
        const parsedClash = clashMatch ? clashMatch[1].trim() : "";
        const parsedWinner = winnerMatch ? winnerMatch[1].trim() : "";
        body = `[Confronto]\n${parsedClash}\n\n[Defesa]\n${parsedWinner}`;
      }
    }

    out.push({
      file: path.basename(f),
      runId: data.run_id || "",
      runAt: data.run_at || "",
      winner: winnerSideKey,
      loser: loserSideKey,
      body,
    });
  }
  out.sort((a, b) =>
    String(b.runAt || b.runId).localeCompare(String(a.runAt || a.runId))
  );
  return out.slice(0, limit);
}

function getRecentlyEditedKeys(limit = 2) {
  // Cooldown is derived from previousVersion.timestamp on each post's
  // frontmatter (linked-list of edits, only the immediate predecessor is
  // stored per file). Legacy posts still using editHistory[] are honored
  // via fallback. The most recent edit timestamp across all translations
  // of a key wins.
  const latestByKey = new Map();
  for (const p of listPosts()) {
    const data = readPost(p);
    if (!data.translationKey) continue;
    let latest = 0;
    const prev = data.previousVersion;
    if (prev?.timestamp) {
      latest = Date.parse(String(prev.timestamp)) || 0;
    } else if (Array.isArray(data.editHistory)) {
      for (const entry of data.editHistory) {
        const t = entry?.timestamp ? Date.parse(String(entry.timestamp)) : 0;
        if (t > latest) latest = t;
      }
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
  // We skip posts that were edited in the last two edit cycles.
  const recentlyEdited = getRecentlyEditedKeys(2);
  let worstRow = null;
  for (let i = eligible.length - 1; i >= 0; i--) {
    const row = eligible[i];
    if (!recentlyEdited.includes(row.key)) {
      worstRow = row;
      break;
    }
  }

  if (!worstRow) {
    console.log(
      "Aviso: Todos os posts elegíveis foram editados recentemente. Usando o pior colocado absoluto."
    );
    worstRow = eligible[eligible.length - 1];
  }

  const topRows = eligible.filter((r) => r.key !== worstRow.key).slice(0, 3);
  const topKeys = topRows.map((r) => r.key);

  const translationFiles = findTranslations(worstRow.key);

  // Precondition: each target post must match HEAD exactly. The captured
  // HEAD permalink is what will resolve `previousVersion.url`, and the
  // stored uuid is computed from the working-tree file. If the working
  // tree diverges from HEAD, those two would describe different content
  // and the lineage link would be wrong.
  const dirty = translationFiles.filter((f) => isFileDirtyAtHead(f.path));
  if (dirty.length > 0) {
    console.error(
      "Erro: edit-worst requer que os arquivos do post estejam limpos em relação a HEAD"
    );
    console.error(
      "(previousVersion.url aponta para HEAD; uuid é derivado do conteúdo no disco — precisam coincidir)."
    );
    console.error("Arquivos com mudanças não commitadas:");
    for (const f of dirty) console.error(`  - ${f.path}`);
    console.error("Commit ou stash essas mudanças antes de rodar edit-worst.");
    process.exit(1);
  }

  const originalVersions = {};
  const replacedAtCommit = currentHeadSha();
  for (const fileInfo of translationFiles) {
    const uuid = getPostUuid(fileInfo.path);
    if (uuid) {
      originalVersions[fileInfo.lang] = { uuid, path: fileInfo.path };

      // Inject a transient `replacedVersion` marker so edit-commit knows
      // the file is mid-edit. The prior version itself lives in git at
      // ${replacedAtCommit}; we don't snapshot it.
      const raw = fs.readFileSync(fileInfo.path, "utf8");
      const replacedRegex = /^replacedVersion:\s*.*$/m;
      if (replacedRegex.test(raw)) {
        const updated = raw.replace(
          replacedRegex,
          `replacedVersion: "${uuid}"`
        );
        fs.writeFileSync(fileInfo.path, updated, "utf8");
        console.log(
          `[edit-worst] Updated replacedVersion to "${uuid}" in ${fileInfo.path}`
        );
      } else {
        const parts = raw.split("---");
        if (parts.length >= 3) {
          parts[1] = parts[1].trimEnd() + `\nreplacedVersion: "${uuid}"\n`;
          const updated = parts.join("---");
          fs.writeFileSync(fileInfo.path, updated, "utf8");
          console.log(
            `[edit-worst] Injected replacedVersion: "${uuid}" into ${fileInfo.path}`
          );
        }
      }
      console.log(
        `[edit-worst] Prior version of ${fileInfo.path}: ${githubBlobUrl(replacedAtCommit, fileInfo.path)}`
      );
    }
  }

  // Persist worstKey/originalVersions so edit-commit can close the loop,
  // creating a minimal session if edit-worst was invoked standalone.
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
  session.originalVersions = originalVersions;
  session.replacedAtCommit = replacedAtCommit;
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));

  console.log(`# Pior ranqueado (≥${minApps} aparições): ${worstRow.key}`);
  for (const fileInfo of translationFiles) {
    console.log(
      `# Path (${fileInfo.lang}): ${fileInfo.path} (UUIDv5: ${originalVersions[fileInfo.lang]?.uuid || "N/A"})`
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
  const losses = collectDefensesForLoser(worstRow.key, 5);
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
  const wins = collectDefensesForWinners(topKeys, 5);
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
    "Edite o post em TODOS os idiomas listados abaixo (a propriedade 'replacedVersion' já foi injetada automaticamente):",
  ];
  for (const fileInfo of translationFiles) {
    stepLines.push(`- [${fileInfo.lang}] ${fileInfo.path}`);
  }
  stepLines.push(
    "",
    "Diminua o gap observado entre este post e os melhores, mantendo o espírito do post.",
    "",
    "Após concluir as edições, registre as alterações e encerre a rodada rodando:",
    'npm run hronir:edit-commit -- --msg "Sua mensagem explicando o que fez e o porquê"'
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
    const aPath = data.post_a?.path;
    const bPath = data.post_b?.path;
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

    const oldKeyA = postKey(data.post_a);
    const oldKeyB = postKey(data.post_b);
    const hadSlugA = "slug" in (data.post_a || {});
    const hadSlugB = "slug" in (data.post_b || {});
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
  } catch (e) {
    issues.push(`scripts/hronir/perspectives/: ${e.message}`);
  }

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const base = path.basename(f);

    if (!data.run_id) issues.push(`${base}: sem run_id`);
    if (!data.post_a || !data.post_b) {
      issues.push(`${base}: post_a/post_b faltando`);
      continue;
    }

    if (data.post_a.slug || data.post_b.slug) {
      issues.push(`${base}: ainda usa 'slug' (formato legado)`);
    }

    const aKey = data.post_a.key;
    const bKey = data.post_b.key;
    const aPath = data.post_a.path;
    const bPath = data.post_b.path;

    if (!aKey) issues.push(`${base}: post_a.key ausente`);
    if (!bKey) issues.push(`${base}: post_b.key ausente`);
    if (!aPath || !fs.existsSync(aPath))
      issues.push(`${base}: post_a.path inexistente (${aPath})`);
    if (!bPath || !fs.existsSync(bPath))
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
    const isStarsSchema = data.prompt_version === PROMPT_VERSION;
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
      }
      if (
        !data.eval_lang ||
        typeof data.eval_lang !== "string" ||
        !data.eval_lang.trim()
      ) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
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
        const ra100 = Math.round(ra * 100);
        const rb100 = Math.round(rb * 100);
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
      }
      if (!data.review_b || data.review_b === "TODO") {
        issues.push(
          `${base}: o campo 'review_b' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.review_b) < MIN_WORDS) {
        issues.push(
          `${base}: 'review_b' tem ${wordCount(data.review_b)} palavras (mínimo ${MIN_WORDS})`
        );
      }
      if (!data.perspective_id) {
        issues.push(
          `${base}: o campo 'perspective_id' está ausente (obrigatório para schema stars)`
        );
      } else {
        try {
          loadPerspective(String(data.perspective_id));
        } catch (e) {
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

  // Advisory: scheduled-publish front-matter sanity.
  // Flag posts that pair draft:true with a publishDate (operator likely meant
  // one or the other), or that have an invalid publishDate value.
  const now = new Date();
  for (const p of listPosts()) {
    const data = readPost(p);
    const base = path.basename(p);
    if (data.publishDate != null) {
      const pd = new Date(data.publishDate);
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

    const aKey = data.post_a?.key;
    const bKey = data.post_b?.key;
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

  // Check for staged or modified files outside the safe commit paths.
  // Jules sometimes creates temp artefacts (decide_args*.json, rewrite_*.mjs,
  // etc.) that must be deleted before staging — the autopilot rejects PRs that
  // touch files outside .routines/hronir/ and src/content/blog/.
  try {
    const SAFE_RE = /^(\.routines\/hronir\/|src\/content\/blog\/)/;
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
    const untracked = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { encoding: "utf8" }
    )
      .split("\n")
      .filter(Boolean);
    const modified = execFileSync("git", ["diff", "--name-only"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
    for (const f of [...new Set([...staged, ...untracked, ...modified])]) {
      if (!SAFE_RE.test(f)) {
        issues.push(
          `Arquivo fora dos caminhos permitidos: ${f} — delete ou mova antes de commitar (o autopilot rejeita PRs que tocam arquivos fora de .routines/hronir/ e src/content/blog/).`
        );
      }
    }
  } catch {
    // git not available or not a repo — skip silently
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

export function end(options = {}) {
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
        `  npm run hronir:edit-commit -- --msg "Sua mensagem explicando o que fez e o porquê"`
      );
      process.exit(1);
    }

    fs.unlinkSync(sessionPath);
  }
  if (options.skipEdit) {
    console.log("Fase de edição do pior post pulada (--skip-edit ativa).");
  }
  console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
}

export function editCommit(msg) {
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
  const originalVersions = session.originalVersions || {};
  const replacedAtCommit = session.replacedAtCommit;

  if (!worstKey) {
    console.error(
      "Erro: worstKey não encontrado na sessão. Sessão pode estar corrompida."
    );
    process.exit(1);
  }

  if (!replacedAtCommit) {
    console.error(
      "Erro: replacedAtCommit não encontrado na sessão. Rode edit-worst novamente."
    );
    process.exit(1);
  }

  const translationFiles = findTranslations(worstKey);
  if (translationFiles.length === 0) {
    console.error(
      `Erro: Nenhum arquivo de post encontrado para a chave "${worstKey}".`
    );
    process.exit(1);
  }

  const timestamp = new Date().toISOString();
  let anyMissing = false;

  for (const fileInfo of translationFiles) {
    const original = originalVersions[fileInfo.lang];
    const currentUuid = getPostUuid(fileInfo.path);

    if (!original) {
      console.warn(
        `[Aviso] Versão original não registrada para o idioma "${fileInfo.lang}". Pulando.`
      );
      continue;
    }

    if (currentUuid === original.uuid) {
      console.error(
        `Erro: O arquivo ${fileInfo.path} (${fileInfo.lang}) não foi modificado.`
      );
      console.error("Todas as traduções devem ser editadas antes de commitar.");
      anyMissing = true;
    }
  }

  if (anyMissing) {
    process.exit(1);
  }

  // Write previousVersion (immediate predecessor only — linked list via git).
  // Drop the transient replacedVersion marker and legacy editHistory[] in the
  // same pass so each file's frontmatter carries only the one-hop link.
  for (const fileInfo of translationFiles) {
    const original = originalVersions[fileInfo.lang];
    if (!original) continue;

    const raw = fs.readFileSync(fileInfo.path, "utf8");
    const parsed = matter(raw);

    parsed.data.previousVersion = {
      uuid: original.uuid,
      url: githubBlobUrl(replacedAtCommit, original.path),
      timestamp,
      msg,
    };
    delete parsed.data.replacedVersion;
    delete parsed.data.editHistory;

    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(fileInfo.path, updated, "utf8");

    const currentUuid = getPostUuid(fileInfo.path);
    console.log(
      `[edit-commit] Registrado em ${fileInfo.path} (${fileInfo.lang}): uuid anterior ${original.uuid} → novo ${currentUuid}`
    );
  }

  // Close the session
  fs.unlinkSync(SESSION_PATH);

  console.log("");
  console.log(`✅ Edição registrada com sucesso!`);
  console.log(`   Mensagem: "${msg}"`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Post: ${worstKey}`);
  console.log("");
  console.log(
    "Rodada do Hronir encerrada. Commit as alterações com git normalmente."
  );
}
