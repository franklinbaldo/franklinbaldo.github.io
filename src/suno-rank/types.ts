// Music-ranking equivalent of src/hronir/types.ts, scoped to what this
// system actually needs (see docs/rfcs/0018-hronir-de-musica.md for what
// was deliberately dropped from the text Hrönir system and why).

/** Per-axis 1-5 scores Gemini assigns each side of a duel. */
export interface AxisScores {
  production: { a: number; b: number };
  songwriting: { a: number; b: number };
  vocals: { a: number; b: number };
  emotionalImpact: { a: number; b: number };
}

/** One judged duel, as persisted to .routines/suno-rank/duels/*.json. */
export interface DuelRecord {
  schema: "duel-v1";
  runId: string;
  runAt: string;
  aKey: string;
  bKey: string;
  winner: "a" | "b";
  rateA: number;
  rateB: number;
  rationale: string;
  axisScores: AxisScores;
  perspectiveId: string | null;
  model: string;
}

/** Flat projection of a DuelRecord, as fed to the ranking math. */
export interface RawMatch {
  runAt: string;
  runId: string;
  aKey: string;
  bKey: string;
  winner: "a" | "b";
  rateA: number;
  rateB: number;
}

export interface RankRow {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  wins: number;
}
