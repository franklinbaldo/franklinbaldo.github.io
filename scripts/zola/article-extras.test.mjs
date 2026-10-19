import assert from "node:assert/strict";
import test from "node:test";
import {
  articleNeighbors,
  articleSeries,
  relatedArticles,
  createArticleExtras,
  renderArticleToc,
  articleSchema,
} from "./article-extras.mjs";
import { preserveHeadingAnchors } from "./anchors.mjs";

const post = (id, data = {}) => ({
  id,
  path: `${data.lang === "pt" ? "/pt" : ""}/blog/${id}/`,
  data: {
    title: id,
    description: `About ${id}`,
    date: "2026-01-01T00:00:00.000Z",
    ...data,
  },
});

test("related posts and adjacency stay within language and music domain", () => {
  const current = post("current", { tags: ["code"] });
  const previous = post("previous", {
    date: "2025-01-01T00:00:00.000Z",
    tags: ["code"],
  });
  const next = post("next", {
    date: "2026-02-01T00:00:00.000Z",
    tags: ["code"],
  });
  const others = [
    post("portuguese", { lang: "pt", tags: ["code"] }),
    post("song", { postType: "music", tags: ["code"] }),
  ];
  const all = [current, previous, next, ...others];
  assert.deepEqual(articleNeighbors(current, all), { prev: previous, next });
  assert.deepEqual(
    relatedArticles(current, all).posts.map((p) => p.post.id),
    ["next", "previous"]
  );
});

test("series honors explicit order and same-language publication set", () => {
  const current = post("two", { series: "harness", seriesOrder: 2 });
  const first = post("one", { series: "harness", seriesOrder: 1 });
  const last = post("last", { series: "harness" });
  const series = articleSeries(current, [
    last,
    current,
    first,
    post("translation", { series: "harness", lang: "pt" }),
  ]);
  assert.deepEqual(
    series.posts.map((p) => p.id),
    ["one", "two", "last"]
  );
  assert.equal(series.prev.id, "one");
  assert.equal(series.next.id, "last");
  assert.equal(series.index, 1);
});

test("inline reviews preserve work evidence, filter version trials and publication gates", async () => {
  const current = post("current", { translationKey: "work-a" });
  const opponent = post("opponent", { translationKey: "work-b" });
  const hidden = post("hidden", { draft: true, tags: ["code"] });
  const future = post("future", { publishDate: "2099-01-01" });
  const duel = {
    id: "battle-1",
    postAKey: "work-a",
    postBKey: "work-b",
    winnerKey: "work-a",
    runAt: "2026-01-02T00:00:00Z",
    rateA: 4.5,
    rateB: 3,
    perspectiveId: "careful-reader",
    agentId: "judge",
    reviewLang: "en",
    parsedContent: {
      postAAnalysis: "Evidence **for A**, unchanged.",
      postBAnalysis: "Opponent analysis",
      verdict: "Specific verdict.",
    },
    evaluatorMood: "Before",
    evaluatorMoodAfter: "After",
  };
  const render = await createArticleExtras(
    [current, opponent, post("other"), hidden, future],
    {
      duels: [
        duel,
        {
          ...duel,
          id: "private-version",
          isVersionDuel: true,
          parsedContent: { postAAnalysis: "VERSION ONLY" },
        },
      ],
      ranks: new Map([["work-a", { rank: 1, total: 2 }]]),
      now: new Date("2026-10-18"),
    }
  );
  const result = render(current);
  assert.ok(
    result.article_extras.includes(
      "Evidence <strong>for A</strong>, unchanged."
    )
  );
  assert.ok(result.article_extras.includes("Specific verdict."));
  assert.ok(result.article_extras.includes("/ranking/battles/battle-1/"));
  assert.ok(!result.article_extras.includes("VERSION ONLY"));
  assert.ok(!result.article_extras.includes("/blog/hidden/"));
  assert.ok(!result.article_extras.includes("/blog/future/"));
  assert.ok(result.article_intro.includes("Hrönir #1/2"));
  assert.ok(result.article_end.includes("data-article-share"));
});

test("ToC is generated from final compatible headings and is static HTML", () => {
  const body =
    '<h2 id="e-plagio"><a class="zola-anchor" href="#e-plagio">E plágio?</a></h2><h3 id="detail">Detail</h3><h2 id="conclusao"><a class="zola-anchor" href="#conclusao">Conclusão</a></h2>';
  const toc = renderArticleToc(preserveHeadingAnchors(body).html, "pt");
  assert.ok(toc.includes('href="#e-plágio"'));
  assert.ok(toc.includes('href="#conclusão"'));
  assert.ok(toc.includes('aria-label="Conteúdo"'));
  assert.ok(toc.includes('<ol><li><a href="#detail">'));
  assert.equal(renderArticleToc('<h2 id="only">Only</h2>'), "");
});

test("BlogPosting schema uses canonical metadata and cannot close its script", () => {
  const p = post("safe", {
    lang: "pt",
    title: "Title </script>",
    tags: ["música"],
  });
  const encoded = articleSchema(p, "<p>one two three</p>");
  assert.ok(!encoded.includes("</script>"));
  const graph = JSON.parse(encoded)["@graph"];
  const article = graph.find((entry) => entry["@type"] === "BlogPosting");
  assert.equal(article.inLanguage, "pt-BR");
  assert.equal(article.url, "https://franklinbaldo.github.io/pt/blog/safe/");
  assert.equal(article.wordCount, 3);
  assert.equal(article.headline, "Title </script>");
  assert.ok(graph.some((entry) => entry["@type"] === "Person"));
  assert.ok(graph.some((entry) => entry["@type"] === "BreadcrumbList"));
});
