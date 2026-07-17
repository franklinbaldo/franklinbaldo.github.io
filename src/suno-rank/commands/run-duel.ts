// One-shot duel: pick a pair -> call Gemini -> write the result. No
// init/continue/decide/end ceremony and no session file — unlike the text
// Hrönir system, there's no human step to interleave between picking a
// pair and judging it (see docs/rfcs/0018-hronir-de-musica.md).
import { loadPublicSongs, pickNextPair } from "../pairing.js";
import { writeDuel } from "../duels.js";
import { loadPerspective } from "../../hronir/perspectives.js";
import { judgeDuel } from "../../../scripts/suno-rank/lib/gemini-judge.mjs";

// Perspectives that read as genuine listening lenses for audio, curated
// out of the full text-Hrönir set (see the RFC's "Perspectives, lightly"
// section — most of the 14 are essay/joke/pedagogy-specific and don't
// transfer to judging a song).
const LENS_IDS = ["craft-listener", "lyric-as-poem", "felt-not-explained"];

function utcStamp() {
  const iso = new Date().toISOString();
  return { runId: iso.replace(/[:.]/g, "-").replace(/Z$/, ""), runAt: iso };
}

function pickLens(): { id: string; text: string } {
  const id = LENS_IDS[Math.floor(Math.random() * LENS_IDS.length)];
  const p = loadPerspective(id);
  return { id, text: p.summary };
}

export interface RunDuelResult {
  ok: boolean;
  reason?: string;
  aKey?: string;
  bKey?: string;
}

export async function runOneDuel(): Promise<RunDuelResult> {
  const songs = loadPublicSongs();
  const pair = pickNextPair(songs);
  if (!pair) return { ok: false, reason: "not enough public songs to pair" };

  const lens = pickLens();
  let verdict;
  try {
    verdict = await judgeDuel({
      songA: pair.a,
      songB: pair.b,
      lensText: lens.text,
    });
  } catch (err) {
    return {
      ok: false,
      reason: (err as Error).message,
      aKey: pair.a.id,
      bKey: pair.b.id,
    };
  }
  if (!verdict) {
    return {
      ok: false,
      reason: "Gemini verdict was incomplete or failed validation",
      aKey: pair.a.id,
      bKey: pair.b.id,
    };
  }

  const { runId, runAt } = utcStamp();
  writeDuel({
    schema: "duel-v1",
    runId,
    runAt,
    aKey: pair.a.id,
    bKey: pair.b.id,
    winner: verdict.winner,
    rateA: verdict.rateA,
    rateB: verdict.rateB,
    rationale: verdict.rationale,
    axisScores: verdict.axisScores,
    perspectiveId: lens.id,
    model: verdict.model,
  });
  return { ok: true, aKey: pair.a.id, bKey: pair.b.id };
}

export async function runDuels(count: number): Promise<RunDuelResult[]> {
  const results: RunDuelResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await runOneDuel());
  }
  return results;
}
