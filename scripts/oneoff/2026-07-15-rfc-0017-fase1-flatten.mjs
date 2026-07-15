#!/usr/bin/env node
/**
 * RFC 0017 Fase 1 — unicidade física: para cada diretório legado
 * (`src/content/blog/<slug>/v-<timestamp>.mdx`), remove todo arquivo-versão
 * perdedor (git rm) e move o vencedor para `src/content/blog/<slug>.<ext>`
 * (git mv) — exceto slugs com recurso de mídia local (frontmatter
 * referenciando um arquivo no mesmo diretório, ex. `heroImage: ./foo.png`),
 * que mantêm a pasta e viram `<slug>/index.<ext>`.
 *
 * Gera/estende `src/generated/migration-0017-survivors.json` (schema
 * `migration-0017-survivors-v1`) como manifesto auditável — para cada slug
 * migrado: `selectedFrom` (path original pré-`git mv`), `selectedUuid`
 * (identidade de versão, RFC 0010 §4.3), `selectedSha256` (hash bruto do
 * conteúdo mantido, provimento independente do UUID), `kept` (path final),
 * `reason` (`selected` = havia seleção prévia via versions-selected.json;
 * `single-publishable` = sem seleção, mas só um arquivo publicável
 * existia; `manual` = candidato único mas sem versão publicável, ex.
 * draft:true) e `removed` (paths dos perdedores).
 *
 * Idempotente por slug: um slug já presente no manifesto, ou já achatado
 * (arquivo único em `src/content/blog/<slug>.<ext>`, ou
 * `<slug>/index.<ext>` sem irmãos `v-*`), é pulado sem erro — seguro de
 * rodar de novo a qualquer momento contra o estado real de `main`.
 *
 * `versions-selected.json` (gitignored, regenerado por `hronir:select`) é
 * opcional: se ausente ou sem entrada para um slug, cai no fallback
 * `single-publishable` (só funciona sem ambiguidade — 1 candidato) ou pede
 * triagem manual (`MANUAL_TRIAGE`) se houver mais de um candidato sem
 * seleção. Rode `npm run hronir:select` antes para cobrir os casos com
 * múltiplos candidatos concorrentes.
 *
 * Já rodado uma vez (commit 6be27bd, 2026-07-15, 151 slugs) — preservado
 * para reprodutibilidade e para migrar o que restar (ex. depois que os 2
 * slugs em MANUAL_TRIAGE forem resolvidos).
 *
 * Usage: node --import tsx/esm scripts/oneoff/2026-07-15-rfc-0017-fase1-flatten.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { getPostUuid } from "../../src/hronir/posts.js";

const BLOG_DIR = "src/content/blog";
const SELECTION_PATH = "src/generated/versions-selected.json";
const MANIFEST_PATH = "src/generated/migration-0017-survivors.json";
const MANIFEST_SCHEMA = "migration-0017-survivors-v1";

// RFC 0015 §1 / RFC 0017 §7: arquivo solto na raiz colide com um diretório
// ainda versionado, com conteúdo genuinamente divergente (não duplicata) —
// decisão editorial, não mecânica. Ajustar esta lista quando resolvidos.
const MANUAL_TRIAGE = new Set([
  "delegando-para-agentes",
  "the-art-of-delegation",
]);

// Diretório sem versão publicável (draft:true, candidato único — sem
// entrada em versions-selected.json porque não há nada para `select`
// escolher entre candidatos, mas não há ambiguidade: só existe 1 arquivo).
const NO_SELECTION_SINGLE_FILE =
  "the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life";

// Slugs cujo vencedor referencia um recurso de mídia local (frontmatter
// `./algo.ext`) que precisa continuar ao lado do post — mantêm a pasta,
// viram `<slug>/index.<ext>` em vez de `<slug>.<ext>` na raiz.
const KEEP_DIR_SLUGS = new Set(["quem-sou-eu"]);

function git(args) {
  execFileSync("git", args, { stdio: "inherit" });
}

function gitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  return Array.isArray(parsed) ? parsed : parsed.entries;
}

// Opcional: cai em {} quando ausente (checkout limpo sem `hronir:select`
// rodado ainda, ou todos os slugs restantes sem ambiguidade de seleção).
const sel = fs.existsSync(SELECTION_PATH)
  ? JSON.parse(fs.readFileSync(SELECTION_PATH, "utf8"))
  : {};

const manifest = loadManifest();
const alreadyMigrated = new Set(manifest.map((e) => e.slug));

const legacyDirs = fs
  .readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "images")
  .map((e) => e.name);

let migrated = 0;
let skipped = 0;

for (const slug of legacyDirs) {
  if (MANUAL_TRIAGE.has(slug)) {
    console.log(
      `[skip] ${slug}: triagem manual (colisão com arquivo órfão na raiz)`
    );
    skipped++;
    continue;
  }

  if (alreadyMigrated.has(slug)) {
    console.log(`[skip] ${slug}: já presente no manifesto.`);
    skipped++;
    continue;
  }

  const dir = path.join(BLOG_DIR, slug);
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => e.name);

  // Já achatado (dir mantido por KEEP_DIR_SLUGS, só sobrou index.<ext>,
  // sem irmãos v-*) — nada a fazer, não é um erro.
  if (
    KEEP_DIR_SLUGS.has(slug) &&
    files.length === 1 &&
    /^index\.mdx?$/.test(files[0])
  ) {
    console.log(`[skip] ${slug}: já achatado (${dir}/${files[0]}).`);
    skipped++;
    continue;
  }

  let selectedRel;
  let reason;

  if (sel[slug]) {
    selectedRel = sel[slug].file; // e.g. "slug/v-....md"
    reason = "selected";
  } else if (slug === NO_SELECTION_SINGLE_FILE) {
    if (files.length !== 1) {
      throw new Error(`${slug}: esperava 1 arquivo, achou ${files.length}`);
    }
    selectedRel = path.join(slug, files[0]);
    reason = "manual";
  } else if (files.length === 1) {
    selectedRel = path.join(slug, files[0]);
    reason = "single-publishable";
  } else {
    throw new Error(
      `${slug}: sem entrada em ${SELECTION_PATH} e ${files.length} candidatos — rode \`npm run hronir:select\` primeiro, ou adicione a MANUAL_TRIAGE se for uma colisão órfã.`
    );
  }

  const selectedName = path.basename(selectedRel);
  const selectedPath = path.join(BLOG_DIR, selectedRel);
  if (!fs.existsSync(selectedPath)) {
    throw new Error(
      `${slug}: selecionado ${selectedPath} não existe no disco.`
    );
  }

  const selectedFrom = selectedPath;
  const selectedUuid = getPostUuid(selectedPath);
  const selectedSha256 = crypto
    .createHash("sha256")
    .update(fs.readFileSync(selectedPath))
    .digest("hex");

  const removed = [];
  for (const f of files) {
    if (f === selectedName) continue;
    const p = path.join(dir, f);
    git(["rm", "-q", p]);
    removed.push(p);
  }

  const ext = path.extname(selectedName);
  const kept = KEEP_DIR_SLUGS.has(slug)
    ? path.join(dir, `index${ext}`)
    : path.join(BLOG_DIR, `${slug}${ext}`);
  git(["mv", selectedPath, kept]);

  const raw = fs.readFileSync(kept, "utf8");
  const langMatch = raw.match(/^lang:\s*["']?(\w+)["']?/m);

  manifest.push({
    slug,
    lang: langMatch ? langMatch[1] : null,
    selectedFrom,
    selectedUuid,
    selectedSha256,
    kept,
    reason,
    removed,
  });

  if (!KEEP_DIR_SLUGS.has(slug)) {
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
      fs.rmdirSync(dir);
    } else {
      throw new Error(
        `${slug}: diretório ${dir} não ficou vazio: ${remaining}`
      );
    }
  }

  migrated++;
}

manifest.sort((a, b) => a.slug.localeCompare(b.slug));
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

let sourceCommit = null;
try {
  sourceCommit = gitOutput(["rev-parse", "HEAD"]);
} catch {
  // sem git (improvável) — deixa null
}

fs.writeFileSync(
  MANIFEST_PATH,
  JSON.stringify(
    {
      _meta: {
        schema: MANIFEST_SCHEMA,
        generatedBy: "scripts/oneoff/2026-07-15-rfc-0017-fase1-flatten.mjs",
        sourceCommit,
      },
      entries: manifest,
    },
    null,
    2
  ) + "\n"
);

console.log(
  `\nFase 1: ${migrated} slug(s) migrado(s) nesta rodada, ${skipped} pulado(s), ${manifest.length} entrada(s) totais em ${MANIFEST_PATH}.`
);
