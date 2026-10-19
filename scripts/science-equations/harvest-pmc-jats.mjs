#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";

const SOURCE_ID = "pmc-jats-formulas";
const SOURCE_HOME = "https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/";
const SOURCE_BUCKET = "arn:aws:s3:::pmc-oa-opendata";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeXmlText(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, dec) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function textOnly(value) {
  return decodeXmlText(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attrValue(attrs, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = attrs.match(
    new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i")
  );
  return match ? decodeXmlText(match[2]) : null;
}

function firstTag(xml, tagName, attributeName = null, attributeValue = null) {
  const tag = tagName.replace(":", "\\:");
  const regex = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return null;
  if (attributeName && attrValue(match[1], attributeName) !== attributeValue)
    return null;
  return { attrs: match[1], inner: match[2], full: match[0] };
}

function findArticleId(xml, type) {
  const regex = /<article-id\b([^>]*)>([\s\S]*?)<\/article-id>/gi;
  for (const match of xml.matchAll(regex)) {
    if (
      (attrValue(match[1], "pub-id-type") ?? "").toLowerCase() ===
      type.toLowerCase()
    ) {
      return textOnly(match[2]);
    }
  }
  return null;
}

function articleTitle(xml) {
  const tag = firstTag(xml, "article-title");
  return tag ? textOnly(tag.inner) : null;
}

export function classifyPmcLicense(xml) {
  const licenseMatch = xml.match(/<license\b([^>]*)>([\s\S]*?)<\/license>/i);
  if (!licenseMatch) {
    return {
      license_url: null,
      license_text: null,
      license_id: null,
      redistribution: "manual-review",
    };
  }

  const attrs = licenseMatch[1];
  const body = licenseMatch[2];
  const href =
    attrValue(attrs, "xlink:href") ??
    attrValue(attrs, "href") ??
    attrValue(
      (body.match(/<ext-link\b([^>]*)>/i) ?? [])[1] ?? "",
      "xlink:href"
    ) ??
    null;
  const licenseText = textOnly(body);
  const haystack = `${href ?? ""} ${licenseText}`.toLowerCase();

  const patterns = [
    [
      "CC0",
      /creativecommons\.org\/(?:publicdomain\/zero|licenses\/zero)\/|\bcc0\b/,
    ],
    [
      "CC-BY-NC-SA",
      /creativecommons\.org\/licenses\/by-nc-sa\/|\bcc\s*by-nc-sa\b/,
    ],
    [
      "CC-BY-NC-ND",
      /creativecommons\.org\/licenses\/by-nc-nd\/|\bcc\s*by-nc-nd\b/,
    ],
    ["CC-BY-NC", /creativecommons\.org\/licenses\/by-nc\/|\bcc\s*by-nc\b/],
    ["CC-BY-ND", /creativecommons\.org\/licenses\/by-nd\/|\bcc\s*by-nd\b/],
    ["CC-BY-SA", /creativecommons\.org\/licenses\/by-sa\/|\bcc\s*by-sa\b/],
    ["CC-BY", /creativecommons\.org\/licenses\/by\/|\bcc\s*by\b/],
  ];

  let licenseId = null;
  for (const [id, pattern] of patterns) {
    if (pattern.test(haystack)) {
      licenseId = id;
      break;
    }
  }

  const redistribution = ["CC0", "CC-BY", "CC-BY-SA"].includes(licenseId)
    ? "redistributable-derived"
    : "manual-review";

  return {
    license_url: href,
    license_text: licenseText || null,
    license_id: licenseId,
    redistribution,
  };
}

function extractExpression(inner) {
  const tex = inner.match(/<tex-math\b[^>]*>([\s\S]*?)<\/tex-math>/i);
  if (tex) {
    return {
      expression_original: decodeXmlText(tex[1]).trim(),
      expression_encoding: "tex-math",
    };
  }

  const mathml = inner.match(
    /<(?:mml:)?math\b[^>]*>[\s\S]*?<\/(?:mml:)?math>/i
  );
  if (mathml) {
    return { expression_original: mathml[0], expression_encoding: "mathml" };
  }

  return {
    expression_original: textOnly(inner),
    expression_encoding: "jats-text",
  };
}

function nearbyContext(xml, start, end) {
  const before = xml.slice(Math.max(0, start - 600), start);
  const after = xml.slice(end, Math.min(xml.length, end + 600));
  return textOnly(`${before} ${after}`).slice(0, 1200) || null;
}

export function parseJatsArticle(
  xml,
  { snapshot, objectPath, redistributableOnly = true } = {}
) {
  if (typeof xml !== "string" || !snapshot || !objectPath) {
    throw new Error("xml, snapshot and objectPath are required");
  }

  const pmcidRaw = findArticleId(xml, "pmc");
  const pmcid = pmcidRaw
    ? pmcidRaw.startsWith("PMC")
      ? pmcidRaw
      : `PMC${pmcidRaw}`
    : null;
  const doi = findArticleId(xml, "doi");
  const title = articleTitle(xml);
  const license = classifyPmcLicense(xml);
  const rejectedByLicense =
    redistributableOnly && license.redistribution !== "redistributable-derived";

  const records = [];
  if (rejectedByLicense) {
    return {
      records,
      metrics: {
        formulas_seen: 0,
        records_written: 0,
        rejected_license: 1,
        rejected_empty: 0,
      },
      article: { pmcid, doi, title, ...license },
    };
  }

  const regex = /<(disp-formula|inline-formula)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let formulasSeen = 0;
  let rejectedEmpty = 0;

  for (const match of xml.matchAll(regex)) {
    formulasSeen += 1;
    const [full, tagName, attrs, inner] = match;
    const { expression_original, expression_encoding } =
      extractExpression(inner);
    if (!expression_original) {
      rejectedEmpty += 1;
      continue;
    }

    const sourceLocator =
      attrValue(attrs, "id") ?? `${tagName}:${formulasSeen}`;
    const normalizedText = expression_original.replace(/\s+/g, " ").trim();
    const sourceRecord = `${snapshot}\n${objectPath}\n${sourceLocator}\n${full}`;
    const start = match.index ?? 0;
    const contextText = nearbyContext(xml, start, start + full.length);

    records.push({
      schema_version: 1,
      source_id: SOURCE_ID,
      source_name: "PubMed Central Article Datasets / JATS",
      source_homepage: SOURCE_HOME,
      source_bucket: SOURCE_BUCKET,
      source_snapshot: snapshot,
      source_object_path: objectPath,
      source_document_id: pmcid,
      source_document_url: pmcid
        ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`
        : null,
      source_secondary_id: doi,
      source_locator: sourceLocator,
      source_element: tagName,
      source_license: license.license_id,
      source_license_url: license.license_url,
      source_license_text: license.license_text,
      redistribution_class: license.redistribution,
      provenance_class: "attested",
      expression_original,
      expression_encoding,
      context_text: contextText,
      document_title: title,
      source_record_sha256: sha256(sourceRecord),
      expression_sha256: sha256(expression_original),
      normalized_text: normalizedText,
      normalized_text_sha256: sha256(normalizedText),
    });
  }

  return {
    records,
    metrics: {
      formulas_seen: formulasSeen,
      records_written: records.length,
      rejected_license: 0,
      rejected_empty: rejectedEmpty,
    },
    article: { pmcid, doi, title, ...license },
  };
}

async function* walkXml(root) {
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) yield* walkXml(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))
      yield full;
  }
}

async function* listedPaths(file) {
  const input = createReadStream(file, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    const value = line.trim();
    if (value && !value.startsWith("#")) yield value;
  }
}

function parseArgs(argv) {
  const args = {
    root: null,
    pathsFrom: null,
    snapshot: null,
    redistributableOnly: true,
    limit: Infinity,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--root" && next) {
      args.root = next;
      i += 1;
    } else if (token === "--paths-from" && next) {
      args.pathsFrom = next;
      i += 1;
    } else if (token === "--snapshot" && next) {
      args.snapshot = next;
      i += 1;
    } else if (token === "--include-manual-review")
      args.redistributableOnly = false;
    else if (token === "--limit" && next) {
      args.limit = Number.parseInt(next, 10);
      i += 1;
    } else if (token === "--help" || token === "-h") args.help = true;
    else throw new Error(`Unknown or incomplete argument: ${token}`);
  }
  if (args.root && args.pathsFrom)
    throw new Error("choose only one of --root or --paths-from");
  return args;
}

function usage() {
  return `Usage:\n  node scripts/science-equations/harvest-pmc-jats.mjs --snapshot <inventory-digest> (--root <xml-dir> | --paths-from <file>) [--limit N] [--include-manual-review]\n\nReads JATS XML files acquired from the official PMC Article Datasets AWS Cloud Service and emits one JSONL occurrence for each <disp-formula> or <inline-formula>. By default only CC0/CC-BY/CC-BY-SA articles are emitted for redistribution; other licenses are counted but rejected. The JSONL stream is transport only and must be materialized to Parquet before publication.\n`;
}

export async function harvestPmcFiles({
  paths,
  snapshot,
  output,
  redistributableOnly = true,
  limit = Infinity,
}) {
  const metrics = {
    articles_seen: 0,
    formulas_seen: 0,
    records_written: 0,
    rejected_license: 0,
    rejected_empty: 0,
  };
  for await (const file of paths) {
    if (metrics.records_written >= limit) break;
    const xml = await readFile(file, "utf8");
    metrics.articles_seen += 1;
    const parsed = parseJatsArticle(xml, {
      snapshot,
      objectPath: file,
      redistributableOnly,
    });
    metrics.formulas_seen += parsed.metrics.formulas_seen;
    metrics.rejected_license += parsed.metrics.rejected_license;
    metrics.rejected_empty += parsed.metrics.rejected_empty;
    for (const record of parsed.records) {
      if (metrics.records_written >= limit) break;
      output.write(`${JSON.stringify(record)}\n`);
      metrics.records_written += 1;
    }
  }
  return metrics;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  if (!args.snapshot) throw new Error("--snapshot is required");
  if (!args.root && !args.pathsFrom)
    throw new Error("--root or --paths-from is required");
  if (
    args.limit !== Infinity &&
    (!Number.isFinite(args.limit) || args.limit < 1)
  )
    throw new Error("--limit must be a positive integer");
  const paths = args.root ? walkXml(args.root) : listedPaths(args.pathsFrom);
  const metrics = await harvestPmcFiles({
    paths,
    snapshot: args.snapshot,
    output: process.stdout,
    redistributableOnly: args.redistributableOnly,
    limit: args.limit,
  });
  process.stderr.write(
    `${JSON.stringify({ event: "harvest-complete", source_id: SOURCE_ID, source_snapshot: args.snapshot, ...metrics })}\n`
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`
    );
    process.exitCode = 1;
  });
}
