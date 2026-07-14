#!/usr/bin/env -S node --import tsx/esm
import { createRequire } from "node:module";

function preflight() {
  const require = createRequire(import.meta.url);
  const required = ["gray-matter", "openskill", "remark"];
  const missing = [];
  for (const pkg of required) {
    try {
      require.resolve(pkg);
    } catch {
      missing.push(pkg);
    }
  }
  if (missing.length > 0) {
    console.error(
      `Erro: dependências ausentes em node_modules: ${missing.join(", ")}.`
    );
    console.error(
      "Rode `npm install` na raiz do projeto antes de chamar o hronir."
    );
    process.exit(1);
  }
}
preflight();

const {
  init,
  continueCmd,
  decide,
  ranking,
  diagnose,
  editWorst,
  migrate,
  doctor,
  end,
  editCommit,
  select,
  prune,
  flatten,
  generateMatch,
  submitEval,
} = await import("../../src/hronir/commands.js");

const [, , cmd, ...args] = process.argv;

function usage() {
  console.error(
    "Uso: hronir {generate-match [init-opts]|submit-eval --agent-id <id> <decide-flags>|init --agent-id <id> [--matches N] [--skip-edit] [--skip-rating] [--eval-lang <lang>] [--review-lang <lang>] [--objective coverage|refine-top|hunt-worst] [--min-appearances N]|continue|decide --after-mood <text> --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a <text> --review-b <text> --clash <text> [--clash-append <text>] [--review-a-append <text>] [--review-b-append <text>]|ranking|diagnose|draft-worst|draft-commit --msg <text>|migrate [--dry-run]|doctor|end [--skip-edit] [--force]|select [--dry-run]|prune [--dry-run]|flatten [--slug <slug>] [--dry-run]}"
  );
  process.exit(1);
}

// Read the value for `flagName` from args. Rejects values that look like
// another flag (i.e. start with `--`) so that `--agent-id --matches 5`
// doesn't silently bind agentId to "--matches".
function readFlagValue(args, indices) {
  for (const idx of indices) {
    if (idx === -1) continue;
    const v = args[idx + 1];
    if (v == null) {
      console.error(`Erro: ${args[idx]} exige um valor.`);
      process.exit(1);
    }
    if (typeof v === "string" && v.startsWith("--")) {
      console.error(
        `Erro: ${args[idx]} exige um valor, mas recebeu outra flag (${v}).`
      );
      process.exit(1);
    }
    return v;
  }
  return null;
}

function parseMatches(raw) {
  if (raw == null) return 10;
  if (!/^\d+$/.test(String(raw).trim())) {
    console.error(
      `Erro: --matches deve ser um inteiro não-negativo (recebido: ${JSON.stringify(raw)}).`
    );
    process.exit(1);
  }
  return Number(String(raw).trim());
}

function parseMinAppearances(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!/^\d+$/.test(s) || Number(s) < 1) {
    console.error(
      `Erro: --min-appearances deve ser um inteiro positivo (recebido: ${JSON.stringify(raw)}).`
    );
    process.exit(1);
  }
  return Number(s);
}

function parseInitOptions(args) {
  const matchesRaw = readFlagValue(args, [args.indexOf("--matches")]);
  const skipEdit = args.includes("--skip-edit");
  const skipRating = args.includes("--skip-rating");
  const agentId = readFlagValue(args, [
    args.indexOf("--agent-id"),
    args.indexOf("--agent"),
  ]);
  const evalLangRaw = readFlagValue(args, [
    args.indexOf("--eval-lang"),
    args.indexOf("--lang"),
  ]);
  const evalLang = evalLangRaw || "pt";
  // RFC 0012 §6: language the review/clash is written in. Defaults to the
  // evaluation language for back-compat; persisted explicitly.
  const reviewLangRaw = readFlagValue(args, [args.indexOf("--review-lang")]);
  const reviewLang = reviewLangRaw || undefined;
  // RFC 0013 §8.2: persisted sampling objective (coverage|refine-top|hunt-worst).
  const objective =
    readFlagValue(args, [args.indexOf("--objective")]) || undefined;
  const minAppRaw = readFlagValue(args, [
    args.indexOf("--min-appearances"),
    args.indexOf("--min-app"),
  ]);
  let matches = parseMatches(matchesRaw);
  if (skipRating) matches = 0;
  const minAppearances = parseMinAppearances(minAppRaw);
  return {
    matches,
    skipEdit,
    skipRating,
    agentId,
    evalLang,
    reviewLang,
    objective,
    minAppearances,
  };
}

switch (cmd) {
  case "init":
    init(parseInitOptions(args));
    break;
  case "continue":
    continueCmd();
    break;
  // One-shot API (RFC 0016), the canonical agent flow: generate-match prints
  // both posts + glyph + decide prompt; submit-eval is decide + auto-close.
  case "generate-match":
    generateMatch(parseInitOptions(args));
    break;
  case "submit-eval":
    submitEval(args);
    break;
  case "decide":
    decide(args);
    break;
  case "ranking":
    ranking();
    break;
  case "diagnose":
    diagnose();
    break;
  case "draft-worst":
    editWorst();
    break;
  case "end": {
    const skipEdit = args.includes("--skip-edit");
    const force = args.includes("--force");
    end({ skipEdit, force });
    break;
  }
  case "draft-commit": {
    let msg = "";
    const msgIdx =
      args.indexOf("--msg") !== -1 ? args.indexOf("--msg") : args.indexOf("-m");
    if (msgIdx !== -1 && args[msgIdx + 1]) {
      msg = args[msgIdx + 1];
    }
    if (!msg) {
      console.error(
        'Erro: Mensagem de commit não especificada. Use --msg "..." ou -m "...".'
      );
      process.exit(1);
    }
    editCommit(msg);
    break;
  }
  case "select":
    select({ dryRun: args.includes("--dry-run") });
    break;
  case "prune":
    prune({ dryRun: args.includes("--dry-run") });
    break;
  case "flatten": {
    const slugArg = readFlagValue(args, [args.indexOf("--slug")]);
    flatten(slugArg, { dryRun: args.includes("--dry-run") });
    break;
  }
  case "migrate":
    migrate({ dryRun: args.includes("--dry-run") });
    break;
  case "doctor":
    doctor();
    break;
  default:
    usage();
}
