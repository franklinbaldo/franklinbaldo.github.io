import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { listWorkIds, listWorks, loadWork, publishedEpisodes } from "./catalog.js";

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-catalog-"));
  write(
    root,
    "data/audiobooks/example/work.md",
    `---\ntype: Audiobook Work\nwork_id: example\ntitle: Example Book\nauthor: Example Author\nsource_language: en\ntarget_language: pt-BR\nsource_url: https://example.test/\npodcast:\n  enabled: true\n---\n`,
  );
  write(
    root,
    "data/audiobooks/example/state.yaml",
    `schema: audiobook-work-state-v1\nwork_id: example\nstatus: publishing\nnext_action: publish third chapter\nchapters:\n  example-001:\n    status: published\n    publication:\n      status: published\n      title: Capítulo 1\n      published_at: 2026-08-30T12:00:00-04:00\n      duration_seconds: 120\n      enclosure:\n        url: https://archive.example/chapter-001.mp3\n        bytes: 1234\n        type: audio/mpeg\n  example-002:\n    status: published\n    publication:\n      status: published\n      title: Capítulo 2\n      published_at: 2026-08-30T13:00:00-04:00\n      duration_seconds: 130\n      enclosure:\n        url: https://archive.example/chapter-002.mp3\n        bytes: 2345\n        type: audio/mpeg\n  example-003:\n    status: ready\n    publication:\n      status: ready\n      title: Capítulo 3\n`,
  );
  return root;
}

test("discovers works by work_id directory", () => {
  const root = fixture();
  assert.deepEqual(listWorkIds(root), ["example"]);
  assert.equal(listWorks(root)[0].metadata.title, "Example Book");
});

test("loads work metadata and chapter state", () => {
  const root = fixture();
  const work = loadWork(root, "example");
  assert.equal(work.workId, "example");
  assert.equal(work.chapters.length, 3);
});

test("exposes only published chapters, newest first", () => {
  const root = fixture();
  const episodes = publishedEpisodes(loadWork(root, "example"));
  assert.deepEqual(episodes.map((episode) => episode.chapterId), [
    "example-002",
    "example-001",
  ]);
  assert.equal(episodes[0].enclosure.bytes, 2345);
});

test("rejects unsafe work ids", () => {
  const root = fixture();
  assert.throws(() => loadWork(root, "../example"), /Invalid work_id/);
});
