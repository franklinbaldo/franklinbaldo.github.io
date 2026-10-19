import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

test("article runtime survives navigation and shares without duplicate handlers", async () => {
  const events = new Map();
  const windowEvents = [];
  const classes = () => ({
    values: new Map(),
    toggle(name, value) {
      this.values.set(name, value);
    },
  });
  const body = { getBoundingClientRect: () => ({ top: -200, height: 2000 }) };
  const heading = { getBoundingClientRect: () => ({ top: 10 }) };
  const tocLink = {
    hash: "#heading",
    classList: classes(),
    setAttribute() {},
    removeAttribute() {},
  };
  const top = { classList: classes() };
  const progress = { value: 0 };
  const status = { textContent: "" };
  const button = {
    dataset: {
      url: "https://franklinbaldo.github.io/blog/test/",
      title: "Test",
      copied: "Copied",
      error: "Failed",
    },
    parentElement: { querySelector: () => status },
    closest: () => button,
    setAttribute() {},
    removeAttribute() {},
  };
  const document = {
    readyState: "complete",
    querySelector: (selector) =>
      selector.includes("data-zola-content")
        ? body
        : selector === "[data-article-top]"
          ? top
          : null,
    querySelectorAll: () => [tocLink],
    getElementById: (id) => (id === "read-progress" ? progress : heading),
    addEventListener: (name, fn) =>
      events.set(name, [...(events.get(name) ?? []), fn]),
  };
  const copied = [];
  const context = {
    document,
    window: {
      addEventListener: (name, fn, options) =>
        windowEvents.push({ name, fn, options }),
    },
    navigator: { clipboard: { writeText: async (text) => copied.push(text) } },
    innerHeight: 800,
    scrollY: 1000,
    AbortController,
    Symbol,
    WeakSet,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    decodeURIComponent,
    location: { href: "https://example.test/" },
  };
  const source = readFileSync(
    new URL("../../zola/static/js/article.js", import.meta.url),
    "utf8"
  );
  runInNewContext(source, context);
  assert.equal(progress.value, 50);
  assert.equal(top.classList.values.get("is-scrolled"), true);
  for (let i = 0; i < 3; i++) {
    runInNewContext(source, context);
    events.get("zola:page-load")[0]();
  }
  assert.equal(events.get("click").length, 1);
  assert.equal(
    windowEvents.filter((entry) => !entry.options.signal.aborted).length,
    2
  );
  await events.get("click")[0]({ target: button });
  assert.deepEqual(copied, [button.dataset.url]);
  assert.equal(status.textContent, "Copied");
  context.navigator.share = async () => {
    const error = new Error("cancelled");
    error.name = "AbortError";
    throw error;
  };
  await events.get("click")[0]({ target: button });
  assert.equal(
    copied.length,
    1,
    "cancelled native share must not copy unexpectedly"
  );
  events.get("zola:before-swap")[0]();
  assert.ok(windowEvents.every((entry) => entry.options.signal.aborted));
});
