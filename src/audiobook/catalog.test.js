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

function chapter(root, number, publication = null) {
  const id = `example-${String(number).padStart(3, "0")}`;
  write(root, `data/audiobooks/example/original/${String(number).padStart(3, "0")}.md`, `---\ntype: Audiobook Source Chapter\nwork_id: example\nchapter_id: ${id}\nsource_status: partial\n---\n`);
  write(root, `data/audiobooks/example/translation/${String(number).padStart(3, "0")}.md`, `---\ntype: Audiobook Translation Chapter\nwork_id: example\nchapter_id: ${id}\ntranslation_status: partial\n---\n`);
  const publicationYaml = publication
    ? `publication:\n  status: ${publication.status}\n  title: ${publication.title}\n  published_at: ${publication.publishedAt ?? ""}\n  duration_seconds: ${publication.duration ?? 0}\n  enclosure:\n    url: ${publication.url ?? "https://archive.example/pending.mp3"}\n    bytes: ${publication.bytes ?? 0}\n    type: audio/mpeg\n`
    : "";
  write(root, `data/audiobooks/example/narration/${String(number).padStart(3, "0")}.md`, `---\ntype: Audiobook Narration Chapter\nwork_id: example\nchapter_id: ${id}\nnarration_status: partial\n${publicationYaml}---\n`);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-catalog-"));
  write(root, "data/audiobooks/example/work.md", `---\ntype: Audiobook Work\nwork_id: example\ntitle: Example Book\nauthor: Example Author\nsource_language: en\ntarget_language: pt-BR\nsource_url: https://example.test/\npodcast:\n  enabled: true\n---\n`);
  write(root, "data/audiobooks/example/rights.md", `---\ntype: Audiobook Rights Record\nwork_id: example\neditorial_work_allowed: true\npublic_distribution_authorized: true\n---\n`);
  write(root, "data/audiobooks/example/editorial.md", "# Editorial\n");
  write(root, "data/audiobooks/example/voices.yaml", "schema: audiobook-voices-v1\nwork_id: example\nvoices:\n  narrator: {}\n");
  write(root, "data/audiobooks/example/pronunciation.yaml", "schema: audiobook-pronunciation-v1\nwork_id: example\nentries: []\n");

  chapter(root, 1, { status: "published", title: "Capítulo 1", publishedAt: "2026-08-30T12:00:00-04:00", duration: 120, url: "https://archive.example/chapter-001.mp3", bytes: 1234 });
  chapter(root, 2, { status: "published", title: "Capítulo 2", publishedAt: "2026-08-30T13:00:00-04:00", duration: 130, url: "https://archive.example/chapter-002.mp3", bytes: 2345 });
  chapter(root, 3, { status: "ready", title: "Capítulo 3" });
  return root;
}

test("discovers works by work_id directory", () => {
  const root = fixture();
  assert.deepEqual(listWorkIds(root), ["example"]);
  assert.equal(listWorks(root)[0].metadata.title, "Example Book");
});

test("derives chapters without state.yaml", () => {
  const root = fixture();
  const work = loadWork(root, "example");
  assert.equal(work.workId, "example");
  assert.equal(work.chapters.length, 3);
  assert.equal(fs.existsSync(path.join(root, "data/audiobooks/example/state.yaml")), false);
});

test("exposes only published chapters, newest first", () => {
  const root = fixture();
  const episodes = publishedEpisodes(loadWork(root, "example"));
  assert.deepEqual(episodes.map((episode) => episode.chapterId), ["example-002", "example-001"]);
  assert.equal(episodes[0].enclosure.bytes, 2345);
});

test("rejects unsafe work ids", () => {
  const root = fixture();
  assert.throws(() => loadWork(root, "../example"), /Invalid work_id/);
});
