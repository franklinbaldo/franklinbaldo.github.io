import fs from "node:fs";

import { parseDocumentContent } from "@franklinbaldo/okf-parser";
import { stringify } from "yaml";

// okf-parser keeps every frontmatter scalar as its source lexeme (a string),
// leaving typing to the type contract. Each audiobook type declares here which
// fields are not strings, mirroring the field tables in specs/okf-types/.
// Path syntax: `.` separates keys, `*` matches any key of a map and `[]`
// matches every item of a list. Absent fields are left absent.
export const TYPED_FIELDS = Object.freeze({
  "Audiobook Work State": {
    boolean: [
      "project_gates.*",
      "chapters.*.gates.*",
      "chapters.*.ready_for_audio",
    ],
    number: [
      "chapters.*.publication.duration_seconds",
      "chapters.*.publication.enclosure.bytes",
      "chapters.*.publication.transcript.verification.headStatus",
      "chapters.*.publication.transcript.verification.rangeStatus",
      "chapters.*.publication.chapters[].start_seconds",
    ],
  },
  "Audiobook Voice Cast": {
    boolean: [],
    number: [
      "voices.*.kokoro.speed",
      "voices.*.kokoro.voice[].weight",
      "voices.*.seed",
    ],
  },
  "Audiobook Pronunciation Lexicon": { boolean: [], number: ["version"] },
  "Audiobook TTS Benchmark": { boolean: [], number: [] },
});

export class OkfDocumentError extends Error {
  constructor(message, filePath) {
    super(`${filePath}: ${message}`);
    this.name = "OkfDocumentError";
    this.filePath = filePath;
  }
}

function castScalar(value, kind, fieldPath, filePath) {
  if (typeof value !== "string") return value;
  if (kind === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new OkfDocumentError(`${fieldPath} must be a boolean`, filePath);
  }
  const number = Number(value);
  if (value.trim() === "" || !Number.isFinite(number)) {
    throw new OkfDocumentError(`${fieldPath} must be a number`, filePath);
  }
  return number;
}

function applyCast(node, segments, kind, trail, filePath) {
  if (node === null || typeof node !== "object") return node;
  const [segment, ...rest] = segments;
  const isList = segment.endsWith("[]");
  const key = isList ? segment.slice(0, -2) : segment;
  const keys = key === "*" ? Object.keys(node) : [key];

  for (const name of keys) {
    if (!(name in node)) continue;
    const here = trail ? `${trail}.${name}` : name;
    const targets = isList
      ? Array.isArray(node[name])
        ? node[name].map((_, index) => [node[name], index, `${here}[${index}]`])
        : []
      : [[node, name, here]];
    for (const [container, slot, label] of targets) {
      container[slot] = rest.length
        ? applyCast(container[slot], rest, kind, label, filePath)
        : castScalar(container[slot], kind, label, filePath);
    }
  }
  return node;
}

function castFields(data, type, filePath) {
  const contract = TYPED_FIELDS[type];
  if (!contract) throw new OkfDocumentError(`unknown type ${type}`, filePath);
  for (const kind of ["boolean", "number"]) {
    for (const pattern of contract[kind]) {
      applyCast(data, pattern.split("."), kind, "", filePath);
    }
  }
  return data;
}

/**
 * Read an audiobook OKF document and return its typed frontmatter and body.
 *
 * @param {string} filePath
 * @param {string} expectedType
 * @returns {{ data: Record<string, any>, body: string }}
 */
export function readOkfDocument(filePath, expectedType) {
  const content = fs.readFileSync(filePath, "utf8");
  const document = parseDocumentContent(content, filePath);
  const data = structuredClone(document.frontmatter ?? {});
  if (data.type !== expectedType) {
    throw new OkfDocumentError(
      `type must be ${expectedType}, found ${data.type ?? "none"}`,
      filePath
    );
  }
  return {
    data: castFields(data, expectedType, filePath),
    body: document.body,
  };
}

/**
 * Serialize frontmatter and body back into an OKF Markdown document.
 *
 * @param {Record<string, any>} data
 * @param {string} body
 * @returns {string}
 */
export function formatOkfDocument(data, body = "") {
  // YAML 1.1 output quotes date-like and boolean-like strings, so readers that
  // still use YAML 1.1 (gray-matter reads work.md) get strings back, not dates.
  const frontmatter = stringify(data, {
    version: "1.1",
    lineWidth: 0,
    aliasDuplicateObjects: false,
  }).trimEnd();
  const rest = body.startsWith("\n") || body === "" ? body : `\n${body}`;
  return `---\n${frontmatter}\n---${rest}`;
}
