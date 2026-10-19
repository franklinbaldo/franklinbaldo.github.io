#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { pathToFileURL } from "node:url";
import readline from "node:readline";

const SOURCE_ID = "wikidata-p2534";
const SOURCE_LICENSE = "CC0-1.0";
const SOURCE_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/";
const SOURCE_POLICY_URL = "https://www.wikidata.org/wiki/Wikidata:Licensing";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseDumpLine(line) {
  let trimmed = line.trim();
  if (!trimmed || trimmed === "[" || trimmed === "]") return null;
  if (trimmed.endsWith(",")) trimmed = trimmed.slice(0, -1);
  if (!trimmed || trimmed === "]") return null;
  return JSON.parse(trimmed);
}

export function extractP2534Records(
  entity,
  { snapshot, sourceUrl = "https://www.wikidata.org/wiki/Wikidata:Database_download" } = {},
) {
  if (!entity || entity.type !== "item" || !entity.id) return [];

  const statements = entity.claims?.P2534;
  if (!Array.isArray(statements) || statements.length === 0) return [];

  const symbolClaims = Array.isArray(entity.claims?.P7235) ? entity.claims.P7235 : [];
  const records = [];

  for (const statement of statements) {
    const expression = statement?.mainsnak?.datavalue?.value;
    if (statement?.mainsnak?.snaktype !== "value" || typeof expression !== "string") continue;

    const statementJson = JSON.stringify(statement);
    records.push({
      source_id: SOURCE_ID,
      source_snapshot: snapshot ?? null,
      source_url: sourceUrl,
      source_license: SOURCE_LICENSE,
      source_license_url: SOURCE_LICENSE_URL,
      source_policy_url: SOURCE_POLICY_URL,
      source_entity_id: entity.id,
      source_entity_lastrevid: entity.lastrevid ?? null,
      source_statement_id: statement.id ?? null,
      source_statement_rank: statement.rank ?? null,
      original_expression: expression,
      original_encoding: "wikidata-mathematical-expression",
      provenance_class: "attested",
      qualifiers: statement.qualifiers ?? {},
      references: statement.references ?? [],
      symbol_claims_p7235: symbolClaims,
      source_statement_sha256: sha256(statementJson),
    });
  }

  return records;
}

function parseArgs(argv) {
  const args = { input: null, snapshot: null, limit: Infinity };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--input" && next) {
      args.input = next;
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
  return `Usage:
  node scripts/science-equations/harvest-wikidata-p2534.mjs --snapshot <snapshot-id> [--input latest-all.json] [--limit N]

The importer reads the decompressed Wikidata JSON entity dump, one entity per line, and writes one JSONL occurrence per P2534 statement to stdout.

For an official .bz2 dump, stream decompression instead of creating another giant copy:
  bzip2 -dc latest-all.json.bz2 | node scripts/science-equations/harvest-wikidata-p2534.mjs --snapshot <snapshot-id> > wikidata-p2534.jsonl
`;
}

export async function harvestStream(input, output, options) {
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let parsedEntities = 0;
  let matchedEntities = 0;
  let recordsWritten = 0;

  for await (const line of lines) {
    if (recordsWritten >= options.limit) break;

    const entity = parseDumpLine(line);
    if (!entity) continue;
    parsedEntities += 1;

    const records = extractP2534Records(entity, options);
    if (records.length > 0) matchedEntities += 1;

    for (const record of records) {
      if (recordsWritten >= options.limit) break;
      output.write(`${JSON.stringify(record)}\n`);
      recordsWritten += 1;
    }
  }

  return { parsedEntities, matchedEntities, recordsWritten };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  if (!args.snapshot) throw new Error("--snapshot is required so every occurrence has a reproducible source version");

  const input = args.input ? createReadStream(args.input, { encoding: "utf8" }) : process.stdin;
  input.setEncoding?.("utf8");

  const metrics = await harvestStream(input, process.stdout, args);
  process.stderr.write(`${JSON.stringify({ event: "harvest-complete", source_id: SOURCE_ID, ...metrics })}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
