#!/usr/bin/env node
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
  worst,
  editWorst,
  migrate,
  doctor,
  end,
  editCommit,
  next,
} = await import("./lib/commands.js");

const [, , cmd, ...args] = process.argv;

function usage() {
  console.error(
    "Uso: hronir {next --agent-id <id> [init-opts]|init --agent-id <id> [--matches N] [--skip-edit] [--skip-rating] [--eval-lang <lang>] [--min-appearances N]|continue|decide --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a <text> --review-b <text> --clash <text> [--agent-id <id>] [--perspective <id>] [--eval-lang <lang>]|ranking|worst|edit-worst|edit-commit --msg <text>|migrate [--dry-run]|doctor|end [--skip-edit] [--force]}"
  );
  process.exit(1);
}

switch (cmd) {
  case "init": {
    let matchesOpt = 10;
    const mIdx = args.indexOf("--matches");
    if (mIdx !== -1 && args[mIdx + 1]) {
      matchesOpt = parseInt(args[mIdx + 1], 10) || 10;
    }
    const skipEdit = args.includes("--skip-edit");
    const skipRating = args.includes("--skip-rating");
    if (skipRating) {
      matchesOpt = 0;
    }
    let agentId = null;
    const agentIdIdx =
      args.indexOf("--agent-id") !== -1
        ? args.indexOf("--agent-id")
        : args.indexOf("--agent");
    if (agentIdIdx !== -1 && args[agentIdIdx + 1]) {
      agentId = args[agentIdIdx + 1];
    }
    let evalLang = "pt";
    const evalLangIdx =
      args.indexOf("--eval-lang") !== -1
        ? args.indexOf("--eval-lang")
        : args.indexOf("--lang");
    if (evalLangIdx !== -1 && args[evalLangIdx + 1]) {
      evalLang = args[evalLangIdx + 1];
    }
    let minAppearances = null;
    const minAppIdx =
      args.indexOf("--min-appearances") !== -1
        ? args.indexOf("--min-appearances")
        : args.indexOf("--min-app");
    if (minAppIdx !== -1 && args[minAppIdx + 1]) {
      minAppearances = parseInt(args[minAppIdx + 1], 10) || null;
    }
    init({
      matches: matchesOpt,
      skipEdit,
      skipRating,
      agentId,
      evalLang,
      minAppearances,
    });
    break;
  }
  case "continue":
    continueCmd();
    break;
  case "next":
  case "auto": {
    let matchesOpt = 10;
    const mIdx = args.indexOf("--matches");
    if (mIdx !== -1 && args[mIdx + 1]) {
      matchesOpt = parseInt(args[mIdx + 1], 10) || 10;
    }
    const skipEdit = args.includes("--skip-edit");
    const skipRating = args.includes("--skip-rating");
    if (skipRating) matchesOpt = 0;
    let agentId = null;
    const agentIdIdx =
      args.indexOf("--agent-id") !== -1
        ? args.indexOf("--agent-id")
        : args.indexOf("--agent");
    if (agentIdIdx !== -1 && args[agentIdIdx + 1])
      agentId = args[agentIdIdx + 1];
    let evalLang = "pt";
    const evalLangIdx =
      args.indexOf("--eval-lang") !== -1
        ? args.indexOf("--eval-lang")
        : args.indexOf("--lang");
    if (evalLangIdx !== -1 && args[evalLangIdx + 1])
      evalLang = args[evalLangIdx + 1];
    let minAppearances = null;
    const minAppIdx =
      args.indexOf("--min-appearances") !== -1
        ? args.indexOf("--min-appearances")
        : args.indexOf("--min-app");
    if (minAppIdx !== -1 && args[minAppIdx + 1])
      minAppearances = parseInt(args[minAppIdx + 1], 10) || null;
    next({
      matches: matchesOpt,
      skipEdit,
      skipRating,
      agentId,
      evalLang,
      minAppearances,
    });
    break;
  }
  case "decide":
    decide(args);
    break;
  case "ranking":
    ranking();
    break;
  case "worst":
    worst();
    break;
  case "edit-worst":
    editWorst();
    break;
  case "end": {
    const skipEdit = args.includes("--skip-edit");
    const force = args.includes("--force");
    end({ skipEdit, force });
    break;
  }
  case "edit-commit":
  case "edit": {
    if (cmd === "edit" && args[0] !== "commit") {
      usage();
    }
    const remaining = cmd === "edit" ? args.slice(1) : args;
    let msg = "";
    const msgIdx =
      remaining.indexOf("--msg") !== -1
        ? remaining.indexOf("--msg")
        : remaining.indexOf("-m");
    if (msgIdx !== -1 && remaining[msgIdx + 1]) {
      msg = remaining[msgIdx + 1];
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
  case "migrate":
    migrate({ dryRun: args.includes("--dry-run") });
    break;
  case "doctor":
    doctor();
    break;
  default:
    usage();
}
