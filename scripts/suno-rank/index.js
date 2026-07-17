#!/usr/bin/env -S node --import tsx/esm
// CLI for the music-ranking system (docs/rfcs/0018-hronir-de-musica.md).
// Deliberately not modeled on the hronir CLI init/continue/decide/end
// ceremony: there is no human step to interleave, so "round" both picks
// the pair and records the Gemini verdict in one call.
import { createRequire } from "node:module";

function preflight() {
  const require = createRequire(import.meta.url);
  const required = ["openskill"];
  const missing = required.filter((pkg) => {
    try {
      require.resolve(pkg);
      return false;
    } catch {
      return true;
    }
  });
  if (missing.length > 0) {
    console.error(
      `Erro: dependências ausentes em node_modules: ${missing.join(", ")}.`
    );
    console.error(
      "Rode `npm install` na raiz do projeto antes de chamar o suno-rank."
    );
    process.exit(1);
  }
}
preflight();

const { runDuels } = await import("../../src/suno-rank/commands/run-duel.js");
const { doctor } = await import("../../src/suno-rank/commands/doctor.js");
const { computeRatings } = await import("../../src/suno-rank/ranking.js");

const [, , cmd, ...args] = process.argv;

function readFlagValue(argv, flagName) {
  const idx = argv.indexOf(flagName);
  if (idx === -1) return null;
  const v = argv[idx + 1];
  if (v == null || v.startsWith("--")) {
    console.error(`Erro: ${flagName} exige um valor.`);
    process.exit(1);
  }
  return v;
}

function usage() {
  console.error("Uso: suno-rank {round [--count N]|ranking|doctor}");
  process.exit(1);
}

switch (cmd) {
  case "round": {
    const countRaw = readFlagValue(args, "--count") ?? "1";
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1) {
      console.error(
        `Erro: --count deve ser um inteiro positivo (recebido: ${countRaw}).`
      );
      process.exit(1);
    }
    const results = await runDuels(count);
    let ok = 0;
    for (const r of results) {
      if (r.ok) {
        ok++;
        console.log(`✔ ${r.aKey} x ${r.bKey}`);
      } else {
        console.log(
          `✗ skipped (${r.reason}${r.aKey ? `, ${r.aKey} x ${r.bKey}` : ""})`
        );
      }
    }
    console.log(`\n${ok}/${results.length} duel(s) recorded.`);
    if (ok === 0 && results.length > 0) process.exitCode = 1;
    break;
  }
  case "ranking": {
    const rows = computeRatings();
    for (const [i, r] of rows.entries()) {
      console.log(
        `${i + 1}. ${r.key} — ordinal ${r.ordinal.toFixed(2)} (${r.wins}/${r.appearances} wins)`
      );
    }
    break;
  }
  case "doctor": {
    const { errors, count } = doctor();
    if (errors.length > 0) {
      console.error(
        `\n✗ suno-rank doctor: ${errors.length} issue(s) across ${count} duel(s):\n`
      );
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(`✔ suno-rank doctor: ${count} duel(s), 0 inconsistências.`);
    break;
  }
  default:
    usage();
}
