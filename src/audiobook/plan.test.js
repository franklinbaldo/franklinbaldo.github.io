import assert from "node:assert/strict";
import test from "node:test";

import { parseNarrationText } from "./plan.js";

const NARRATION = `---
type: Audiobook Narration Chapter
work_id: example
chapter_id: example-001
lang: pt-BR
derived_from: ../translation/001.md
---

<!-- tts: {"id":"example-001-s0001","speaker":"narrator","pace":"slow"} -->
Primeiro trecho.

<!-- tts: {"id":"example-001-s0002","speaker":"alice","emotion":"curious"} -->
Segundo trecho.
`;

test("creates deterministic TTS plan from narration directives and logical voices", () => {
  const voices = {
    narrator: { role: "narrator", description: "calm" },
    alice: { role: "character", description: "curious" },
  };
  const first = parseNarrationText(NARRATION, {
    voices,
    sourcePath: "001.md",
  });
  const second = parseNarrationText(NARRATION, {
    voices,
    sourcePath: "001.md",
  });

  assert.equal(first.schema, "audiobook-tts-plan-v1");
  assert.equal(first.work_id, "example");
  assert.equal(first.chapter_id, "example-001");
  assert.equal(first.segments.length, 2);
  assert.equal(first.segments[0].speaker, "narrator");
  assert.deepEqual(first.segments[0].voice, voices.narrator);
  assert.deepEqual(first.segments[0].direction, { pace: "slow" });
  assert.equal(first.segments[0].input_digest, second.segments[0].input_digest);
});

test("voice changes invalidate the segment request digest", () => {
  const first = parseNarrationText(NARRATION, {
    voices: {
      narrator: { description: "calm" },
      alice: { description: "curious" },
    },
  });
  const second = parseNarrationText(NARRATION, {
    voices: {
      narrator: { description: "warm and slower" },
      alice: { description: "curious" },
    },
  });

  assert.notEqual(
    first.segments[0].input_digest,
    second.segments[0].input_digest
  );
  assert.equal(first.segments[1].input_digest, second.segments[1].input_digest);
});

test("rejects unknown logical speaker", () => {
  assert.throws(
    () => parseNarrationText(NARRATION, { voices: { narrator: {} } }),
    (error) =>
      error.details?.some((detail) => detail.includes("unknown speaker: alice"))
  );
});

test("rejects duplicate segment ids", () => {
  const duplicate = NARRATION.replace("example-001-s0002", "example-001-s0001");
  assert.throws(
    () =>
      parseNarrationText(duplicate, { voices: { narrator: {}, alice: {} } }),
    (error) =>
      error.details?.some((detail) => detail.includes("duplicate segment id"))
  );
});
