import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { execFileSync } from "node:child_process";
import { rating, predictWin } from "openskill";
import { OUT_DIR, RATES_DIR, listEnglishWithKey, keyForPath, readPost, listPosts, getPostUuid, findTranslations } from "./posts.js";
import { listMatchFiles, readMatch, writeMatch, postKey } from "./matches.js";
import { computeRatings } from "./ranking.js";

const MIN_APPEARANCES = 3;
const STALE_BONUS = 3.0;
const SKILLS_DIR = "scripts/hronir/skills";
const ARCHIVE_DIR = path.join(OUT_DIR, "archive");
const EDITS_DIR = path.join(OUT_DIR, "edits");
const SESSION_PATH = "hronir_session.json";

function gitMtime(filePath) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", filePath], {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
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
    const ts = data.run_at instanceof Date
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
  console.log("================================================================================");
  console.log("👉 NEXT STEP:");
  console.log("================================================================================");
  console.log(text);
  console.log("================================================================================");
}

export function init(options = {}) {
  console.log(`\n\n████████████████████████████████████████████████████████████████████████████████\n█                                                                              █\n█                    🎬 INÍCIO DE UMA NOVA SESSÃO DO HRONIR                     █\n█                                                                              █\n████████████████████████████████████████████████████████████████████████████████\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(RATES_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "critiques"), { recursive: true });

  const skipEdit = !!options.skipEdit;
  const skipRating = !!options.skipRating;
  const agentId = options.agentId || "human";
  const evalLang = options.evalLang || "pt";
  const { runId } = utcStamp();
  const sessionPath = SESSION_PATH;

  if (skipRating) {
    const session = {
      target: 0,
      completed: 0,
      runId,
      agentId,
      evalLang,
      state: "need_edit",
      skipEdit: false,
      skipRating: true,
      currentFile: null,
      minAppearances: options.minAppearances || null
    };
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    console.log(`Sessão iniciada diretamente na fase de edição do pior post (--skip-rating ativo).`);
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
    runId,
    agentId,
    evalLang,
    state: "ready_for_next",
    skipEdit,
    skipRating: false,
    currentFile: null,
    minAppearances: options.minAppearances || null
  };
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  console.log(`Sessão iniciada para ${matchesOpt} matches com agente "${agentId}" e avaliações em "${evalLang}".`);
  if (skipEdit) {
    console.log("Fase de edição do pior post será pulada (--skip-edit ativo).");
  }
  continueCmd();
}

function generateNextMatch(runId) {
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
      const score = -Math.abs(pA - 0.5) + ra.sigma + rb.sigma
        + staleBonus(a.translationKey) + staleBonus(b.translationKey);
      pairs.push({ a, b, score, pA, sa: ra.sigma, sb: rb.sigma, jitter: Math.random() });
    }
  }
  pairs.sort((x, y) => (y.score - x.score) || (x.jitter - y.jitter));

  const used = new Set();
  const files = listMatchFiles();
  for (const f of files) {
    const { data } = readMatch(f);
    if (data.winner === "TODO" || !data.winner) {
      if (data.post_a?.key) used.add(data.post_a.key);
      if (data.post_b?.key) used.add(data.post_b.key);
    }
  }

  let chosen = null;
  for (const p of pairs) {
    if (used.has(p.a.translationKey) || used.has(p.b.translationKey)) continue;
    chosen = p;
    break;
  }

  if (!chosen) {
    console.error("Não há pares elegíveis disponíveis no momento.");
    process.exit(1);
  }

  let { a, b } = chosen;
  if (Math.random() < 0.5) [a, b] = [b, a];

  const { runAt } = utcStamp();
  const file = path.join(RATES_DIR, `${runId}_${a.translationKey}_x_${b.translationKey}.md`);

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

  const fm = {
    run_id: runId,
    run_at: runAt,
    match_index: matchIndex,
    post_a: { key: a.translationKey, path: a.path, version: getPostUuid(a.path) },
    post_b: { key: b.translationKey, path: b.path, version: getPostUuid(b.path) },
    winner: "TODO",
    agent_id: agentId,
    eval_lang: evalLang,
    prompt_version: "passion-v1",
    season: 1,
    override: null,
    clash: "TODO",
    winner_defense: "TODO",
    loser_critique: "TODO",
  };

  writeMatch(file, fm, "");
  console.log(`Gerado match ${matchIndex} (active sampling).`);
  return file;
}

export function continueCmd() {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.log("Nenhuma sessão ativa encontrada.");
    nextStep("rode `npm run hronir:init` para começar uma rodada ou `npm run hronir:edit-worst`.");
    return;
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

  if (session.state === "need_edit") {
    console.log("Fase de matches concluída. Você precisa editar o pior post.");
    nextStep("rode `npm run hronir:edit-worst` para ver os detalhes ou `npm run hronir:end --skip-edit` para ignorar.");
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
        console.log(`Sessão de matches concluída! (${session.target} matches avaliados).`);
        nextStep("rode `npm run hronir:edit-worst` para iniciar a etapa de edição do pior post.");
      }
      return;
    }

    console.log(`\n=== MATCH ${session.completed + 1} DE ${session.target} ===\n`);
    const file = generateNextMatch(session.runId);
    session.currentFile = file;
    session.state = "reading_a";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  }

  if (session.state === "reading_a") {
    const { data } = readMatch(session.currentFile);
    const aPath = data.post_a?.path;
    
    console.log("=== PRIMEIRO POST (A) ===\n");
    console.log(fs.readFileSync(aPath, "utf8"));
    console.log("\n---\n");
    
    session.state = "reading_b";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    
    nextStep(`rode \`npm run hronir:continue\` para ler o SEGUNDO POST.`);
    return;
  }

  if (session.state === "reading_b") {
    const { data } = readMatch(session.currentFile);
    const bPath = data.post_b?.path;
    
    console.log("=== SEGUNDO POST (B) ===\n");
    console.log(fs.readFileSync(bPath, "utf8"));
    console.log("\n---\n");
    
    session.state = "deciding";
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    
    const stepLines = [
      "Escolha um vencedor e defenda apaixonadamente a escolha.",
      "- mínimo 100 palavras (piso de qualidade)",
      "- meta 200 palavras (alvo natural)",
      "- mencionar os dois posts pelo nome ou pela key",
      "- orientações sobre formas estimuladas de defesa: citar pontos específicos que deram certo ou falharam, trechos marcantes ou falhas de clareza",
      "",
      `Para decidir, rode:`,
      `npm run hronir:decide --winner <a_or_b> --clash "<confronto>" --winner-defense "<defesa>" --loser-critique "<critica>" (ou passe --agent-id <id> para sobrescrever)`
    ];
    nextStep(stepLines.join("\n"));
    return;
  }

  if (session.state === "deciding") {
    nextStep(`Você precisa decidir o match atual. Rode: npm run hronir:decide --winner <a_or_b> --clash "<confronto>" --winner-defense "<defesa>" --loser-critique "<critica>" (ou passe --agent-id <id> para sobrescrever)`);
    return;
  }
}

export function decide(args) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa. Não é possível decidir.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "deciding") {
    console.error(`Erro: Estado atual é '${session.state}', esperado 'deciding'. Rode npm run hronir:continue.`);
    process.exit(1);
  }

  const matchFile = session.currentFile;

  let winner = "TODO";
  let agentId = session.agentId || "TODO";
  let clash = "";
  let winnerDefense = "";
  let loserCritique = "";
  let evalLang = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--winner") winner = args[++i];
    else if (args[i] === "--agent-id" || args[i] === "--agent" || args[i] === "--model") agentId = args[++i];
    else if (args[i] === "--clash") clash = args[++i];
    else if (args[i] === "--winner-defense" || args[i] === "--defense") winnerDefense = args[++i];
    else if (args[i] === "--loser-critique" || args[i] === "--critique") loserCritique = args[++i];
    else if (args[i] === "--eval-lang" || args[i] === "--lang") evalLang = args[++i];
  }

  if (winner !== "a" && winner !== "b") {
    console.error("Erro: --winner deve ser 'a' ou 'b'.");
    process.exit(1);
  }
  if (!agentId || agentId === "TODO") {
    console.error("Erro: --agent-id deve ser especificado ou definido no init.");
    process.exit(1);
  }
  if (!winnerDefense) {
    console.error("Erro: --winner-defense ou --defense não pode ser vazia.");
    process.exit(1);
  }
  if (!clash) {
    console.error("Erro: --clash não pode ser vazio.");
    process.exit(1);
  }
  if (!loserCritique) {
    console.error("Erro: --loser-critique ou --critique não pode ser vazio.");
    process.exit(1);
  }

  const { data } = readMatch(matchFile);
  data.winner = winner;
  data.agent_id = agentId;
  if (evalLang) {
    data.eval_lang = evalLang;
  }
  data.clash = clash;
  data.winner_defense = winnerDefense;
  data.loser_critique = loserCritique;
  delete data.model;
  delete data.critique;

  writeMatch(matchFile, data, "");

  console.log(`Match ${path.basename(matchFile)} atualizado com sucesso!`);

  session.completed += 1;
  session.state = "ready_for_next";
  session.currentFile = null;
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
    console.log(`${i + 1}\t${r.key}\t${fmt(r.ordinal)}\t${fmt(r.mu)}\t${fmt(r.sigma)}\t${r.wins}/${r.appearances}`);
  }
  nextStep("Rode `npm run hronir:edit-worst` para iniciar a edição do pior ranqueado (ou `npm run hronir:worst` apenas para inspeção).");
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
  console.error(`(path: ${w.path}, wins: ${w.wins}/${w.appearances}, ordinal: ${w.ordinal.toFixed(3)}, mu: ${w.mu.toFixed(3)}, sigma: ${w.sigma.toFixed(3)})`);
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

    // New-schema matches (post-#145) carry the prose in frontmatter fields.
    // Prefer those; fall back to body parsing for legacy matches.
    let body = "";
    let parsedCritique = null;
    if (data.clash || data.winner_defense || data.loser_critique) {
      const c = (data.clash && data.clash !== "TODO") ? data.clash : "";
      const w = (data.winner_defense && data.winner_defense !== "TODO") ? data.winner_defense : "";
      const l = (data.loser_critique && data.loser_critique !== "TODO") ? data.loser_critique : "";
      body = `[Confronto]\n${c}\n\n[Defesa]\n${w}`;
      parsedCritique = l || null;
    } else {
      body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
      if (!body) continue;
      parsedCritique = data.critique || null;
      const clashMatch = body.match(/# O Confronto\s*\n([\s\S]*?)(?=# O Vencedor|# O Perdedor|$)/i);
      const winnerMatch = body.match(/# O Vencedor\s*\n([\s\S]*?)(?=# O Confronto|# O Perdedor|$)/i);
      const loserMatch = body.match(/# O Perdedor\s*\n([\s\S]*?)(?=# O Confronto|# O Vencedor|$)/i);
      if (clashMatch || winnerMatch || loserMatch) {
        const parsedClash = clashMatch ? clashMatch[1].trim() : "";
        const parsedWinner = winnerMatch ? winnerMatch[1].trim() : "";
        const parsedLoser = loserMatch ? loserMatch[1].trim() : "";
        body = `[Confronto]\n${parsedClash}\n\n[Defesa]\n${parsedWinner}`;
        parsedCritique = parsedLoser;
      } else {
        const parts = body.split(/\n---\s*\n\s*(?:#+\s*)?Critique(?:\s*:)?\s*\n/i);
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
  out.sort((a, b) => String(b.runAt || b.runId).localeCompare(String(a.runAt || a.runId)));
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
    if (data.clash || data.winner_defense) {
      const c = (data.clash && data.clash !== "TODO") ? data.clash : "";
      const w = (data.winner_defense && data.winner_defense !== "TODO") ? data.winner_defense : "";
      body = `[Confronto]\n${c}\n\n[Defesa]\n${w}`;
    } else {
      body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
      if (!body) continue;
      const clashMatch = body.match(/# O Confronto\s*\n([\s\S]*?)(?=# O Vencedor|# O Perdedor|$)/i);
      const winnerMatch = body.match(/# O Vencedor\s*\n([\s\S]*?)(?=# O Confronto|# O Perdedor|$)/i);
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
  out.sort((a, b) => String(b.runAt || b.runId).localeCompare(String(a.runAt || a.runId)));
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
    const midMatch = ["reading_a", "reading_b", "deciding"].includes(session.state);
    const matchesPending = (session.target ?? 0) > (session.completed ?? 0);
    if (midMatch || (session.state === "ready_for_next" && matchesPending)) {
      console.error(`Erro: Há um match em andamento (estado: ${session.state}, ${session.completed ?? 0}/${session.target ?? 0}).`);
      console.error(`Finalize a avaliação dos matches com \`npm run hronir:continue\` / \`npm run hronir:decide\` antes de editar o pior post.`);
      process.exit(1);
    }
    if (session.minAppearances !== undefined && session.minAppearances !== null) {
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
    console.log(`Elegíveis: ${eligible.length} posts de ${rows.length} no ranking total.`);
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
    console.log("Aviso: Todos os posts elegíveis foram editados recentemente. Usando o pior colocado absoluto.");
    worstRow = eligible[eligible.length - 1];
  }

  const topRows = eligible.filter(r => r.key !== worstRow.key).slice(0, 3);
  const topKeys = topRows.map((r) => r.key);

  const translationFiles = findTranslations(worstRow.key);
  const originalVersions = {};
  for (const fileInfo of translationFiles) {
    const uuid = getPostUuid(fileInfo.path);
    if (uuid) {
      originalVersions[fileInfo.lang] = uuid;
      const langDir = path.join(".routines", "hronir", "edit-history", worstRow.key, fileInfo.lang);
      fs.mkdirSync(langDir, { recursive: true });
      const destPath = path.join(langDir, `${uuid}.md`);
      fs.copyFileSync(fileInfo.path, destPath);
      console.log(`[edit-history] Snapshotted version ${uuid} (${fileInfo.lang}) of ${fileInfo.path} to edit-history/${worstRow.key}/${fileInfo.lang}/${uuid}.md`);

      // Automatically inject or update replacedVersion in the post frontmatter
      const raw = fs.readFileSync(fileInfo.path, "utf8");
      const replacedRegex = /^replacedVersion:\s*.*$/m;
      if (replacedRegex.test(raw)) {
        const updated = raw.replace(replacedRegex, `replacedVersion: "${uuid}"`);
        fs.writeFileSync(fileInfo.path, updated, "utf8");
        console.log(`[edit-worst] Automatically updated replacedVersion to "${uuid}" in ${fileInfo.path}`);
      } else {
        const parts = raw.split("---");
        if (parts.length >= 3) {
          parts[1] = parts[1].trimEnd() + `\nreplacedVersion: "${uuid}"\n`;
          const updated = parts.join("---");
          fs.writeFileSync(fileInfo.path, updated, "utf8");
          console.log(`[edit-worst] Automatically injected replacedVersion: "${uuid}" into ${fileInfo.path}`);
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
        runId: utcStamp().runId,
        agentId: "human",
        evalLang: null,
        state: "need_edit",
        skipEdit: false,
        skipRating: true,
        currentFile: null,
        minAppearances: minApps,
      };
  session.state = "need_edit";
  session.worstKey = worstRow.key;
  session.originalVersions = originalVersions;
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));

  console.log(`# Pior ranqueado (≥${minApps} aparições): ${worstRow.key}`);
  for (const fileInfo of translationFiles) {
    console.log(`# Path (${fileInfo.lang}): ${fileInfo.path} (UUIDv5: ${originalVersions[fileInfo.lang] || "N/A"})`);
  }
  console.log(`# Ordinal: ${worstRow.ordinal.toFixed(3)} (mu ${worstRow.mu.toFixed(3)}, sigma ${worstRow.sigma.toFixed(3)}, wins ${worstRow.wins}/${worstRow.appearances})`);
  console.log(`# Elegíveis: ${eligible.length} de ${rows.length} no ranking total`);
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
    "npm run hronir:edit-commit -- --msg \"Sua mensagem explicando o que fez e o porquê\""
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
    const fmChanged = oldKeyA !== aKey || oldKeyB !== bKey || hadSlugA || hadSlugB;

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
        warnings.push(`${f}: destino já existe (${targetPath}), mantendo nome atual`);
      } else {
        fs.renameSync(f, targetPath);
        renamed++;
      }
    }
  }

  console.log(`migrate: ${changed} frontmatters alterados, ${renamed} arquivos renomeados, ${skipped} pulados`);
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
    issues.push(`Sessão ativa do Hronir detectada (${SESSION_PATH}). Finalize a rodada antes de commitar.`);
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
    if (!aPath || !fs.existsSync(aPath)) issues.push(`${base}: post_a.path inexistente (${aPath})`);
    if (!bPath || !fs.existsSync(bPath)) issues.push(`${base}: post_b.path inexistente (${bPath})`);

    if (aPath && fs.existsSync(aPath)) {
      const expected = pathToKey.get(aPath);
      if (expected && aKey && expected !== aKey) {
        issues.push(`${base}: post_a.key=${aKey} mas translationKey real é ${expected}`);
      }
    }
    if (bPath && fs.existsSync(bPath)) {
      const expected = pathToKey.get(bPath);
      if (expected && bKey && expected !== bKey) {
        issues.push(`${base}: post_b.key=${bKey} mas translationKey real é ${expected}`);
      }
    }

    // New-schema fields are only required for matches produced by the
    // post-#145 flow (which always sets agent_id). Legacy matches with the
    // old `model` field are accepted as-is.
    const isNewSchema = !!data.agent_id;
    if (isNewSchema && data.winner !== "TODO") {
      if (!data.clash || data.clash === "TODO") {
        issues.push(`${base}: o campo 'clash' no frontmatter está ausente ou é 'TODO'`);
      }
      if (!data.winner_defense || data.winner_defense === "TODO") {
        issues.push(`${base}: o campo 'winner_defense' no frontmatter está ausente ou é 'TODO'`);
      }
      if (!data.loser_critique || data.loser_critique === "TODO") {
        issues.push(`${base}: o campo 'loser_critique' no frontmatter está ausente ou é 'TODO'`);
      }
      if (!data.eval_lang || typeof data.eval_lang !== "string" || !data.eval_lang.trim()) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
      }
    }

    const expectedName = `${data.run_id}_${aKey}_x_${bKey}.md`;
    if (aKey && bKey && base !== expectedName) {
      issues.push(`${base}: nome de arquivo difere do esperado (${expectedName})`);
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
      issues.push(`duplicate: ${path.basename(seen.get(sig))} e ${path.basename(f)} (mesmo run_id + par)`);
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

  if (options.skipEdit) {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    console.log("Fase de edição do pior post pulada (--skip-edit ativa).");
    console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
    return;
  }

  if (fs.existsSync(sessionPath)) {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

    if (session.state === "need_edit" && session.worstKey) {
      console.error("Erro: Há uma edição pendente que não foi registrada.");
      console.error(`Post editado: ${session.worstKey}`);
      console.error("");
      console.error("Para registrar suas alterações e encerrar a rodada, rode:");
      console.error(`  npm run hronir:edit-commit -- --msg "Sua mensagem explicando o que fez e o porquê"`);
      process.exit(1);
    }

    const matchesPending = (session.target ?? 0) > (session.completed ?? 0);
    const midMatch = ["reading_a", "reading_b", "deciding"].includes(session.state);
    if (midMatch || matchesPending) {
      console.error("Erro: A rodada ainda não foi concluída.");
      console.error(`Estado: ${session.state}, ${session.completed ?? 0}/${session.target ?? 0} matches.`);
      console.error("Rode `npm run hronir:continue` para retomar, ou `npm run hronir:end -- --force` para descartar a sessão.");
      process.exit(1);
    }

    fs.unlinkSync(sessionPath);
  }
  console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
}

export function editCommit(msg) {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error("Erro: Nenhuma sessão do Hronir ativa. Rode 'npm run hronir:init' primeiro.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));

  if (session.state !== "need_edit") {
    console.error(`Erro: A sessão atual não está na fase de edição (estado: ${session.state}).`);
    process.exit(1);
  }

  const worstKey = session.worstKey;
  const originalVersions = session.originalVersions || {};

  if (!worstKey) {
    console.error("Erro: worstKey não encontrado na sessão. Sessão pode estar corrompida.");
    process.exit(1);
  }

  const translationFiles = findTranslations(worstKey);
  if (translationFiles.length === 0) {
    console.error(`Erro: Nenhum arquivo de post encontrado para a chave "${worstKey}".`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString();
  let anyMissing = false;

  for (const fileInfo of translationFiles) {
    const originalUuid = originalVersions[fileInfo.lang];
    const currentUuid = getPostUuid(fileInfo.path);

    if (!originalUuid) {
      console.warn(`[Aviso] Versão original não registrada para o idioma "${fileInfo.lang}". Pulando.`);
      continue;
    }

    if (currentUuid === originalUuid) {
      console.error(`Erro: O arquivo ${fileInfo.path} (${fileInfo.lang}) não foi modificado.`);
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
    console.log(`[edit-commit] Registrado em ${fileInfo.path} (${fileInfo.lang}): uuid anterior ${originalUuid} → novo ${currentUuid}`);
  }

  // Close the session
  fs.unlinkSync(SESSION_PATH);

  console.log("");
  console.log(`✅ Edição registrada com sucesso!`);
  console.log(`   Mensagem: "${msg}"`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Post: ${worstKey}`);
  console.log("");
  console.log("Rodada do Hronir encerrada. Commit as alterações com git normalmente.");
}

