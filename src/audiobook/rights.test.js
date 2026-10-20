import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PublicationNotAuthorizedError,
  assertPublicationAuthorized,
} from "./rights.js";

function workDir(rights) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-rights-"));
  const dir = path.join(root, "example");
  fs.mkdirSync(dir);
  if (rights !== null) fs.writeFileSync(path.join(dir, "rights.md"), rights);
  return dir;
}

const record = ({ authorized = true, chapters = ["example-001"] } = {}) =>
  `---\ntype: Audiobook Rights Record\nwork_id: example\npublic_distribution_authorized: ${authorized}\nauthorized_chapters:\n${chapters.map((id) => `  - ${id}`).join("\n")}\n---\n`;

test("authorizes a chapter listed in the rights record", () => {
  assert.doesNotThrow(() =>
    assertPublicationAuthorized(workDir(record()), "example-001")
  );
});

test("refuses a chapter the rights record does not list", () => {
  assert.throws(
    () => assertPublicationAuthorized(workDir(record()), "example-002"),
    PublicationNotAuthorizedError
  );
});

test("refuses when public distribution is not authorized", () => {
  assert.throws(
    () =>
      assertPublicationAuthorized(
        workDir(record({ authorized: false })),
        "example-001"
      ),
    PublicationNotAuthorizedError
  );
});

test("refuses when the rights record is missing", () => {
  assert.throws(
    () => assertPublicationAuthorized(workDir(null), "example-001"),
    PublicationNotAuthorizedError
  );
});

test("refuses a rights record that belongs to another work", () => {
  const other = record().replace("work_id: example", "work_id: other");
  assert.throws(
    () => assertPublicationAuthorized(workDir(other), "example-001"),
    PublicationNotAuthorizedError
  );
});

test("the real HPMOR rights record authorizes chapter 1 only", () => {
  const dir = path.join(process.cwd(), "data", "audiobooks", "hpmor");
  assert.doesNotThrow(() => assertPublicationAuthorized(dir, "hpmor-001"));
  assert.throws(
    () => assertPublicationAuthorized(dir, "hpmor-002"),
    PublicationNotAuthorizedError
  );
});
