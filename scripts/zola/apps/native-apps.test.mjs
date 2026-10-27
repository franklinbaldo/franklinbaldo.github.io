import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { renderFactory } from "./factory.mjs";
import { agentProviders } from "../../../src/lib/repo-factory-agents.mjs";
import { renderAtlas } from "./atlas.mjs";
import { readDeck } from "./decks.mjs";
import { readScienceCards, scienceGraph } from "./science.mjs";

const read = (file) => readFileSync(file, "utf8");
const count = (text, regex) => [...text.matchAll(regex)].length;

test("science projection reads every canonical card and retains graph identities", () => {
  const cards = readScienceCards();
  for (const key of ["branches", "formulas", "families"]) {
    assert.equal(
      cards[key].length,
      readdirSync(`knowledge/science-equations/${key}`).filter((name) =>
        name.endsWith(".md")
      ).length
    );
    assert.deepEqual(
      cards[key].map((item) => item.name),
      cards[key].map((item) => item.name).sort((a, b) => a.localeCompare(b))
    );
  }
  const graph = scienceGraph(cards);
  assert.deepEqual(
    graph.formulas.map((formula) => formula.id),
    cards.formulas.map((formula) => formula.slug)
  );
  assert.deepEqual(
    graph.families.map((family) => family.id),
    cards.families.map((family) => family.slug)
  );
  assert.deepEqual(
    graph.domains.map((domain) => domain.id),
    cards.branches.find((branch) => branch.slug === "science").children
  );
  assert.equal(
    graph.updated,
    [...cards.branches, ...cards.formulas, ...cards.families]
      .map((card) => card.updated)
      .sort()
      .at(-1)
  );
});

test("science links use the same deduplication, anchor and relative-path semantics", () => {
  const root = mkdtempSync(join(tmpdir(), "zola-science-"));
  try {
    for (const directory of ["branches", "formulas", "families"])
      mkdirSync(join(root, directory));
    writeFileSync(
      join(root, "branches", "science.md"),
      "---\ntype: science-branch\nname: Science\nlevel: root\ndescription: All science\nupdated: 2026-07-01\n---\n[Physics](../branches/physics.md)\n[Again](../branches/physics.md#anchor)\n[Ignored](physics.md)"
    );
    writeFileSync(
      join(root, "branches", "physics.md"),
      '---\ntype: science-branch\nname: Physics\nlevel: domain\ndescription: Physics\nupdated: "2026-07-02"\n---\n'
    );
    writeFileSync(
      join(root, "formulas", "law.md"),
      '---\ntype: science-formula\nname: Law\nlatex: "x=y"\nsummary: A law\nstatus: sourced\nupdated: 2026-07-03\n---\n[Field](../branches/physics.md)\n[Family](../families/equality.md#proof)\n'
    );
    writeFileSync(
      join(root, "families", "equality.md"),
      '---\ntype: equation-family\nname: Equality\ncanonical_latex: "a=b"\nsummary: Equality\nstatus: verified\nupdated: 2026-07-04\n---\n[Law](../formulas/law.md)\n'
    );
    const cards = readScienceCards(root);
    assert.deepEqual(
      cards.branches.find((branch) => branch.slug === "science").children,
      ["physics"]
    );
    assert.equal(cards.updated, "2026-07-04");
    assert.deepEqual(scienceGraph(cards).formulas[0].domains, ["physics"]);
    assert.deepEqual(cards.formulas[0].families, ["equality"]);
    assert.deepEqual(cards.families[0].members, ["law"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Repo Factory renders provider nodes without inventing observed sessions", () => {
  const snapshot = JSON.parse(read("src/generated/repo-factory.json"));
  const html = renderFactory(snapshot);
  assert.equal(
    count(html, /class="factory-agent-node"/g),
    agentProviders.length
  );
  for (const provider of agentProviders) {
    assert.ok(html.includes(`data-agent-provider="${provider.id}"`));
    assert.ok(html.includes(provider.documentation));
  }
  assert.ok(html.includes("NO SESSION TELEMETRY"));
  assert.ok(
    html.includes("No agent sessions, assignments, or activity are inferred.")
  );
  assert.doesNotMatch(html, /data-agent-session=/);
});
test("Repo Factory preserves all controls, initial inspector IDs and complete snapshot", () => {
  const snapshot = JSON.parse(read("src/generated/repo-factory.json"));
  const html = renderFactory(snapshot);
  const sourceIds = [
    ...read("src/pages/games/repo-factory.astro").matchAll(/\bid="([^"]+)"/g),
  ].map((match) => match[1]);
  if (snapshot.repositories.length)
    for (const id of sourceIds) assert.ok(html.includes(`id="${id}"`), id);
  assert.equal(
    count(html, /class="factory-node"/g),
    snapshot.repositories.length
  );
  assert.deepEqual(
    JSON.parse(
      html.match(
        /<script id="repo-factory-data" type="application\/json">([\s\S]*?)<\/script>/
      )[1]
    ),
    snapshot
  );
  assert.ok(!html.includes("data-astro"));
});

test("Repo Factory safely renders fallback data and escapes repository content", () => {
  const snapshot = JSON.parse(read("src/generated/repo-factory.json"));
  const empty = renderFactory({
    ...snapshot,
    repositories: [],
    connections: [],
  });
  assert.ok(empty.includes("The factory is waiting for its first sync."));
  assert.equal(count(empty, /class="factory-node"/g), 0);
  if (snapshot.repositories[0]) {
    snapshot.repositories[0].description =
      '<img src=x onerror="alert(1)"></script>';
    const html = renderFactory(snapshot);
    assert.ok(
      html.includes(
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&lt;/script&gt;"
      )
    );
    assert.ok(!html.includes("<img src=x"));
    assert.equal(count(html, /<\/script>/g), 1);
  }
});

test("Atlas renders every formula, family, source, KaTeX block and graph dataset", () => {
  const cards = readScienceCards();
  const html = renderAtlas(
    cards,
    read("src/components/EquationUniverse.astro")
  );
  assert.equal(count(html, /class="formula-card"/g), cards.formulas.length);
  assert.equal(count(html, /class="family-card"/g), cards.families.length);
  assert.equal(
    count(html, /class="katex-display"/g),
    cards.formulas.length + cards.families.length
  );
  for (const card of [...cards.formulas, ...cards.families])
    assert.ok(html.includes(`id="${card.slug}"`));
  assert.ok(html.includes('data-mode="discipline"'));
  assert.ok(html.includes('data-mode="structure"'));
  assert.equal(
    count(html, /data-focus-family=/g),
    Math.min(4, cards.families.length)
  );
  assert.ok(!html.includes("set:html"));
  assert.ok(!html.includes("data-astro"));
});

for (const id of ["nathan-holmes", "theranos-nathan"]) {
  test(`${id} preserves every slide, speaker note, credit and Reveal option`, () => {
    const file = `src/pages/powerpoint-club/${id}.astro`;
    const source = read(file);
    const deck = readDeck(source, file);
    assert.equal(count(deck.body, /<section\b/g), count(source, /<section\b/g));
    assert.equal(
      count(deck.body, /class="notes"/g),
      count(source, /class="notes"/g)
    );
    assert.equal(
      count(deck.body, /<figcaption>/g),
      count(source, /<figcaption>/g)
    );
    assert.ok(deck.body.includes('class="deck-help"'));
    assert.ok(deck.body.includes("CC BY"));
    assert.ok(deck.script.includes("plugins: [Notes]"));
    assert.ok(deck.script.includes("hash: true"));
    assert.ok(deck.script.includes("deck.initialize()"));
    assert.ok(deck.stylesheets.includes("reveal.js@5.2.1/dist/reveal.css"));
    assert.ok(!/[{}]/.test(deck.body));
    assert.ok(!deck.body.includes("is:inline"));
    assert.throws(
      () =>
        readDeck(
          source.replace('const title = "', 'const title = getTitle() + "'),
          file
        ),
      /Unsupported presentation literal/
    );
  });
}

test("achei-sera projects all ten slides and notes into native Zola", () => {
  const file = "src/pages/powerpoint-club/achei-sera.astro";
  const deck = readDeck(read(file), file);
  assert.equal(count(deck.body, /<section\b/g), 10);
  assert.equal(count(deck.body, /class="notes"/g), 10);
  assert.ok(deck.body.includes("America/Porto_Velho"));
  assert.ok(deck.body.includes("Ainda não temos uma explicação confirmada."));
  assert.ok(deck.script.includes("plugins: [Notes]"));
  assert.ok(deck.script.includes("hash: true"));
  assert.ok(!/[{}]/.test(deck.body));
});
