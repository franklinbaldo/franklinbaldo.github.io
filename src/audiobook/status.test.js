import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { deriveWorkState } from "./status.js";

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-status-"));
  write(root, "data/audiobooks/example/work.md", `---\ntype: Audiobook Work\nwork_id: example\ntitle: Example\nstatus: preparing\n---\n`);
  write(root, "data/audiobooks/example/rights.md", `---\ntype: Audiobook Rights Record\nwork_id: example\neditorial_work_allowed: true\npublic_distribution_authorized: false\n---\n`);
  write(root, "data/audiobooks/example/editorial.md", "# Editorial\n");
  write(root, "data/audiobooks/example/voices.yaml", "schema: audiobook-voices-v1\nwork_id: example\nvoices: {}\n");
  write(root, "data/audiobooks/example/pronunciation.yaml", "schema: audiobook-pronunciation-v1\nwork_id: example\nentries: []\n");

  for (const layer of ["original", "translation"]) {
    write(root, `data/audiobooks/example/${layer}/001.md`, `---\ntype: Audiobook ${layer === "original" ? "Source" : "Translation"} Chapter\nwork_id: example\nchapter_id: example-001\n${layer === "original" ? "source_status" : "translation_status"}: partial\n---\n<!-- segment: example-001-s0001 -->\none\n<!-- segment: example-001-s0002 -->\ntwo\n`);
  }
  write(root, "data/audiobooks/example/narration/001.md", `---\ntype: Audiobook Narration Chapter\nwork_id: example\nchapter_id: example-001\nnarration_status: partial\n---\n<!-- tts: {"id":"example-001-s0001","speaker":"narrator"} -->\none\n`);
  return root;
}

test("completed segments are the intersection of canonical layers", () => {
  const state = deriveWorkState(fixture(), "example");
  assert.deepEqual(state.chapters[0].completedSegments, ["example-001-s0001"]);
  assert.equal(state.chapters[0].nextSegmentId, "example-001-s0002");
});

test("rights frontmatter is the publication authority", () => {
  const state = deriveWorkState(fixture(), "example");
  assert.equal(state.publication.public_distribution_authorized, false);
});
