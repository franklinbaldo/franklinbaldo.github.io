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
  diagnose,
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
    "Uso: hronir {next --agent-id <id> [init-opts]|init --agent-id <id> [--matches N] [--skip-edit] [--skip-rating] [--eval-lang <lang>] [--min-appearances N]|continue|decide --after-mood <text> --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a <text> --review-b <text> --clash <text>|ranking|worst [--absolute]|diagnose|edit-worst|edit-commit --msg <text>|migrate [--dry-run]|doctor|end [--skip-edit] [--force]}"
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

switch (cmd) {
  case "init": {
    const matchesRaw = readFlagValue(args, [args.indexOf("--matches")]);
    let matchesOpt = matchesRaw != null ? parseInt(matchesRaw, 10) || 10 : 10;
    const skipEdit = args.includes("--skip-edit");
    const skipRating = args.includes("--skip-rating");
    if (skipRating) {
      matchesOpt = 0;
    }
    const agentId = readFlagValue(args, [
      args.indexOf("--agent-id"),
      args.indexOf("--agent"),
    ]);
    const evalLangRaw = readFlagValue(args, [
      args.indexOf("--eval-lang"),
      args.indexOf("--lang"),
    ]);
    const evalLang = evalLangRaw || "pt";
    const minAppRaw = readFlagValue(args, [
      args.indexOf("--min-appearances"),
      args.indexOf("--min-app"),
    ]);
    const minAppearances =
      minAppRaw != null ? parseInt(minAppRaw, 10) || null : null;
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
    const matchesRaw = readFlagValue(args, [args.indexOf("--matches")]);
    let matchesOpt = matchesRaw != null ? parseInt(matchesRaw, 10) || 10 : 10;
    const skipEdit = args.includes("--skip-edit");
    const skipRating = args.includes("--skip-rating");
    if (skipRating) matchesOpt = 0;
    const agentId = readFlagValue(args, [
      args.indexOf("--agent-id"),
      args.indexOf("--agent"),
    ]);
    const evalLangRaw = readFlagValue(args, [
      args.indexOf("--eval-lang"),
      args.indexOf("--lang"),
    ]);
    const evalLang = evalLangRaw || "pt";
    const minAppRaw = readFlagValue(args, [
      args.indexOf("--min-appearances"),
      args.indexOf("--min-app"),
    ]);
    const minAppearances =
      minAppRaw != null ? parseInt(minAppRaw, 10) || null : null;
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
    worst({ absolute: args.includes("--absolute") });
    break;
  case "diagnose":
    diagnose();
    break;
  case "edit-worst":
  case "draft-worst":
    editWorst();
    break;
  case "end": {
    const skipEdit = args.includes("--skip-edit");
    const force = args.includes("--force");
    end({ skipEdit, force });
    break;
  }
  case "edit-commit":
  case "draft-commit":
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
