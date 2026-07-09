import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { listPosts, readPost, getPostUuid, DRAFTS_DIR } from "../posts.js";
import {
  listSlugVersions,
  slugForContentPath,
  flatCanonicalPath,
  findTranslations,
} from "../selection.js";
import { listMatchFiles, readMatch, postKey } from "../matches.js";
import {
  computeRatings,
  computeVersionRatings,
  MIN_APPEARANCES,
} from "../ranking.js";
import {
  type PostSideRaw,
  SESSION_PATH,
  versionStars,
  SELECT_MIN_DUELS,
  utcStamp,
  nextStep,
} from "./_shared.js";

const SKILLS_DIR = "scripts/hronir/skills";

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
      const slug = slugForContentPath(t.path);
      return listSlugVersions(slug).some(
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
  // draft <slug>/v-<timestamp>.<ext> for the agent to edit. The selected
  // version stays untouched; the draft competes with it in later version
  // duels, and `hronir:select` swaps the winner in when it clears the
  // hysteresis bar. Lineage lives in-repo via `supersedes` (the selected
  // version's content UUID).
  //
  // RFC 0015: where the draft lives depends on the slug's layout — a
  // legacy slug still gets a sibling in its own directory; a flat slug's
  // draft goes to .routines/hronir/drafts/<slug>/ instead, since there's
  // no directory to be a sibling *in* once there's only `<slug>.mdx`.
  const { runId: draftStamp } = utcStamp();
  const draftCreatedAt = new Date().toISOString();
  const drafts = [];
  for (const fileInfo of translationFiles) {
    const canonicalUuid = getPostUuid(fileInfo.path);
    const slug = slugForContentPath(fileInfo.path);
    const dir = flatCanonicalPath(slug)
      ? path.join(DRAFTS_DIR, slug)
      : path.dirname(fileInfo.path);
    fs.mkdirSync(dir, { recursive: true });
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
