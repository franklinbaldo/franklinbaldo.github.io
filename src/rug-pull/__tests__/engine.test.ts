import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAction,
  createGame,
  getPublicState,
  summarizeGame,
  type PlayerAction,
} from "../engine";

const script: PlayerAction[] = [
  { type: "hold" },
  { type: "investigate", kind: "wallet" },
  { type: "sell", fraction: 0.25 },
  { type: "hold" },
  { type: "investigate", kind: "contract" },
  { type: "buy" },
];

function run(seed: string) {
  let state = createGame(seed);
  for (const action of script) {
    if (state.status !== "playing") break;
    state = applyAction(state, action);
  }
  return state;
}

test("same seed and actions reproduce the same public game", () => {
  assert.deepEqual(getPublicState(run("duck-42")), getPublicState(run("duck-42")));
});

test("different seeds produce more than one creator profile", () => {
  const archetypes = new Set<string>();
  for (let index = 0; index < 80; index += 1) {
    let state = createGame(`seed-${index}`);
    while (state.status === "playing" && state.beat < 2) {
      state = applyAction(state, { type: "hold" });
    }
    if (state.status !== "playing") {
      archetypes.add(summarizeGame(state).archetype);
    } else {
      for (let guard = 0; guard < 40 && state.status === "playing"; guard += 1) {
        state = applyAction(state, { type: "hold" });
      }
      archetypes.add(summarizeGame(state).archetype);
    }
  }
  assert.equal(archetypes.size, 4);
});

test("sell all exits immediately and portfolio remains finite", () => {
  const state = applyAction(createGame("exit-now"), { type: "sell", fraction: 1 });
  const view = getPublicState(state);

  assert.equal(state.status, "exited");
  assert.equal(view.player.tokens, 0);
  assert.ok(Number.isFinite(view.portfolioValue));
  assert.ok(view.portfolioValue > 0);
  assert.doesNotThrow(() => summarizeGame(state));
});

test("investigations consume attention and emit research evidence", () => {
  const initial = createGame("research-run");
  const state = applyAction(initial, { type: "investigate", kind: "wallet" });

  assert.equal(state.player.attention, initial.player.attention - 1);
  assert.ok(state.feed.some((event) => event.kind === "research" && event.label === "WALLET CHECK"));
});

test("attention exhaustion does not advance the simulation", () => {
  let state = createGame("no-attention");
  state.player.attention = 0;
  const next = applyAction(state, { type: "investigate", kind: "contract" });

  assert.equal(next.beat, state.beat);
  assert.equal(next.status, "playing");
  assert.equal(next.feed.at(-1)?.kind, "system");
});

test("a complete hold-only session terminates with valid market invariants", () => {
  let state = createGame("long-run");

  for (let guard = 0; guard < 80 && state.status === "playing"; guard += 1) {
    state = applyAction(state, { type: "hold" });
    assert.ok(state.market.price > 0);
    assert.ok(state.market.liquidity >= 0);
    assert.ok(state.market.holders >= 0);
    assert.ok(state.player.cash >= 0);
    assert.ok(state.player.tokens >= 0);
  }

  assert.notEqual(state.status, "playing");
  const summary = summarizeGame(state);
  assert.ok(Number.isFinite(summary.pnlPercent));
  assert.ok(summary.creatorTimeline.length > 0);
});
