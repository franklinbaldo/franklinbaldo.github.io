/**
 * Adds translationKey to all PT music posts and creates EN companion stubs.
 *
 * Usage:
 *   node scripts/generate-music-en-companions.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { listPostFiles, postIdFromPath } from "./lib/content.mjs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
// Music posts share src/content/blog/ with regular posts since RFC 0006;
// postType: music in the frontmatter is what identifies them.
const BLOG_DIR = join(ROOT, "src/content/blog");

// Known English translations for PT titles
const TITLE_TRANSLATIONS = {
  "Borges e eu": "Borges and I",
  Beatriz: "Beatrice",
  "Be Me, Borges": "Be Me, Borges",
  "Bibliotecário do Infinito": "Librarian of the Infinite",
  Caminho: "The Path",
  "Chegue, Irmão! Chegue, Irmã!": "Come, Brother! Come, Sister!",
  Clipes: "Paperclips",
  Espelhos: "Mirrors",
  "Eu ia Escrever Sobre o Infinito de Novo":
    "I Was Going to Write About Infinity Again",
  "Leite no Salão-Bar": "Milk at the Bar",
  "Meditação Guiada no Sertão": "Guided Meditation in the Sertão",
  "Menino, Que Você Foi": "The Boy You Were",
  Mindfulness: "Mindfulness",
  Nonada: "Nonada (Trifle)",
  "O Aleph": "The Aleph",
  "O Mágico e o Fogo": "The Magician and the Fire",
  "O Medo do Louco": "The Fear of the Madman",
  "O Preço da Saudade": "The Price of Saudade",
  "O Prólogo": "The Prologue",
  "O Regral": "O Regral (The Rulial)",
  "O Ritual de Abril — Anos de Saudade": "The April Ritual — Years of Longing",
  "O Sonhador e o Fogo": "The Dreamer and the Fire",
  "O Telefone da Agonia": "The Phone of Agony",
  "O Tempo": "Time",
  "O Verso Branquiceleste": "The Sky-White Verse",
  "Primavera Carregando": "Spring Carrying",
  "Quando Vier a Primavera": "When Spring Comes",
  "Riobaldo e o Aleph": "Riobaldo and the Aleph",
  "Sentido e Referência": "Sense and Reference",
  "Sobre o Rigor na Ciência": "On Rigor in Science",
  "Trinta de Abril": "April Thirtieth",
  "Uma Só Canção": "A Single Song",
  "Véu do Infinito": "Veil of Infinity",
  Vós: "You (Plural)",
  Xadrez: "Chess",
  "A Primeira Mudança": "The First Change",
  "Entre Rascunho e Apagar": "Between Draft and Erasing",
  666: "666",
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function getEnTitle(ptTitle) {
  if (!ptTitle) return ptTitle;
  // If title looks already English (no PT-specific chars), keep it
  if (!/[áàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]/.test(ptTitle)) return ptTitle;
  return TITLE_TRANSLATIONS[ptTitle] || ptTitle;
}

function addTranslationKey(frontmatter, slug) {
  if (frontmatter.includes("translationKey:")) return frontmatter;
  // Insert after lang: pt line
  return frontmatter.replace(
    /^(lang: pt)$/m,
    `$1\ntranslationKey: music-${slug}`
  );
}

function buildEnFrontmatter(ptFrontmatter, enTitle, slug) {
  let fm = ptFrontmatter;

  // Update title
  fm = fm.replace(/^title: .*$/m, `title: ${JSON.stringify(enTitle)}`);

  // Update description
  fm = fm.replace(
    /^description: .*$/m,
    `description: ${JSON.stringify(`Music by Franklin Baldo — ${enTitle}`)}`
  );

  // Update lang
  fm = fm.replace(/^lang: pt$/m, "lang: en");

  // Update tags
  fm = fm.replace(/^tags:\n  - música$/m, "tags:\n  - music");

  // Add translationKey if not present
  if (!fm.includes("translationKey:")) {
    fm = fm.replace(/^lang: en$/m, `lang: en\ntranslationKey: music-${slug}`);
  } else {
    fm = fm.replace(
      /^translationKey: music-.*$/m,
      `translationKey: music-${slug}`
    );
  }

  return fm;
}

function makeEnBody(ptBody, enTitle) {
  // Replace "## Letra" with "## Lyrics" and "## Notas do compositor" with "## Composer Notes"
  return ptBody
    .replace(/^## Letra$/m, "## Lyrics")
    .replace(/^## Notas do compositor$/m, "## Composer Notes");
}

async function main() {
  // RFC 0010: posts live in <slug>/v-<timestamp>.mdx; listPostFiles returns
  // the selected version of each. Discover music posts (postType: music,
  // slug not already an -en companion).
  const ptFiles = listPostFiles().filter((abs) => {
    if (!abs.endsWith(".mdx")) return false;
    if (postIdFromPath(abs).endsWith("-en")) return false;
    return /^postType: music$/m.test(readFileSync(abs, "utf8"));
  });

  console.log(`Found ${ptFiles.length} PT music files to process.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const ptPath of ptFiles) {
    const slug = postIdFromPath(ptPath);
    const enDir = join(BLOG_DIR, `${slug}-en`);
    const stamp = new Date()
      .toISOString()
      .replace(/\.\d+Z$/, "")
      .replace(/:/g, "-");
    const enPath = join(enDir, `v-${stamp}.mdx`);

    const content = readFileSync(ptPath, "utf8");
    const parsed = parseFrontmatter(content);
    if (!parsed) {
      console.warn(`  skip (no frontmatter): ${ptPath}`);
      skipped++;
      continue;
    }

    const { frontmatter, body } = parsed;

    // Extract PT title
    const titleMatch = frontmatter.match(/^title: (.+)$/m);
    const rawTitle = titleMatch
      ? titleMatch[1].replace(/^["']|["']$/g, "")
      : slug;
    const enTitle = getEnTitle(rawTitle);

    // Update PT file: add translationKey
    const newFrontmatter = addTranslationKey(frontmatter, slug);
    if (newFrontmatter !== frontmatter) {
      writeFileSync(ptPath, `---\n${newFrontmatter}\n---\n${body}`, "utf8");
      updated++;
    }

    // Create EN companion (never overwrite an existing companion dir)
    if (existsSync(enDir)) {
      skipped++;
      continue;
    }

    const enFrontmatter = buildEnFrontmatter(newFrontmatter, enTitle, slug);
    const enBody = makeEnBody(body, enTitle);
    mkdirSync(enDir, { recursive: true });
    writeFileSync(enPath, `---\n${enFrontmatter}\n---\n${enBody}`, "utf8");
    console.log(`  created: ${slug}-en/v-${stamp}.mdx`);
    created++;
  }

  console.log(
    `\nDone: ${updated} PT files updated, ${created} EN companions created, ${skipped} skipped.`
  );
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
