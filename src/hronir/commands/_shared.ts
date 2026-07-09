import fs from "node:fs";
import matter from "gray-matter";
import {
  getPostUuid,
  getPostUuidLegacy,
  getPostUuidPreOkfType,
  listPosts,
  keyForPath,
} from "../posts.js";
import { listSlugVersions, type VersionInfo } from "../selection.js";
import { loadPerspective } from "../perspectives.js";

export type PostSideRaw = { key?: string; slug?: string } | null | undefined;

export const SESSION_PATH = "hronir_session.json";

export const MIN_WORDS = 100;

export function wordCount(s: unknown): number {
  if (!s || typeof s !== "string") return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function utcStamp() {
  const iso = new Date().toISOString();
  return {
    runId: iso.replace(/[:.]/g, "-").replace(/Z$/, ""),
    runAt: iso,
  };
}

export function nextStep(text: string): void {
  const border = "━".repeat(80);
  console.log("");
  console.log(border);
  console.log("👉 PRÓXIMO PASSO / NEXT STEP:");
  console.log(border);
  console.log(text);
  console.log(border);
}

export const SELECT_MIN_DUELS = 2;

// Stars + duel count for a version, looking up the rating map by the RFC 0010
// UUID first, the legacy body-only UUID (stars-v1 rate files) second, and the
// pre-RFC-0014 UUID (recorded before the OKF type/docType migration) third.
export function versionStars(
  ratings: Map<string, { stars: number; n: number }>,
  v: VersionInfo
): { stars: number; n: number } | null {
  return (
    ratings.get(v.uuid) ??
    ratings.get(v.legacyUuid) ??
    ratings.get(v.preOkfUuid) ??
    null
  );
}

// RFC 0010 §4.3: the cached path in an in-flight match is a hint; the stable
// address is ref = slug@uuid. If the file moved between match generation and
// evaluation (rename, prune), find the peer with the same UUID — current or
// legacy — in the slug's directory. Exits with a clear message when the
// content is gone for good instead of crashing on readFileSync.
function resolveSidePath(
  side: { path?: string; ref?: string; key?: string } | null | undefined,
  label: string
): string {
  const ref = side?.ref;
  let slug: string | null = null;
  let uuid: string | null = null;
  if (ref && ref.includes("@")) {
    const at = ref.lastIndexOf("@");
    slug = ref.slice(0, at);
    uuid = ref.slice(at + 1);
  }
  if (side?.path && fs.existsSync(side.path)) {
    // Pre-stars-v2 session without ref: the path is all we have.
    if (!uuid) return side.path;
    // The path is only authoritative while it still carries the duelled
    // content — an in-place edit mid-session would otherwise attribute the
    // evaluation to the old UUID over the new text.
    if (
      getPostUuid(side.path) === uuid ||
      getPostUuidLegacy(side.path) === uuid ||
      getPostUuidPreOkfType(side.path) === uuid
    ) {
      return side.path;
    }
  }
  if (slug && uuid) {
    const hit = listSlugVersions(slug).find(
      (v) => v.uuid === uuid || v.legacyUuid === uuid || v.preOkfUuid === uuid
    );
    if (hit) return hit.path;
  }
  console.error(
    `Erro: o conteúdo do post ${label} do match atual não existe mais (path=${side?.path ?? "?"}, ref=${ref ?? "—"}).`
  );
  console.error(
    "A versão foi removida, renomeada ou editada após a geração do match. Rode `npm run hronir:end -- --force` e inicie nova sessão."
  );
  process.exit(1);
}

// Render one side (A or B) of the current match: header, slug, file path,
// optional Suno links, and the content (or a path-only pointer). Shared by
// `continue` (post A), `first-impression-a` (post B) and `generate-match`.
export function printSidePost(session: any, side: "A" | "B") {
  const match = session.currentMatch;
  const post = side === "A" ? match?.post_a : match?.post_b;
  const p = resolveSidePath(post, side);
  const slug = post?.key || "(slug desconhecido)";
  const content = fs.readFileSync(p, "utf8");
  const sunoId = matter(content).data.sunoId;
  const pathOnly = session.contentMode === "path-only";
  const border = "━".repeat(80);
  const header =
    side === "A" ? "📄 PRIMEIRO POST (A) " : "📄 SEGUNDO POST (B) ";
  console.log(header + "━".repeat(Math.max(0, 80 - header.length)));
  console.log(`Slug: ${slug}`);
  console.log(`Arquivo: ${p}`);
  if (sunoId) {
    console.log(`🎵 Suno Song Page: https://suno.com/song/${sunoId}`);
    console.log(
      `🔊 Direct Audio URL (MP3): https://cdn1.suno.ai/${sunoId}.mp3`
    );
    console.log(
      `💡 Agente multimodal: você pode baixar/ouvir o MP3 acima para informar sua avaliação.`
    );
  }
  console.log(`${border}\n`);
  if (!pathOnly) {
    console.log(content);
    console.log(`\n${border}\n`);
  } else {
    console.log(`[content-mode: path-only — leia o arquivo em: ${p}]`);
    console.log(`\n${border}\n`);
  }
}

// Print the decide instructions for the current match: perspective line,
// glyph + initial mood, slugs, formatting/length rules and the example
// command. Shared by `first-impression-b` and `generate-match`.
export function printDecidePrompt(session: any) {
  const currentMatch = session.currentMatch;
  const perspectiveId = currentMatch.perspective_id;
  let perspective = null;
  if (perspectiveId) {
    try {
      perspective = loadPerspective(perspectiveId);
    } catch (e: unknown) {
      console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
      process.exit(1);
    }
  }

  const aSlug = currentMatch.post_a?.key || "(slug desconhecido)";
  const bSlug = currentMatch.post_b?.key || "(slug desconhecido)";
  const moodGlyph = currentMatch.mood_glyph ?? null;
  const moodGlyphCp = moodGlyph
    ? "U+" +
      moodGlyph.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
    : null;
  const initialMood = currentMatch.evaluator_mood ?? null;
  const evalLang = currentMatch.eval_lang || session.evalLang || "pt";
  const evalLangLabel = evalLang === "pt" ? "português" : evalLang;

  const perspectiveLine = perspective
    ? `Avalie a partir da perspectiva: ${perspective.name} (id: ${perspectiveId}). A perspectiva é fixa para este match — não há override.`
    : "(sem perspectiva atribuída — sessão inconsistente; rode novamente `npm run hronir:continue`)";

  const border = "━".repeat(80);
  const stepLines = [
    perspectiveLine,
    "",
    border,
    `🔣 SEU GLIFO (Unicode aleatório): ${moodGlyph ?? "—"}  (${moodGlyphCp ?? "—"})`,
    `🌡️  SEU MOOD INICIAL: ${initialMood ?? "—"}`,
    border,
    "PRIMEIRO, antes de tudo, decida o seu --after-mood. O Hronir sorteou o",
    "glifo acima por você — leia-o subjetivamente. Combine essa leitura com",
    "o seu mood inicial e com o que estes dois posts e o",
    "confronto entre eles te fizeram sentir. Desse caldo sai o seu estado",
    "interno agora — e é ele que vai colorir o tom com que você escreve as",
    "resenhas e o clash a seguir. Por isso o --after-mood é a PRIMEIRA flag.",
    "",
    `Slugs deste match: A = "${aSlug}", B = "${bSlug}".`,
    "Nas resenhas e no confronto, refira-se a cada post pelo seu slug",
    '(ex.: "' +
      aSlug +
      '"), não por "Post A" / "Post B". Isso mantém os relatos',
    "legíveis fora do contexto efêmero do match.",
    "",
    "Atribua estrelas (1.00–5.00) a cada post e escreva uma resenha de cada,",
    "depois um confronto. O vencedor é derivado mecanicamente: quem",
    "tiver mais estrelas. Empates são rejeitados — comprometa-se.",
    "",
    "As resenhas e o confronto são renderizados como Markdown — pode usar",
    "ênfase, listas, blockquotes para citar trechos, e emojis quando ajudarem",
    "a marcar tom ou veredito. Use a formatação a serviço da leitura, sem exagero.",
    "",
    "Além de avaliar, fique à vontade para sugerir melhorias concretas ao post",
    "(o que cortar, expandir, reordenar) e apontar conteúdo relevante que veio",
    "à mente sobre o assunto — uma referência, um autor, um exemplo, um link.",
    "Essas sugestões alimentam a fase de edição; quanto mais específicas, melhor.",
    "",
    `🌐 LÍNGUA DE AVALIAÇÃO: ${evalLangLabel} (eval_lang: ${evalLang}). Escreva --review-a, --review-b e --clash nessa língua. O post pode estar em outra língua — não importa: a avaliação é sempre em ${evalLangLabel}.`,
    "",
    "- --after-mood: [PRIMEIRA flag; máx. 250 chars] Seu estado interno agora, em",
    "  primeira pessoa, decidido a partir do glifo + mood inicial + o que o match",
    "  te fez sentir. Pode ser incompleto, sensorial, mundano — o que estiver na",
    "  cabeça ou no corpo. NÃO descreva os posts. NÃO repita o mood inicial do banner.",
    '  Ex.: "Estou com vontade de assistir a um filme agora — algo longo e sem pressa."',
    '  Ex.: "Preciso sentir grama nos pés agora."',
    '  Ex.: "Estou ansioso para a viagem do mês que vem — fico pensando no aeroporto às 6h da manhã."',
    "- --rate-a / --rate-b: número de 1.00 a 5.00 com até duas casas decimais (proibido empate)",
    "- --review-a / --review-b: mínimo 100 palavras cada, escritas a partir da perspectiva atribuída, referindo-se ao post pelo slug",
    "- --clash: mínimo 100 palavras, narra o confronto entre os dois posts (pelos slugs) pela ótica da perspectiva",
    "",
    border,
    `Para decidir, rode (--after-mood primeiro):`,
    `npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`,
    border,
  ];
  nextStep(stepLines.join("\n"));
}

export function buildPathToKeyIndex() {
  const idx = new Map();
  for (const p of listPosts()) {
    idx.set(p, keyForPath(p));
  }
  return idx;
}

// ── RFC 0010 §4.2/§4.4: ranking-driven selection (amended 2026-07-01) ───────
export const PRUNED_PATH = "src/generated/versions-pruned.json";

export const PRUNE_MARGIN = 0.5;

export const PRUNE_MIN_DUELS = 3;
