#!/usr/bin/env node
import { init, present, ranking, worst, editWorst, archivePost, migrate, doctor } from "./lib/commands.js";

const [, , cmd, ...args] = process.argv;

function usage() {
  console.error("Uso: hronir {init|present <match>|ranking|worst|edit-worst|archive-post <key>|migrate [--dry-run]|doctor}");
  process.exit(1);
}

switch (cmd) {
  case "init":
    init();
    break;
  case "present":
    present(args[0]);
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
  case "archive-post":
    archivePost(args[0]);
    break;
  case "migrate":
    migrate({ dryRun: args.includes("--dry-run") });
    break;
  case "doctor":
    doctor();
    break;
  default:
    usage();
}
