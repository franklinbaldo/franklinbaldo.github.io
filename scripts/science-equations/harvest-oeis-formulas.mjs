#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import readline from "node:readline";

const SOURCE_ID = "oeis-formula-lines";
const SOURCE_REPOSITORY = "https://github.com/oeis/oeisdata";
const SOURCE_LICENSE = "CC-BY-SA-4.0";
const SOURCE_LICENSE_URL = "https://oeis.org/LICENSE";
const SOURCE_POLICY_URL = "https://oeis.org/wiki/Legal_Documents";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeOeisFormulaText(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseGitGrepFormulaLine(line, { snapshot } = {}) {
  if (typeof line !== "string" || !snapshot) return null;

  const firstColon = line.indexOf(":");
  const secondColon = line.indexOf(":", firstColon + 1);
  const thirdColon = line.indexOf(":", secondColon + 1);
  if (firstColon <= 0 || secondColon <= firstColon || thirdColon <= secondColon) return null;

  const sourceSnapshot = line.slice(0, firstColon);
  const sourcePath = line.slice(firstColon + 1, secondColon);
  const lineNumberText = line.slice(secondColon + 1, thirdColon);
  const rawLine = line.slice(thirdColon + 1);
  const lineNumber = Number.parseInt(lineNumberText, 10);

  if (sourceSnapshot !== snapshot || !Number.isInteger(lineNumber) || lineNumber < 1) return null;

  const match = rawLine.match(/^%F\s+(A\d{6})\s+(.*)$/);
  if (!match) return null;

  const [, sequenceId, originalExpression] = match;
  if (!sourcePath.endsWith(`/${sequenceId}.seq`)) return null;

  const normalizedText = normalizeOeisFormulaText(originalExpression);
  const sourceRecord = `${sourceSnapshot}\n${sourcePath}\n${lineNumber}\n${rawLine}`;

  return {
    source_id: SOURCE_ID,
    source_repository: SOURCE_REPOSITORY,
    source_snapshot: sourceSnapshot,
    source_path: sourcePath,
    source_line: lineNumber,
    source_document_id: sequenceId,
    source_document_url: `https://oeis.org/${sequenceId}`,
    source_record_url: `${SOURCE_REPOSITORY}/blob/${sourceSnapshot}/${sourcePath}#L${lineNumber}`,
    source_field: "F",
    source_license: SOURCE_LICENSE,
    source_license_url: SOURCE_LICENSE_URL,
    source_policy_url: SOURCE_POLICY_URL,
    original_expression: originalExpression,
    original_encoding: "oeis-internal-format-ascii-math",
    provenance_class: "attested",
    source_record_sha256: sha256(sourceRecord),
    original_text_sha256: sha256(originalExpression),
    normalized_text_sha256: sha256(normalizedText),
  };
}

function parseArgs(argv) {
  const args = { repo: null, snapshot: null, limit: Infinity };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--repo" && next) {
      args.repo = next;
      index += 1;
    } else if (token === "--snapshot" && next) {
      args.snapshot = next;
      index += 1;
    } else if (token === "--limit" && next) {
      const parsed = Number.parseInt(next, 10);
      if (!Number.isFinite(parsed) || parsed < 1) throw new Error("--limit must be a positive integer");
      args.limit = parsed;
      index += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${token}`);
    }
  }

  return args;
}

function usage() {
  return `Usage:\n  node scripts/science-equations/harvest-oeis-formulas.mjs --repo <oeisdata-clone> --snapshot <commit> [--limit N]\n\nThe importer runs git grep against the pinned OEIS export commit and writes one JSONL occurrence per %F formula line to stdout. The original formula text is preserved byte-for-byte after the OEIS field prefix; original_text_sha256 and normalized_text_sha256 are comparison fingerprints only.\n\nRecommended source checkout:\n  git clone --filter=blob:none --no-checkout https://github.com/oeis/oeisdata.git oeisdata\n  git -C oeisdata fetch origin <snapshot>\n\nFull harvest:\n  node scripts/science-equations/harvest-oeis-formulas.mjs \\\n    --repo oeisdata \\\n    --snapshot <snapshot> \\\n    > oeis-formulas.jsonl\n`;
}

async function resolveSnapshot(repo, snapshot) {
  const child = spawn("git", ["-C", repo, "rev-parse", `${snapshot}^{commit}`], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const [code] = await once(child, "close");
  if (code !== 0) throw new Error(`Unable to resolve OEIS snapshot ${snapshot}: ${stderr.trim()}`);
  return stdout.trim();
}

export async function harvestGitRepository({ repo, snapshot, output, limit = Infinity }) {
  const resolvedSnapshot = await resolveSnapshot(repo, snapshot);
  const child = spawn(
    "git",
    ["-C", repo, "grep", "-n", "-I", "--full-name", "^%F ", resolvedSnapshot, "--", "seq"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  let formulaLinesSeen = 0;
  let recordsWritten = 0;
  let rejectedLines = 0;

  for await (const line of lines) {
    formulaLinesSeen += 1;
    const record = parseGitGrepFormulaLine(line, { snapshot: resolvedSnapshot });
    if (!record) {
      rejectedLines += 1;
      continue;
    }
    if (recordsWritten >= limit) continue;
    output.write(`${JSON.stringify(record)}\n`);
    recordsWritten += 1;
    if (recordsWritten >= limit) {
      child.kill("SIGTERM");
      break;
    }
  }

  const [code, signal] = await once(child, "close");
  if (code !== 0 && signal !== "SIGTERM") {
    throw new Error(`git grep failed (${code ?? signal}): ${stderr.trim()}`);
  }

  return {
    resolvedSnapshot,
    formulaLinesSeen,
    rejectedLines,
    recordsWritten,
    limited: Number.isFinite(limit) && recordsWritten >= limit,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  if (!args.repo) throw new Error("--repo is required");
  if (!args.snapshot) throw new Error("--snapshot is required");

  const metrics = await harvestGitRepository({
    repo: args.repo,
    snapshot: args.snapshot,
    output: process.stdout,
    limit: args.limit,
  });
  process.stderr.write(`${JSON.stringify({ event: "harvest-complete", source_id: SOURCE_ID, ...metrics })}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
