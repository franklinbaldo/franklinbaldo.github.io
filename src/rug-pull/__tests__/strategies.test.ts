import assert from "node:assert/strict";
import test from "node:test";
import { applyAction, createGame, summarizeGame } from "../engine";

function finishWithHolds(seed: string) {
  let state = createGame(seed);
  for (let guard = 0; guard < 80 && state.status === "playing"; guard += 1) {
    state = applyAction(state, { type: "hold" });
  }
  assert.notEqual(state.status, "playing", `seed ${seed} did not terminate`);
  return state;
}

test("seed corpus contains rug and non-rug endings", () => {
  const statuses = new Set<string>();

  for (let index = 0; index < 120; index += 1) {
    statuses.add(finishWithHolds(`ending-${index}`).status);
  }

  assert.ok(statuses.has("rugged"), "expected at least one rug ending");
  assert.ok(
    statuses.has("survived") || statuses.has("collapsed"),
    "expected at least one non-rug ending"
  );
});

test("creator archetypes produce distinct hidden causal histories", () => {
  const byArchetype = new Map<string, Set<string>>();

  for (let index = 0; index < 120; index += 1) {
    const summary = summarizeGame(finishWithHolds(`archetype-${index}`));
    const notes = byArchetype.get(summary.archetype) ?? new Set<string>();
    for (const item of summary.creatorTimeline) notes.add(item.note);
    byArchetype.set(summary.archetype, notes);
  }

  assert.equal(byArchetype.size, 4);
  for (const notes of byArchetype.values()) {
    assert.ok(
      notes.size >= 2,
      "each archetype should leave more than one causal note"
    );
  }
});

test("selling early and holding the same seed can produce different player outcomes", () => {
  const seed = "decision-matters";
  const earlyExit = applyAction(createGame(seed), {
    type: "sell",
    fraction: 1,
  });
  const held = finishWithHolds(seed);

  const earlySummary = summarizeGame(earlyExit);
  const heldSummary = summarizeGame(held);

  assert.notEqual(earlySummary.finalValue, heldSummary.finalValue);
  assert.equal(earlySummary.status, "exited");
});

test("research evidence never exposes the archetype label during play", () => {
  let state = createGame("no-spoilers");
  state = applyAction(state, { type: "investigate", kind: "creator" });

  const publicText = state.feed
    .map((event) => `${event.label} ${event.text}`)
    .join(" ")
    .toLowerCase();
  for (const forbidden of [
    "sociopath",
    "true_believer",
    "desperate_dev",
    "accidental_success",
  ]) {
    assert.equal(publicText.includes(forbidden), false);
  }
});
