import fs from "node:fs";
import { SESSION_PATH } from "./_shared.js";

// Reprint the glyph (with its U+ codepoint) and the initial mood for the
// current match. The glyph is also shown by `generate-match`; this is for
// re-reading it without regenerating.
export function getGlipho() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(
      "Erro: Nenhuma sessão ativa. Rode `npx hronir generate-match` primeiro."
    );
    process.exit(1);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  const match = session.currentMatch;
  if (!match) {
    console.error(
      "Erro: nenhum match ativo. Rode `npx hronir generate-match` primeiro."
    );
    process.exit(1);
  }
  const glyph = match.mood_glyph ?? null;
  const cp = glyph
    ? "U+" + glyph.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
    : "—";
  console.log(`🔣 SEU GLIFO (Unicode aleatório): ${glyph ?? "—"}  (${cp})`);
  console.log(`🌡️  SEU MOOD INICIAL: ${match.evaluator_mood ?? "—"}`);
}
