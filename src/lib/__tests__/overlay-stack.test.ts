import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// overlay-stack.ts reads/writes `window.__overlayStack` lazily inside each
// function call (not at import time), so aliasing `window` to `globalThis`
// is enough to exercise it under node:test -- no DOM/jsdom needed.
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;

const { pushOverlay, removeOverlay, isTopOverlay } =
  await import("../overlay-stack.ts");

describe("overlay-stack", () => {
  beforeEach(() => {
    (globalThis as unknown as { __overlayStack?: string[] }).__overlayStack =
      undefined;
  });

  it("nothing is on top before anything is pushed", () => {
    assert.equal(isTopOverlay("a"), false);
  });

  it("the most recently pushed id is on top", () => {
    pushOverlay("a");
    pushOverlay("b");
    assert.equal(isTopOverlay("b"), true);
    assert.equal(isTopOverlay("a"), false);
  });

  it("re-pushing an id already on the stack moves it to the top instead of duplicating it", () => {
    pushOverlay("a");
    pushOverlay("b");
    pushOverlay("a");
    assert.equal(isTopOverlay("a"), true);
    removeOverlay("a");
    // if "a" had been duplicated instead of moved, it would still be on top here
    assert.equal(isTopOverlay("b"), true);
  });

  it("removing the top overlay reveals the one beneath it", () => {
    pushOverlay("a");
    pushOverlay("b");
    removeOverlay("b");
    assert.equal(isTopOverlay("a"), true);
  });

  it("removing an id that isn't on the stack is a no-op", () => {
    pushOverlay("a");
    removeOverlay("nonexistent");
    assert.equal(isTopOverlay("a"), true);
  });
});
