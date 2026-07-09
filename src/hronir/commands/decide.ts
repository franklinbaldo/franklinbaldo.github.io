import fs from "node:fs";
import path from "node:path";
import { RATES_DIR } from "../posts.js";
import { writeMatch } from "../matches.js";
import { pickRandomPerspective, loadPerspective } from "../perspectives.js";
import {
  SESSION_PATH,
  MIN_WORDS,
  wordCount,
  nextStep,
  utcStamp,
} from "./_shared.js";

// RFC 0010: stars-v2 adds post_a/b.ref ("slug@uuid") to each side. stars-v1
// files (path/key/version fields) remain readable and are never rewritten.
// RFC 0012 §4.2: stars-v3 adds review_lang + per-side content_lang. Older
// schemas stay valid and classified `legacy`; only stars-v3 is validated for
// the new language fields.
const PROMPT_VERSION = "stars-v3";

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
    type: "Rate File",
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
