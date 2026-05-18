import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, listEnglishWithKey, keyForPath, readPost, listPosts } from "./posts.js";
import { listMatchFiles, readMatch, writeMatch, postKey } from "./matches.js";
import { computeRatings } from "./ranking.js";

const MIN_APPEARANCES = 3;
const SKILLS_DIR = "scripts/hronir/skills";
const ARCHIVE_DIR = path.join(OUT_DIR, "archive");
const EDITS_DIR = path.join(OUT_DIR, "edits");

function utcStamp() {
  const iso = new Date().toISOString();
  return {
    runId: iso.replace(/[:.]/g, "-").replace(/-\d+Z$/, ""),
    runAt: iso.replace(/\.\d+Z$/, "Z"),
  };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextStep(text) {
  console.log("");
  console.log("NEXT STEP: " + text);
}

export function init() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "critiques"), { recursive: true });

  const candidates = listEnglishWithKey();
  const corpusSize = candidates.length;
  if (corpusSize < 4) {
    console.error(`Erro: só ${corpusSize} posts EN com translationKey em src/content/blog (mínimo 4 para formar 2 pares)`);
    process.exit(1);
  }

  const nMatches = Math.min(20, Math.floor(corpusSize / 2));
  console.log(`Corpus: ${corpusSize} posts elegíveis. Criando ${nMatches} matches.`);

  const sample = shuffle(candidates).slice(0, nMatches * 2);
  const { runId, runAt } = utcStamp();
  const created = [];

  for (let i = 0; i < nMatches; i++) {
    let a = sample[i * 2];
    let b = sample[i * 2 + 1];
    if (Math.random() < 0.5) [a, b] = [b, a];

    const file = path.join(
      OUT_DIR,
      `${runId}_${a.translationKey}_x_${b.translationKey}.md`,
    );

    const fm = {
      run_id: runId,
      run_at: runAt,
      match_index: i + 1,
      post_a: { key: a.translationKey, path: a.path },
      post_b: { key: b.translationKey, path: b.path },
      winner: "TODO",
      model: "TODO",
      prompt_version: "passion-v1",
      season: 1,
      override: null,
    };

    writeMatch(file, fm, "\n<!-- TODO -->\n");
    created.push(file);
    console.log(file);
  }

  nextStep(`Para cada arquivo acima, rode \`npm run hronir:present -- <arquivo>\`, leia os dois posts, escolha um, edite o match (winner, model, defesa).`);
  return created;
}

export function present(matchFile) {
  if (!matchFile || !fs.existsSync(matchFile)) {
    console.error("Uso: hronir present <match.md>");
    process.exit(1);
  }
  const { data } = readMatch(matchFile);
  const aPath = data.post_a?.path;
  const bPath = data.post_b?.path;
  if (!aPath || !bPath) {
    console.error("Match sem post_a.path / post_b.path. Rode `hronir migrate` primeiro.");
    process.exit(1);
  }

  console.log("Aqui estão dois posts do blog de Franklin Baldo.\n");
  console.log("=== PRIMEIRO POST ===\n");
  console.log(fs.readFileSync(aPath, "utf8"));
  console.log("\n=== SEGUNDO POST ===\n");
  console.log(fs.readFileSync(bPath, "utf8"));
  console.log("\n---\n");
  console.log("Escolha um. Defenda apaixonadamente a escolha.\n");
  console.log(`Edite ${matchFile}:`);
  console.log("- winner: a (primeiro) ou b (segundo)");
  console.log("- model: identificador do modelo executando");
  console.log("- substitua <!-- TODO --> pelo texto da defesa, em português");

  const stepLines = [
    "A defesa deve ter:",
    "- mínimo 100 palavras (piso de qualidade)",
    "- meta 200 palavras (alvo natural)",
    "- mencionar os dois posts pelo nome ou pela key",
    "- explicar concretamente, não no abstrato",
    "",
    "Defesa muito curta ou genérica perde a função do sistema.",
    "",
    `Editar ${matchFile} com a decisão e a defesa. Quando todos os matches da rodada estiverem preenchidos, rode \`npm run hronir:edit-worst\`. Para retomar do meio da rodada, \`npm run hronir:resume\`.`,
  ];
  nextStep(stepLines.join("\n"));
}

// Ratings via OpenSkill (computeRatings, lib/ranking.js).
// Output: rows ordered by ordinal DESC (best first).

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

    const body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
    if (!body) continue;
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

    const body = (content || "").replace(/^\s*<!--\s*TODO\s*-->\s*$/m, "").trim();
    if (!body) continue;
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

export function editWorst() {
  const rows = computeRatings();
  if (rows.length === 0) {
    console.error("Sem matches preenchidos suficientes para ranquear.");
    process.exit(1);
  }
  const eligible = rows.filter((r) => r.appearances >= MIN_APPEARANCES);
  if (eligible.length === 0) {
    console.log(`Volume insuficiente para edit-worst.`);
    console.log(`Mínimo: ${MIN_APPEARANCES} aparições por post.`);
    console.log(`Elegíveis: ${eligible.length} posts de ${rows.length} no ranking total.`);
    console.log(`Próxima rodada pode acumular mais sinal.`);
    nextStep("nenhum. Termine a rodada com PR só dos matches.");
    return;
  }

  // rows are sorted by ordinal DESC (best first); worst eligible is the last,
  // top 3 are the first three eligible — same threshold applied to both sides
  // so contrast set never comes from low-volume posts.
  const worstRow = eligible[eligible.length - 1];
  const topRows = eligible.slice(0, 3);
  const topKeys = topRows.map((r) => r.key);

  console.log(`# Pior ranqueado (≥${MIN_APPEARANCES} aparições): ${worstRow.key}`);
  console.log(`# Path: ${worstRow.path}`);
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

  // Audit record: skeleton; agent fills skill_used / model / body after editing.
  const editTs = new Date().toISOString().replace(/[:.]/g, "-").replace(/-\d+Z$/, "");
  fs.mkdirSync(EDITS_DIR, { recursive: true });
  const editLogPath = path.join(EDITS_DIR, `${worstRow.key}-${editTs}.md`);
  if (!fs.existsSync(editLogPath)) {
    const editLogFm = {
      post_key: worstRow.key,
      post_path: worstRow.path,
      run_id: editTs,
      model: "TODO",
      skill_used: "TODO (franklin-blog ou franklin-essay)",
      prompt_version: "edit-worst-v2",
      appearances_at_edit: worstRow.appearances,
      wins_at_edit: worstRow.wins,
      defenses_archived_to: path.join(ARCHIVE_DIR, `${worstRow.key}-<timestamp do archive-post>`),
    };
    const body = "\n[Resumo breve: o que foi mudado e por quê, sob qual skill]\n";
    writeMatch(editLogPath, editLogFm, body);
  }
  console.log(`# Edit log: ${editLogPath}`);
  console.log("");

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
    `Siga a skill escolhida ao editar o post em ${worstRow.path}.`,
    "Atenção especial à seção 'Protection against tightening' (blog) e",
    "ao 'Voice-fidelity pass' — o LLM reflex de tighten/smooth/fortify",
    "é a falha mode aqui.",
    "",
    "Diminua o gap observado entre este post e os melhores,",
    "mantendo o espírito do post.",
    "",
    `Após editar, rode: npm run hronir:archive-post ${worstRow.key}`,
  ];
  nextStep(stepLines.join("\n"));
}

export function resume() {
  const files = listMatchFiles();
  if (files.length === 0) {
    console.log("Nenhum match encontrado em .routines/hronir/.");
    nextStep("rode `npm run hronir:init` para começar uma rodada.");
    return;
  }

  const byRun = new Map();
  for (const f of files) {
    const { data } = readMatch(f);
    const runId = String(data.run_id || "");
    if (!runId) continue;
    if (!byRun.has(runId)) byRun.set(runId, []);
    byRun.get(runId).push({ file: f, data });
  }

  if (byRun.size === 0) {
    console.log("Nenhum match com run_id encontrado.");
    nextStep("rode `npm run hronir:init` para começar uma rodada.");
    return;
  }

  const latestRunId = [...byRun.keys()].sort().pop();
  const matches = byRun.get(latestRunId);
  matches.sort((a, b) => (a.data.match_index || 0) - (b.data.match_index || 0));

  const pending = matches.filter((m) => m.data.winner === "TODO" || !m.data.winner);
  const total = matches.length;

  console.log(`# Rodada mais recente: ${latestRunId}`);
  console.log(`# Matches: ${total} total, ${pending.length} pendentes, ${total - pending.length} preenchidos`);
  console.log("");

  if (pending.length === 0) {
    console.log("Todos os matches da rodada estão preenchidos.");
    nextStep("rode `npm run hronir:edit-worst`.");
    return;
  }

  console.log("Pendentes:");
  for (const m of pending) {
    console.log(`  [${m.data.match_index ?? "?"}] ${m.file}`);
  }
  console.log("");

  const first = pending[0].file;
  nextStep(`rode \`npm run hronir:present -- ${first}\` (próximo pendente).`);
}

export function archivePost(key) {
  if (!key) {
    console.error("Uso: hronir archive-post <key>");
    process.exit(1);
  }

  const matched = [];
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    if (aKey === key || bKey === key) matched.push(f);
  }

  if (matched.length === 0) {
    console.log(`Nenhum match encontrado envolvendo key='${key}'.`);
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace(/-\d+Z$/, "");
  const destDir = path.join(ARCHIVE_DIR, `${key}-${ts}`);
  fs.mkdirSync(destDir, { recursive: true });

  for (const f of matched) {
    const dest = path.join(destDir, path.basename(f));
    fs.renameSync(f, dest);
  }

  console.log(`Arquivados ${matched.length} matches em ${destDir}.`);
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
