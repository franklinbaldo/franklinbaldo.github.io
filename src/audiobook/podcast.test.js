import assert from "node:assert/strict";
import test from "node:test";

import { XMLParser } from "fast-xml-parser";

import { buildPodcastXml, episodeGuid } from "./podcast.js";

const work = {
  workId: "example-book",
  metadata: {
    title: "Livro de Exemplo",
    author: "Autora Exemplo",
    target_language: "pt-BR",
    podcast: {
      enabled: true,
      title: "Livro de Exemplo — Audiolivro",
      description: "Edição narrada de teste.",
      image: "/audiobooks/example-book/cover.jpg",
    },
  },
};

const episodes = [
  {
    chapterId: "example-book-001",
    title: "Capítulo 1",
    description: "Primeiro capítulo.",
    publishedAt: "2026-08-30T12:00:00-04:00",
    durationSeconds: 3723,
    enclosure: {
      url: "https://archive.example/download/example-book/chapter-001.mp3",
      bytes: 12345678,
      type: "audio/mpeg",
    },
    transcript: {
      url: "/audiobooks/example-book/transcripts/001.vtt",
      type: "text/vtt",
      language: "pt-BR",
    },
    chapters: {
      url: "/audiobooks/example-book/chapters/001.json",
    },
  },
];

test("uses work/chapter identity for stable podcast GUID", () => {
  assert.equal(episodeGuid("example-book", "example-book-001"), "audiobook:example-book:example-book-001");
});

test("builds RSS 2.0 with enclosure and Podcasting 2.0 metadata", () => {
  const xml = buildPodcastXml({ work, episodes, siteUrl: "https://franklinbaldo.com/" });
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);
  const channel = parsed.rss.channel;
  const item = channel.item;

  assert.equal(parsed.rss["@_version"], "2.0");
  assert.equal(channel.title, "Livro de Exemplo — Audiolivro");
  assert.equal(item.guid["#text"], "audiobook:example-book:example-book-001");
  assert.equal(item.guid["@_isPermaLink"], "false");
  assert.equal(item.enclosure["@_length"], "12345678");
  assert.equal(item.enclosure["@_type"], "audio/mpeg");
  assert.equal(item["itunes:duration"], "1:02:03");
  assert.equal(item["podcast:transcript"]["@_type"], "text/vtt");
  assert.equal(item["podcast:chapters"]["@_type"], "application/json+chapters");
});

test("refuses published episode without a complete enclosure", () => {
  assert.throws(
    () =>
      buildPodcastXml({
        work,
        episodes: [{ ...episodes[0], enclosure: { url: "https://example.test/a.mp3", bytes: 0, type: "audio/mpeg" } }],
        siteUrl: "https://franklinbaldo.com/",
      }),
    /positive enclosure.bytes/,
  );
});

test("refuses feed generation before podcast is enabled", () => {
  assert.throws(
    () =>
      buildPodcastXml({
        work: { ...work, metadata: { ...work.metadata, podcast: { enabled: false } } },
        episodes,
        siteUrl: "https://franklinbaldo.com/",
      }),
    /podcast is not enabled/,
  );
});
