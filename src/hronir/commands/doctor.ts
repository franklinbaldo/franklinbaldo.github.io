import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { listPosts, readPost, getPostUuid } from "../posts.js";
import {
  SELECTION_PATH,
  readSelection,
  listSlugVersions,
  listAllVersionSlugs,
  slugForContentPath,
  flatCanonicalPath,
} from "../selection.js";
import { historyKeySet } from "../history.js";
import { listMatchFiles, readMatch } from "../matches.js";
import { listPerspectives, loadPerspective } from "../perspectives.js";
import { MOODS } from "../moods.js";
import {
  SESSION_PATH,
  MIN_WORDS,
  wordCount,
  buildPathToKeyIndex,
  PRUNED_PATH,
} from "./_shared.js";

// Word-trigram shingles for near-duplicate detection of review/clash prose.
function shingleSet(text: unknown): Set<string> {
  const words = String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .match(/[\p{L}\p{N}]+/gu);
  const set = new Set<string>();
  if (!words) return set;
  for (let i = 0; i + 2 < words.length; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

const STARS_SCHEMAS = new Set(["stars-v1", "stars-v2", "stars-v3"]);

// Schemas that carry slug@uuid refs and therefore require strict version-uuid
// resolution in the doctor (RFC 0010 §4.3).
const REF_SCHEMAS = new Set(["stars-v2", "stars-v3"]);

// Detects automated token-stuffing in text fields.
// Catches several Jules/script-generated patterns:
//   1. Underscored ID tokens (revA_1873_abc123_0 — original heuristic)
//   2. Database artifact ref tags embedded in prose ([ref:a1b2c3d4])
//   3. Known Jules session boilerplate prefixes
//   4. Dense random 8-char alphanumeric tokens (≥30% of words, ≥20-word field)
function hasTokenStuffing(s: unknown): boolean {
  if (!s || typeof s !== "string") return false;
  // Pattern 1: underscored token IDs
  const pattern1 = /\b[A-Za-z]+_\d{3,}_[A-Za-z0-9]{4,}_\d+\b/g;
  if ((s.match(pattern1)?.length ?? 0) >= 5) return true;
  // Pattern 2: database artifact ref tags ([ref:a1b2c3d4])
  if (/\[ref:[a-f0-9]{8}\]/.test(s)) return true;
  // Pattern 3: Jules boilerplate framing phrases
  const boilerplates = [
    "Evaluating this English post, uniquely identified as",
    "Clashing these English posts, uniquely identified as",
    "Nesta leitura sob a ótica da perspectiva, notamos o seguinte:",
    "A close reading reveals the following fundamental characteristics:",
    "Reading this through the lens of our perspective, we find:",
    "Comparando ambas as obras através das lentes da nossa perspectiva.",
    "In this direct clash, the differences become evident.",
  ];
  for (const bp of boilerplates) {
    if (s.includes(bp)) return true;
  }
  // Pattern 4: dense random alphanumeric tokens (7–9 chars, mixed letter+digit)
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 20) {
    const tokenCount = words.filter(
      (w) => /^[a-z0-9]{7,9}$/.test(w) && /[a-z]/.test(w) && /[0-9]/.test(w)
    ).length;
    if (tokenCount / words.length >= 0.3) return true;
  }
  return false;
}

function isValidRate(n: unknown): boolean {
  if (typeof n !== "number" || !Number.isFinite(n)) return false;
  if (n < 1 || n > 5) return false;
  // accept up to two decimals (allow small float drift)
  const scaled = n * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

export function doctor() {
  const pathToKey = buildPathToKeyIndex();
  const issues = [];
  // Non-blocking findings: expected, self-healing states that shouldn't fail
  // CI (e.g. a translation group temporarily on different revisions — see
  // RFC 0010 §4.4 amendment 2026-07-01, common now that selection has no
  // hysteresis to hold languages back while a sibling catches up).
  const warnings: string[] = [];

  if (fs.existsSync(SESSION_PATH)) {
    issues.push(
      `Sessão ativa do Hronir detectada (${SESSION_PATH}). Finalize a rodada antes de commitar.`
    );
  }

  // Validate the perspectives directory once up front so a malformed
  // file is caught even when no match references it yet.
  try {
    const ps = listPerspectives();
    if (ps.length === 0) {
      issues.push(
        `scripts/hronir/perspectives/: nenhum arquivo de perspectiva encontrado.`
      );
    }
  } catch (e: unknown) {
    issues.push(`scripts/hronir/perspectives/: ${(e as Error).message}`);
  }

  // UUIDs vivos por slug (atual + legacy de cada peer), lazy por diretório,
  // e o conjunto slug@uuid arquivado (pruned + fold-back) — base da
  // checagem estrita de versões-fantasma em rate files stars-v2.
  const dirUuidsBySlug = new Map<string, Set<string>>();
  const dirUuids = (slug: string): Set<string> => {
    let s = dirUuidsBySlug.get(slug);
    if (!s) {
      s = new Set();
      for (const v of listSlugVersions(slug)) {
        s.add(v.uuid);
        s.add(v.legacyUuid);
        s.add(v.preOkfUuid);
      }
      dirUuidsBySlug.set(slug, s);
    }
    return s;
  };
  // RFC 0015: historyKeySet() covers flat-layout fold-back/prune archives;
  // PRUNED_PATH covers legacy-layout prunes. A slug is in exactly one
  // layout at a time, so the union is unambiguous — no key can mean two
  // different things.
  const prunedUuids = historyKeySet();
  if (fs.existsSync(PRUNED_PATH)) {
    try {
      const reg = JSON.parse(fs.readFileSync(PRUNED_PATH, "utf8"));
      for (const e of reg.pruned ?? []) {
        if (e.uuid) prunedUuids.add(`${e.slug}@${e.uuid}`);
        if (e.legacyUuid) prunedUuids.add(`${e.slug}@${e.legacyUuid}`);
      }
    } catch (e: unknown) {
      issues.push(`${PRUNED_PATH}: não parseia (${(e as Error).message})`);
    }
  }

  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const base = path.basename(f);

    if (!data.run_id) issues.push(`${base}: sem run_id`);
    if (!data.post_a || !data.post_b) {
      issues.push(`${base}: post_a/post_b faltando`);
      continue;
    }

    const postA = data.post_a as Record<string, unknown>;
    const postB = data.post_b as Record<string, unknown>;
    if (postA.slug || postB.slug) {
      issues.push(`${base}: ainda usa 'slug' (formato legado)`);
    }

    const aKey = postA.key as string | undefined;
    const bKey = postB.key as string | undefined;
    const aPath = postA.path as string | undefined;
    const bPath = postB.path as string | undefined;
    const aVersion = postA.version as string | undefined;
    const bVersion = postB.version as string | undefined;

    // RFC 0010 §4.3: path é cache de resolução, version (UUID) é identidade.
    // Após a migração (index.* → v-*), um select ou um prune, o path gravado
    // no rate file pode deixar de existir. Para stars-v2+ o UUID precisa
    // resolver de verdade: um peer atual (uuid ou legacy) ou uma entrada no
    // registro de podas/histórico — senão é versão-fantasma (typo, deleção
    // acidental). stars-v1 gravou o UUID body-only da época do duelo;
    // edições in-place posteriores tornam esse hash irrecuperável, então
    // basta a pasta do post existir.
    //
    // RFC 0015: um flatten com zero desafiantes renomeia o arquivo E faz
    // rmdir do diretório `<slug>/` — path.dirname(p) deixa de existir mesmo
    // quando o slug segue perfeitamente vivo (agora achatado). Por isso a
    // checagem ref-schema NUNCA testa `fs.existsSync(path.dirname(p))`:
    // slugForContentPath(p) é parsing puro de string (não depende do
    // diretório ainda existir) e dirUuids(slug) é dual-mode (acha o arquivo
    // achatado OU o irmão legado). O ramo stars-v1 abaixo mantém o teste de
    // diretório original de propósito — apertar esse ramo também expõe
    // dívida antiga não relacionada (matches stars-v1 apontando pra slugs
    // renomeados antes da RFC 0010 nem existir), fora do escopo daqui.
    const isRefSchema = REF_SCHEMAS.has(String(data.prompt_version));
    const tolerableGone = (
      p: string | undefined,
      version: string | undefined
    ) => {
      if (!p || !version) return false;
      if (!isRefSchema) return fs.existsSync(path.dirname(p));
      const slug = slugForContentPath(p);
      return (
        dirUuids(slug).has(version) || prunedUuids.has(`${slug}@${version}`)
      );
    };

    if (!aKey) issues.push(`${base}: post_a.key ausente`);
    if (!bKey) issues.push(`${base}: post_b.key ausente`);
    if ((!aPath || !fs.existsSync(aPath)) && !tolerableGone(aPath, aVersion))
      issues.push(`${base}: post_a.path inexistente (${aPath})`);
    if ((!bPath || !fs.existsSync(bPath)) && !tolerableGone(bPath, bVersion))
      issues.push(`${base}: post_b.path inexistente (${bPath})`);

    if (aPath && fs.existsSync(aPath)) {
      const expected = pathToKey.get(aPath);
      if (expected && aKey && expected !== aKey) {
        issues.push(
          `${base}: post_a.key=${aKey} mas translationKey real é ${expected}`
        );
      }
    }
    if (bPath && fs.existsSync(bPath)) {
      const expected = pathToKey.get(bPath);
      if (expected && bKey && expected !== bKey) {
        issues.push(
          `${base}: post_b.key=${bKey} mas translationKey real é ${expected}`
        );
      }
    }

    // Schema detection.
    //   - stars-v1: explicit prompt_version marker only. We deliberately do
    //     NOT infer stars-schema from a stray rate_a/rate_b field, so a
    //     hand-edited legacy match doesn't get retroactively reclassified.
    //   - new-schema (pre-stars): `agent_id` set, prose in frontmatter.
    //   - legacy: neither marker — accepted as-is for historical compatibility.
    const isStarsSchema = STARS_SCHEMAS.has(String(data.prompt_version));
    const isNewSchema = !!data.agent_id || isStarsSchema;

    // Stars-schema invariants are independent of agent_id presence: a match
    // produced by the new flow must pass them regardless of whether the file
    // also has the agent_id field (which is itself required below).
    if (isStarsSchema && data.winner !== "TODO") {
      if (!data.agent_id || data.agent_id === "TODO") {
        issues.push(`${base}: o campo 'agent_id' está ausente ou é 'TODO'`);
      }
      if (!data.clash || data.clash === "TODO") {
        issues.push(
          `${base}: o campo 'clash' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.clash) < MIN_WORDS) {
        issues.push(
          `${base}: 'clash' tem ${wordCount(data.clash)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.clash)) {
        issues.push(
          `${base}: 'clash' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (
        !data.eval_lang ||
        typeof data.eval_lang !== "string" ||
        !data.eval_lang.trim()
      ) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
      }
      // RFC 0012 §6: stars-v3 carries explicit language provenance. Validated
      // only for stars-v3 — older files stay legacy and are not reproved.
      if (String(data.prompt_version) === "stars-v3") {
        const reviewLang = data.review_lang;
        const aContentLang = (data.post_a as Record<string, unknown> | null)
          ?.content_lang as string | undefined;
        const bContentLang = (data.post_b as Record<string, unknown> | null)
          ?.content_lang as string | undefined;
        if (
          !reviewLang ||
          typeof reviewLang !== "string" ||
          !reviewLang.trim()
        ) {
          issues.push(`${base}: stars-v3 sem 'review_lang'`);
        }
        if (!aContentLang) {
          issues.push(`${base}: stars-v3 sem 'post_a.content_lang'`);
        }
        if (!bContentLang) {
          issues.push(`${base}: stars-v3 sem 'post_b.content_lang'`);
        }
        // Version duel: both sides are the same linguistic version, so the
        // critique must be written in that content language (RFC 0012 §6 rule 3).
        if (
          aKey &&
          bKey &&
          aKey === bKey &&
          typeof reviewLang === "string" &&
          aContentLang &&
          reviewLang !== aContentLang
        ) {
          issues.push(
            `${base}: duelo de versão stars-v3 com review_lang≠content_lang (${reviewLang}≠${aContentLang})`
          );
        }
      }
      const ra = data.rate_a;
      const rb = data.rate_b;
      if (!isValidRate(ra)) {
        issues.push(
          `${base}: 'rate_a' deve ser número 1.00-5.00 com até duas decimais (got ${ra})`
        );
      }
      if (!isValidRate(rb)) {
        issues.push(
          `${base}: 'rate_b' deve ser número 1.00-5.00 com até duas decimais (got ${rb})`
        );
      }
      if (isValidRate(ra) && isValidRate(rb)) {
        // Compare at the two-decimal-rounded integer level so drifted floats
        // (e.g. 4.25000001 vs 4.25) are caught as ties, matching how
        // parseRate stores values and how isValidRate tolerates drift.
        const ra100 = Math.round((ra as number) * 100);
        const rb100 = Math.round((rb as number) * 100);
        if (ra100 === rb100) {
          issues.push(`${base}: rate_a == rate_b (${ra}); empate proibido`);
        } else {
          const derivedWinner = ra100 > rb100 ? "a" : "b";
          if (data.winner !== derivedWinner) {
            issues.push(
              `${base}: winner=${data.winner} não bate com rate_a=${ra}, rate_b=${rb} (derivado: ${derivedWinner})`
            );
          }
        }
      }
      if (!data.review_a || data.review_a === "TODO") {
        issues.push(
          `${base}: o campo 'review_a' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.review_a) < MIN_WORDS) {
        issues.push(
          `${base}: 'review_a' tem ${wordCount(data.review_a)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.review_a)) {
        issues.push(
          `${base}: 'review_a' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (!data.review_b || data.review_b === "TODO") {
        issues.push(
          `${base}: o campo 'review_b' no frontmatter está ausente ou é 'TODO'`
        );
      } else if (wordCount(data.review_b) < MIN_WORDS) {
        issues.push(
          `${base}: 'review_b' tem ${wordCount(data.review_b)} palavras (mínimo ${MIN_WORDS})`
        );
      } else if (hasTokenStuffing(data.review_b)) {
        issues.push(
          `${base}: 'review_b' contém tokens de automação (campo gerado por script, não por prosa genuína)`
        );
      }
      if (!data.perspective_id) {
        issues.push(
          `${base}: o campo 'perspective_id' está ausente (obrigatório para schema stars)`
        );
      } else {
        try {
          loadPerspective(String(data.perspective_id));
        } catch {
          issues.push(
            `${base}: perspective_id "${data.perspective_id}" não corresponde a nenhum arquivo em scripts/hronir/perspectives/`
          );
        }
      }
      if (data.evaluator_mood_after != null) {
        const moodAfter = String(data.evaluator_mood_after).trim();
        if (moodAfter.length > 250) {
          issues.push(
            `${base}: 'evaluator_mood_after' tem ${moodAfter.length} chars (máximo 250)`
          );
        }
        if (MOODS.includes(moodAfter)) {
          issues.push(
            `${base}: 'evaluator_mood_after' é idêntico a um mood pré-definido — escreva algo original em primeira pessoa`
          );
        }
      }
      // Impression stub detection: Jules used "-- Impression A for [slug] under [perspective]"
      // as a placeholder comment. Real first-impressions are actual prose.
      const STUB_IMPRESSION_RE = /^-- Impression [AB] for /;
      if (
        data.impression_a != null &&
        STUB_IMPRESSION_RE.test(String(data.impression_a))
      ) {
        issues.push(
          `${base}: 'impression_a' é um stub de template, não uma impressão real`
        );
      }
      if (
        data.impression_b != null &&
        STUB_IMPRESSION_RE.test(String(data.impression_b))
      ) {
        issues.push(
          `${base}: 'impression_b' é um stub de template, não uma impressão real`
        );
      }
    } else if (isNewSchema && data.winner !== "TODO") {
      // Pre-stars new-schema matches: require the fields exist but don't
      // enforce the 100-word floor retroactively (rule did not exist at write time).
      if (!data.clash || data.clash === "TODO") {
        issues.push(
          `${base}: o campo 'clash' no frontmatter está ausente ou é 'TODO'`
        );
      }
      if (
        !data.eval_lang ||
        typeof data.eval_lang !== "string" ||
        !data.eval_lang.trim()
      ) {
        issues.push(`${base}: o campo 'eval_lang' no frontmatter está ausente`);
      }
      // Accept either the original winner_defense/loser_critique fields OR the
      // migrated review_a/review_b fields (migrate-passion-to-stars.js converts
      // passion-v1 files to the stars-v1 field layout while preserving prompt_version).
      const hasMigratedContent =
        (data.review_a && data.review_a !== "TODO") ||
        (data.review_b && data.review_b !== "TODO");
      if (!hasMigratedContent) {
        if (!data.winner_defense || data.winner_defense === "TODO") {
          issues.push(
            `${base}: o campo 'winner_defense' no frontmatter está ausente ou é 'TODO'`
          );
        }
        if (!data.loser_critique || data.loser_critique === "TODO") {
          issues.push(
            `${base}: o campo 'loser_critique' no frontmatter está ausente ou é 'TODO'`
          );
        }
      }
    }

    const expectedName = `${data.run_id}_${aKey}_x_${bKey}.md`;
    if (aKey && bKey && base !== expectedName) {
      issues.push(
        `${base}: nome de arquivo difere do esperado (${expectedName})`
      );
    }
  }

  // RFC 0010: selection-v1 validation. Every entry must point at an existing
  // file whose UUID matches; no two versions in a directory may share a UUID;
  // every directory with a publishable version must be selected; selected
  // versions of a translation group should sit on the same revision.
  {
    const selection = readSelection();
    // RFC 0015: a flat slug needs no selection.json entry at all — its
    // canonical IS the file, by construction. "Nobody ran select" is only
    // a real problem when NEITHER mechanism has published anything.
    const anyFlat = listAllVersionSlugs().some((s) => flatCanonicalPath(s));
    if (Object.keys(selection).length === 0 && !anyFlat) {
      issues.push(
        `${SELECTION_PATH}: ausente ou vazio — rode \`npm run hronir:select\`.`
      );
    }
    for (const [slug, entry] of Object.entries(selection)) {
      const p = path.join("src/content/blog", entry.file);
      if (!fs.existsSync(p)) {
        issues.push(
          `${SELECTION_PATH}: ${slug} aponta para arquivo inexistente (${entry.file})`
        );
        continue;
      }
      const uuid = getPostUuid(p);
      if (uuid !== entry.uuid) {
        issues.push(
          `${SELECTION_PATH}: ${slug} uuid divergente (registrado ${entry.uuid}, arquivo ${uuid}) — rode \`npm run hronir:select\``
        );
      }
    }
    const groupRevisions = new Map<string, Map<string, string[]>>();
    for (const slug of listAllVersionSlugs()) {
      const versions = listSlugVersions(slug);
      const byUuid = new Map<string, string[]>();
      for (const v of versions) {
        if (!byUuid.has(v.uuid)) byUuid.set(v.uuid, []);
        byUuid.get(v.uuid)!.push(v.file);
      }
      for (const [uuid, files] of byUuid) {
        if (files.length > 1) {
          issues.push(
            `${slug}/: versões com UUID duplicado (${uuid}): ${files.join(", ")} — estado degenerado, remova as cópias`
          );
        }
      }
      // A flat slug's canonical is always "selected" by construction — the
      // pointer-based check below only makes sense for a legacy slug.
      if (
        !flatCanonicalPath(slug) &&
        !selection[slug] &&
        versions.some((v) => v.published)
      ) {
        issues.push(
          `${slug}/: tem versão publicável mas não está em ${SELECTION_PATH} — rode \`npm run hronir:select\``
        );
      }
      // Divergence report (§4.4): selected versions of a translation group
      // should share a revision; null draftCreatedAt never pairs, so groups
      // containing them are skipped (no false positives for new posts).
      const sel = versions.find((v) => v.selected);
      if (sel?.translationKey && sel.draftCreatedAt) {
        if (!groupRevisions.has(sel.translationKey)) {
          groupRevisions.set(sel.translationKey, new Map());
        }
        const revs = groupRevisions.get(sel.translationKey)!;
        if (!revs.has(sel.draftCreatedAt)) revs.set(sel.draftCreatedAt, []);
        revs.get(sel.draftCreatedAt)!.push(slug);
      }
    }
    for (const [key, revs] of groupRevisions) {
      if (revs.size > 1) {
        const detail = [...revs.entries()]
          .map(([rev, slugs]) => `${slugs.join("+")}=${rev}`)
          .join(" vs ");
        warnings.push(
          `grupo "${key}" divergente entre línguas (${detail}) — próxima rodada de draft-worst/select deve reconvergir`
        );
      }
    }
  }

  // Advisory: scheduled-publish front-matter sanity.
  // Flag posts that pair draft:true with a publishDate (operator likely meant
  // one or the other), or that have an invalid publishDate value.
  const now = new Date();
  for (const p of listPosts()) {
    const data = readPost(p);
    const base = path.basename(p);
    if (data.publishDate != null) {
      const pd = new Date(data.publishDate as string | number | Date);
      if (Number.isNaN(pd.valueOf())) {
        issues.push(`${base}: publishDate inválido (${data.publishDate})`);
        continue;
      }
      if (data.draft === true) {
        issues.push(
          `${base}: draft:true combinado com publishDate — escolha um dos dois (publishDate=${pd.toISOString()})`
        );
      }
      const year = pd.getUTCFullYear();
      if (year < 2000 || year > now.getUTCFullYear() + 10) {
        issues.push(
          `${base}: publishDate fora da faixa plausível (${pd.toISOString()})`
        );
      }
    }
  }

  // Single dedup pass: duplicate after-moods + duplicate matches
  const seenAfterMoods = new Map(); // normalised text → first filename
  const seenEvalText = []; // [{ ref: "file#field", shingles: Set }]
  const seen = new Map(); // run_id::pair → first filepath
  for (const f of listMatchFiles()) {
    const { data } = readMatch(f);
    const base = path.basename(f);

    if (data.evaluator_mood_after) {
      const norm = String(data.evaluator_mood_after).trim().toLowerCase();
      if (norm) {
        if (seenAfterMoods.has(norm)) {
          issues.push(
            `${base}: 'evaluator_mood_after' duplicado (já aparece em ${seenAfterMoods.get(norm)}) — cada mood deve ser único`
          );
        } else {
          seenAfterMoods.set(norm, base);
        }
      }
    }

    // Lazy-evaluation guard: review_a/review_b/clash prose must not be reused
    // across matches. Catches both verbatim copies and "templated" text where
    // only post names were swapped (near-duplicates), which a low-effort or
    // broken session emits in bulk.
    for (const field of ["review_a", "review_b", "clash"]) {
      const v = data[field];
      if (typeof v === "string" && v.trim()) {
        const shingles = shingleSet(v);
        if (shingles.size >= 10) {
          let dupOf = null;
          for (const prev of seenEvalText) {
            if (jaccard(shingles, prev.shingles) >= 0.85) {
              dupOf = prev.ref;
              break;
            }
          }
          if (dupOf) {
            issues.push(
              `${base}: '${field}' quase-idêntico a ${dupOf} — avaliação preguiçosa/templada; cada review/clash deve ser original`
            );
          } else {
            seenEvalText.push({ ref: `${base}#${field}`, shingles });
          }
        }
      }
    }

    const aKey = (data.post_a as Record<string, unknown>)?.key as
      | string
      | undefined;
    const bKey = (data.post_b as Record<string, unknown>)?.key as
      | string
      | undefined;
    if (!aKey || !bKey) continue;
    const pair = [aKey, bKey].sort().join("|");
    const sig = `${data.run_id}::${pair}`;
    if (seen.has(sig)) {
      issues.push(
        `duplicate: ${path.basename(seen.get(sig))} e ${base} (mesmo run_id + par)`
      );
    } else {
      seen.set(sig, f);
    }
  }

  // RFC 0011: warn about genre field violations in music posts.
  // Warnings (not errors): won't block hronir sessions; guide content cleanup.
  {
    const GENRE_PROMPT_RE = /[:;,]/;
    const genreWarnings: string[] = [];
    for (const slug of listAllVersionSlugs()) {
      const canonical = listSlugVersions(slug).find((v) => v.selected);
      if (!canonical) continue;
      const p = canonical.path;
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf-8");
      if (!raw.includes("postType") || !raw.includes("music")) continue;
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[1];
      // Extract genre array items (simple list parsing)
      const genreBlock = fm.match(/^genre:\n((?:  -.+\n?)*)/m);
      if (!genreBlock) continue;
      const items = [...genreBlock[1].matchAll(/  - (.+)/g)].map((m) =>
        m[1].replace(/^["']|["']$/g, "").trim()
      );
      if (items.length > 5) {
        genreWarnings.push(
          `${slug}: genre tem ${items.length} items (máx 5) — rode a migração RFC 0011`
        );
      }
      for (const item of items) {
        if (item.length > 40) {
          genreWarnings.push(
            `${slug}: genre label muito longo (${item.length} chars): "${item.slice(0, 60)}..." — use sunoStyle para descrições longas`
          );
          break;
        }
        if (GENRE_PROMPT_RE.test(item)) {
          genreWarnings.push(
            `${slug}: genre label parece prompt Suno ("${item.slice(0, 60)}"...) — mova para sunoStyle`
          );
          break;
        }
      }
    }
    for (const w of genreWarnings) {
      console.warn(`  [warn] ${w}`);
    }
  }

  // Check for staged files outside the safe commit paths.
  // Only staged files matter — untracked/modified may be build artefacts.
  // Jules sometimes creates temp artefacts (decide_args*.json, rewrite_*.mjs,
  // etc.) that must NOT be staged — the autopilot rejects PRs that touch files
  // outside .routines/hronir/ and src/content/blog/.
  try {
    const SAFE_RE = /^(\.routines\/hronir\/|src\/content\/blog\/)/;
    // --diff-filter=ACMR: only flag Added, Copied, Modified, Renamed — not Deleted (D).
    // Deletions of out-of-scope files are legitimate cleanup; the autopilot only
    // rejects PRs that *add or modify* content outside the safe prefixes.
    const staged = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { encoding: "utf8" }
    )
      .split("\n")
      .filter(Boolean);
    for (const f of staged) {
      if (!SAFE_RE.test(f)) {
        issues.push(
          `Arquivo fora dos caminhos permitidos está staged: ${f} — faça \`git restore --staged ${f}\` antes de commitar (o autopilot rejeita PRs que tocam arquivos fora de .routines/hronir/ e src/content/blog/).`
        );
      }
    }
  } catch {
    // git not available or not a repo — skip silently
  }

  if (warnings.length > 0) {
    console.log(`doctor: ${warnings.length} aviso(s) (não bloqueiam):`);
    for (const w of warnings) console.log("  - " + w);
  }

  if (issues.length === 0) {
    console.log("doctor: 0 inconsistências.");
    return 0;
  }

  console.log(`doctor: ${issues.length} inconsistências:`);
  for (const i of issues) console.log("  - " + i);
  process.exitCode = 1;
  return issues.length;
}
