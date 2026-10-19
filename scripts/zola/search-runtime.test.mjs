import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = readFileSync(
  new URL("../../zola/static/js/search.js", import.meta.url),
  "utf8"
);
function setup(href) {
  const handlers = new Map();
  const location = new URL(href);
  const language = { href: "https://example.test/search/" };
  const searches = [];
  const history = {
    state: { scroll: [0, 120] },
    replaceState(state, _, url) {
      assert.equal(state, this.state, "navigation scroll state is preserved");
      location.href = url.href;
    },
  };
  const container = {
    dataset: { language: "pt" },
    addEventListener: (type, fn) => handlers.set(type, fn),
  };
  runInNewContext(source, {
    URL,
    URLSearchParams,
    location,
    history,
    document: {
      querySelector: (selector) => (selector === "#search" ? container : {}),
      querySelectorAll: () => [language],
    },
    window: {
      PagefindUI: class {
        triggerSearch(term) {
          searches.push(term);
        }
      },
    },
  });
  return {
    location,
    language,
    searches,
    input: (value) =>
      handlers.get("input")({ target: { value, matches: () => true } }),
    clear: () => handlers.get("click")({ target: { closest: () => true } }),
  };
}
test("typed search survives reload, preserves parameters and follows the language switch", () => {
  const app = setup("https://example.test/pt/search/?source=archive#main");
  app.input("ação & memória");
  assert.equal(app.location.searchParams.get("q"), "ação & memória");
  assert.equal(app.location.searchParams.get("source"), "archive");
  assert.equal(app.location.hash, "#main");
  assert.equal(
    new URL(app.language.href).searchParams.get("q"),
    "ação & memória"
  );
  assert.deepEqual(setup(app.location.href).searches, ["ação & memória"]);
});
test("editing and clearing a prefilled query never restores the stale URL query", () => {
  const app = setup("https://example.test/pt/search/?q=old");
  assert.deepEqual(app.searches, ["old"]);
  assert.equal(new URL(app.language.href).searchParams.get("q"), "old");
  app.input("new");
  assert.equal(app.location.searchParams.get("q"), "new");
  app.clear();
  assert.equal(app.location.searchParams.has("q"), false);
  assert.equal(new URL(app.language.href).searchParams.has("q"), false);
  assert.deepEqual(setup(app.location.href).searches, []);
  app.input("again");
  app.input("");
  assert.equal(app.location.searchParams.has("q"), false);
});
