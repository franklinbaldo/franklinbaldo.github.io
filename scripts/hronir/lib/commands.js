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
import { listMatchFiles, readMatch, writeMatch, postKey } from "./matches.js";
import { computeRatings } from "./ranking.js";
import {
  pickRandomPerspective,
  loadPerspective,
  listPerspectives,
} from "./perspectives.js";

const MIN_APPEARANCES = 3;
const STALE_BONUS = 3.0;
const SKILLS_DIR = "scripts/hronir/skills";
const ARCHIVE_DIR = path.join(OUT_DIR, "archive");
const EDITS_DIR = path.join(OUT_DIR, "edits");
const SESSION_PATH = "hronir_session.json";
const MIN_WORDS = 100;
const PROMPT_VERSION = "stars-v1";

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

function gitMtime(filePath) {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%ct", "--", filePath],
      {
        stdio: ["ignore", "pipe", "ignore"],
      }
    )
      .toString()
      .trim();
    return out ? Number(out) * 1000 : 0;
  } catch {
    return 0;
  }
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

function generateNextMatch() {
  const candidates = listEnglishWithKey();
  const ranking = computeRatings();
  const ratingByKey = new Map();
  for (const r of ranking) ratingByKey.set(r.key, { mu: r.mu, sigma: r.sigma });
  const getRating = (key) => ratingByKey.get(key) ?? rating();

  const lastMatchTime = latestMatchTimeByKey();
  const staleByKey = new Map();
  for (const c of candidates) {
    const lastMatch = lastMatchTime.get(c.translationKey) || 0;
    if (lastMatch === 0) {
      staleByKey.set(c.translationKey, false);
      continue;
    }
    const mtime = gitMtime(c.path);
    staleByKey.set(c.translationKey, mtime > lastMatch);
  }
  const staleBonus = (key) => (staleByKey.get(key) ? STALE_BONUS : 0);

  const pairs = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const ra = getRating(a.translationKey);
      const rb = getRating(b.translationKey);
      const [pA] = predictWin([[ra], [rb]]);
      const score =
        -Math.abs(pA - 0.5) +
        ra.sigma +
        rb.sigma +
        staleBonus(a.translationKey) +
        staleBonus(b.translationKey);
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

  const perspective = pickRandomPerspective();

  console.log(
    `Gerado match ${matchIndex} (active sampling). Perspectiva: ${perspective.name}.`
  );
  return {
    match_index: matchIndex,
    post_a: {
      key: a.translationKey,
      path: a.path,
      version: getPostUuid(a.path),
    },
    post_b: {
      key: b.translationKey,
      path: b.path,
      version: getPostUuid(b.path),
    },
    agent_id: agentId,
    eval_lang: evalLang,
    perspective_id: perspective.id,
  };
}

function perspectiveBanner(perspective) {
  return [
    "================================================================================",
    `🎭 PERSPECTIVA DESTE MATCH: ${perspective.name}`,
    `   id: ${perspective.id}`,
    "================================================================================",
    perspective.summary,
    "",
    perspective.body,
    "================================================================================",
    "",
  ].join("\n");
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
        console.log(perspectiveBanner(loadPerspective(perspectiveId)));
      } catch (e) {
        console.error(`Erro ao carregar perspectiva: ${e.message}`);
        process.exit(1);
      }
    }

    console.log("=== PRIMEIRO POST (A) ===\n");
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

    console.log("=== SEGUNDO POST (B) ===\n");
    console.log(fs.readFileSync(bPath, "utf8"));
    console.log("\n---\n");

    session.state = "deciding";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

    const perspectiveLine = perspective
      ? `Avalie a partir da perspectiva: ${perspective.name} (id: ${perspectiveId}). A perspectiva é fixa para este match — não há override.`
      : "(sem perspectiva atribuída — sessão inconsistente; rode novamente `npm run hronir:continue`)";

    const stepLines = [
      perspectiveLine,
      "",
      "Atribua estrelas (1.00–5.00) a cada post e escreva uma resenha de cada,",
      "depois um confronto. O vencedor é derivado mecanicamente: quem",
      "tiver mais estrelas. Empates são rejeitados — comprometa-se.",
      "",
      "- --rate-a / --rate-b: número de 1.00 a 5.00 com até duas casas decimais (proibido empate)",
      "- --review-a / --review-b: mínimo 100 palavras cada, escritas a partir da perspectiva atribuída",
      "- --clash: mínimo 100 palavras, narra o confronto entre os dois posts pela ótica da perspectiva",
      "",
      `Para decidir, rode:`,
      `npm run hronir:decide --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`,
    ];
    nextStep(stepLines.join("\n"));
    return;
  }

  if (session.state === "deciding") {
    nextStep(
      `Você precisa decidir o match atual. Rode: npm run hronir:decide --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
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
      `Decisão pendente. Rode: npm run hronir:decide --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
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
  console.log(`rank\tkey\tordinal\tmu\tsigma\tW/N`);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    console.log(
      `${i + 1}\t${r.key}\t${fmt(r.ordinal)}\t${fmt(r.mu)}\t${fmt(r.sigma)}\t${r.wins}/${r.appearances}`
    );
  }
  nextStep(
    "Rode `npm run hronir:edit-worst` para iniciar a edição do pior ranqueado (ou `npm run hronir:worst` apenas para inspeção)."
  );
}

export function worst() {
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
  // Cooldown is derived from editHistory[] on each post's frontmatter.
  // The most recent edit timestamp across all translations of a key wins.
  const latestByKey = new Map();
  for (const p of listPosts()) {
    const data = readPost(p);
    if (!data.translationKey) continue;
    const history = Array.isArray(data.editHistory) ? data.editHistory : [];
    if (history.length === 0) continue;
    let latest = 0;
    for (const entry of history) {
      const t = entry?.timestamp ? Date.parse(String(entry.timestamp)) : 0;
      if (t > latest) latest = t;
    }
    if (!latest) continue;
    const key = String(data.translationKey);
    const prev = latestByKey.get(key) || 0;
    if (latest > prev) latestByKey.set(key, latest);
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
  const originalVersions = {};
  for (const fileInfo of translationFiles) {
    const uuid = getPostUuid(fileInfo.path);
    if (uuid) {
      originalVersions[fileInfo.lang] = uuid;
      const langDir = path.join(
        ".routines",
        "hronir",
        "edit-history",
        worstRow.key,
        fileInfo.lang
      );
      fs.mkdirSync(langDir, { recursive: true });
      const destPath = path.join(langDir, `${uuid}.md`);
      fs.copyFileSync(fileInfo.path, destPath);
      console.log(
        `[edit-history] Snapshotted version ${uuid} (${fileInfo.lang}) of ${fileInfo.path} to edit-history/${worstRow.key}/${fileInfo.lang}/${uuid}.md`
      );

      // Automatically inject or update replacedVersion in the post frontmatter
      const raw = fs.readFileSync(fileInfo.path, "utf8");
      const replacedRegex = /^replacedVersion:\s*.*$/m;
      if (replacedRegex.test(raw)) {
        const updated = raw.replace(
          replacedRegex,
          `replacedVersion: "${uuid}"`
        );
        fs.writeFileSync(fileInfo.path, updated, "utf8");
        console.log(
          `[edit-worst] Automatically updated replacedVersion to "${uuid}" in ${fileInfo.path}`
        );
      } else {
        const parts = raw.split("---");
        if (parts.length >= 3) {
          parts[1] = parts[1].trimEnd() + `\nreplacedVersion: "${uuid}"\n`;
          const updated = parts.join("---");
          fs.writeFileSync(fileInfo.path, updated, "utf8");
          console.log(
            `[edit-worst] Automatically injected replacedVersion: "${uuid}" into ${fileInfo.path}`
          );
        }
      }
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
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));

  console.log(`# Pior ranqueado (≥${minApps} aparições): ${worstRow.key}`);
  for (const fileInfo of translationFiles) {
    console.log(
      `# Path (${fileInfo.lang}): ${fileInfo.path} (UUIDv5: ${originalVersions[fileInfo.lang] || "N/A"})`
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
        if (ra === rb) {
          issues.push(`${base}: rate_a == rate_b (${ra}); empate proibido`);
        } else {
          const derivedWinner = ra > rb ? "a" : "b";
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

    const expectedName = `${data.run_id}_${aKey}_x_${bKey}.md`;
    if (aKey && bKey && base !== expectedName) {
      issues.push(
        `${base}: nome de arquivo difere do esperado (${expectedName})`
      );
    }
  }

  // Detect duplicate matches (same run_id + unordered pair of keys)
  const seen = new Map();
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const aKey = data.post_a?.key;
    const bKey = data.post_b?.key;
    if (!aKey || !bKey) continue;
    const pair = [aKey, bKey].sort().join("|");
    const sig = `${data.run_id}::${pair}`;
    if (seen.has(sig)) {
      issues.push(
        `duplicate: ${path.basename(seen.get(sig))} e ${path.basename(f)} (mesmo run_id + par)`
      );
    } else {
      seen.set(sig, f);
    }
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

  if (!worstKey) {
    console.error(
      "Erro: worstKey não encontrado na sessão. Sessão pode estar corrompida."
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
    const originalUuid = originalVersions[fileInfo.lang];
    const currentUuid = getPostUuid(fileInfo.path);

    if (!originalUuid) {
      console.warn(
        `[Aviso] Versão original não registrada para o idioma "${fileInfo.lang}". Pulando.`
      );
      continue;
    }

    if (currentUuid === originalUuid) {
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

  // Inject editHistory into each file's frontmatter
  for (const fileInfo of translationFiles) {
    const originalUuid = originalVersions[fileInfo.lang];
    if (!originalUuid) continue;

    const raw = fs.readFileSync(fileInfo.path, "utf8");
    const parsed = matter(raw);

    if (!Array.isArray(parsed.data.editHistory)) {
      parsed.data.editHistory = [];
    }

    parsed.data.editHistory.push({
      uuid: originalUuid,
      timestamp,
      msg,
    });

    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(fileInfo.path, updated, "utf8");

    const currentUuid = getPostUuid(fileInfo.path);
    console.log(
      `[edit-commit] Registrado em ${fileInfo.path} (${fileInfo.lang}): uuid anterior ${originalUuid} → novo ${currentUuid}`
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
