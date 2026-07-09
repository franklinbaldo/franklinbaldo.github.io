import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, RATES_DIR } from "../posts.js";
import { listEnglishWithKey } from "../selection.js";
import { SESSION_PATH } from "./_shared.js";
import { continueCmd } from "./continue.js";
import { editWorst } from "./edit-worst.js";

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
