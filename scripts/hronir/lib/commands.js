import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, listEnglishWithKey, keyForPath, readPost, listPosts } from "./posts.js";
import { listMatchFiles, readMatch, writeMatch, postKey } from "./matches.js";

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
  if (candidates.length < 10) {
    console.error(`Erro: só ${candidates.length} posts EN com translationKey em src/content/blog`);
    process.exit(1);
  }

  const sample = shuffle(candidates).slice(0, 10);
  const { runId, runAt } = utcStamp();
  const created = [];

  for (let i = 0; i < 5; i++) {
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

  nextStep(`Editar ${matchFile} com a decisão e a defesa. Quando os 5 matches estiverem preenchidos, rode \`npm run hronir:edit-worst\`.`);
}

function aggregate() {
  const wins = new Map();
  const appearances = new Map();
  const labels = new Map();

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    let winner = data.winner;
    if (data.override && data.override !== "null") winner = data.override;
    if (winner === "TODO" || !winner) continue;

    const aKey = postKey(data.post_a);
    const bKey = postKey(data.post_b);
    if (!aKey || !bKey) continue;

    appearances.set(aKey, (appearances.get(aKey) || 0) + 1);
    appearances.set(bKey, (appearances.get(bKey) || 0) + 1);
    if (data.post_a?.path) labels.set(aKey, data.post_a.path);
    if (data.post_b?.path) labels.set(bKey, data.post_b.path);
    if (winner === "a") wins.set(aKey, (wins.get(aKey) || 0) + 1);
    else if (winner === "b") wins.set(bKey, (wins.get(bKey) || 0) + 1);
  }

  const rows = [];
  for (const [key, a] of appearances) {
    const w = wins.get(key) || 0;
    const score = Math.floor((w * 1000) / a) + a;
    rows.push({ key, wins: w, appearances: a, score, path: labels.get(key) || "" });
  }
  rows.sort((x, y) => x.score - y.score || x.key.localeCompare(y.key));
  return rows;
}

export function ranking() {
  const rows = aggregate();
  for (const r of rows) {
    console.log(`${r.score}\t${r.wins}\t${r.appearances}\t${r.key}`);
  }
  nextStep("Rode `npm run hronir:edit-worst` para iniciar a edição do pior ranqueado (ou `npm run hronir:worst` apenas para inspeção).");
}

export function worst() {
  const rows = aggregate();
  if (rows.length === 0) {
    console.error("Sem matches preenchidos suficientes para ranquear.");
    process.exit(1);
  }
  const w = rows[0];
  console.log(w.key);
  console.error(`(path: ${w.path}, wins: ${w.wins}/${w.appearances}, score: ${w.score})`);
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
  const rows = aggregate();
  if (rows.length === 0) {
    console.error("Sem matches preenchidos suficientes para ranquear.");
    process.exit(1);
  }
  const worstRow = rows[0];
  const topRows = rows.slice(-3).reverse();
  const topKeys = topRows.map((r) => r.key);

  console.log(`# Pior ranqueado: ${worstRow.key}`);
  console.log(`# Path: ${worstRow.path}`);
  console.log(`# Score: ${worstRow.score} (wins ${worstRow.wins}/${worstRow.appearances})`);
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

  nextStep(`edite o post em ${worstRow.path} para diminuir o gap observado entre ele e os melhores, mantendo o espírito do post. Expanda, corte ou reescreva conforme necessário. Não há método prescrito — o resultado é o que importa.`);
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
