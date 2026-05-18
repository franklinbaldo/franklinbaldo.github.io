#!/usr/bin/env node
import { init, continueCmd, decide, ranking, worst, editWorst, migrate, doctor, end, editCommit } from "./lib/commands.js";

const [, , cmd, ...args] = process.argv;

function usage() {
  console.error("Uso: hronir {init [--matches N] [--skip-edit] [--skip-rating] [--agent-id <id>] [--eval-lang <lang>] [--min-appearances N]|continue|decide --winner <a_or_b> [--agent-id <id>] --clash <text> --winner-defense <text> --loser-critique <text>|ranking|worst|edit-worst|edit-commit --msg <text>|migrate [--dry-run]|doctor|end [--skip-edit] [--force]}");
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
    let agentId = "human";
    const agentIdIdx = args.indexOf("--agent-id") !== -1 ? args.indexOf("--agent-id") : args.indexOf("--agent");
    if (agentIdIdx !== -1 && args[agentIdIdx + 1]) {
      agentId = args[agentIdIdx + 1];
    }
    let evalLang = "pt";
    const evalLangIdx = args.indexOf("--eval-lang") !== -1 ? args.indexOf("--eval-lang") : args.indexOf("--lang");
    if (evalLangIdx !== -1 && args[evalLangIdx + 1]) {
      evalLang = args[evalLangIdx + 1];
    }
    let minAppearances = null;
    const minAppIdx = args.indexOf("--min-appearances") !== -1 ? args.indexOf("--min-appearances") : args.indexOf("--min-app");
    if (minAppIdx !== -1 && args[minAppIdx + 1]) {
      minAppearances = parseInt(args[minAppIdx + 1], 10) || null;
    }
    init({ matches: matchesOpt, skipEdit, skipRating, agentId, evalLang, minAppearances });
    break;
  }
  case "continue":
    continueCmd();
    break;
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
    const msgIdx = remaining.indexOf("--msg") !== -1 ? remaining.indexOf("--msg") : remaining.indexOf("-m");
    if (msgIdx !== -1 && remaining[msgIdx + 1]) {
      msg = remaining[msgIdx + 1];
    }
    if (!msg) {
      console.error("Erro: Mensagem de commit não especificada. Use --msg \"...\" ou -m \"...\".");
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
