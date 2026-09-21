// Validator for .routines/suno-rank/duels/*.json — much smaller than the
// text system's doctor.ts: no token-stuffing/near-duplicate-prose checks
// (nothing to game — Gemini's output is structured, not free-form human
// prose written to satisfy a word-count minimum). See
// docs/rfcs/0018-hronir-de-musica.md.
import { loadDuels } from "../duels.js";

const AXES = [
  "production",
  "songwriting",
  "vocals",
  "emotionalImpact",
] as const;

export function doctor(): { errors: string[]; count: number } {
  const duels = loadDuels();
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const d of duels) {
    const label = `${d.runId}_${d.aKey}_x_${d.bKey}`;

    if (d.schema !== "duel-v1") {
      errors.push(`${label}: unknown schema "${d.schema}"`);
      continue;
    }
    if (d.aKey === d.bKey) {
      errors.push(`${label}: aKey === bKey (self-duel)`);
    }
    if (d.winner !== "a" && d.winner !== "b") {
      errors.push(
        `${label}: winner must be "a" or "b", got ${JSON.stringify(d.winner)}`
      );
    }
    if (!d.rationale || !d.rationale.trim()) {
      errors.push(`${label}: empty rationale`);
    }
    for (const axis of AXES) {
      const pair = d.axisScores?.[axis];
      if (!pair || pair.a < 1 || pair.a > 5 || pair.b < 1 || pair.b > 5) {
        errors.push(`${label}: axisScores.${axis} out of [1,5] or missing`);
      }
    }
    const avg = (side: "a" | "b") =>
      AXES.reduce((sum, axis) => sum + (d.axisScores?.[axis]?.[side] ?? 0), 0) /
      AXES.length;
    const impliedWinner = avg("a") >= avg("b") ? "a" : "b";
    if (impliedWinner !== d.winner) {
      errors.push(
        `${label}: declared winner "${d.winner}" contradicts axis-score average`
      );
    }

    // Same (aKey,bKey,runId) written twice would double-count a duel in
    // the ranking — filenames already prevent this at the FS level
    // (writeDuel's filename is exactly this triple), but a doctor check
    // catches it even if two files ever collide under a renamed scheme.
    const dupeId = `${d.runId}|${d.aKey}|${d.bKey}`;
    if (seenIds.has(dupeId)) {
      errors.push(`${label}: duplicate duel (same runId+pair as another file)`);
    }
    seenIds.add(dupeId);
  }

  return { errors, count: duels.length };
}
