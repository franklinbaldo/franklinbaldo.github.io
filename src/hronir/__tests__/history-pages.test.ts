import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { materializeBlob } from "../../lib/history-pages.js";

// RFC 0015 Fase A: the version routes and the raw.txt endpoint resolve an
// archived version's body from its git blob at build time. materializeBlob
// is the single choke point — it must read back exactly what was persisted
// (hash-object -w, the same write path blobShaForPath uses) and must never
// throw for an unreachable sha (a missing blob skips its entry; it can't be
// allowed to break the build).

describe("materializeBlob", () => {
  it("reads back a blob persisted with git hash-object -w --stdin", () => {
    const content = `---\ntitle: "synthetic"\n---\nsynthetic archived body ${Date.now()}-${Math.random()}\n`;
    const sha = execFileSync("git", ["hash-object", "-w", "--stdin"], {
      input: content,
    })
      .toString()
      .trim();
    assert.match(sha, /^[0-9a-f]{40}$/, "hash-object should return a sha1");
    assert.equal(materializeBlob(sha), content);
  });

  it("returns null for a nonexistent sha instead of throwing", () => {
    // Valid sha1 shape, but no object in the store has this id.
    const missing = "0123456789abcdef0123456789abcdef01234567";
    assert.equal(materializeBlob(missing), null);
    // Cached negative result stays null on a second call.
    assert.equal(materializeBlob(missing), null);
  });
});
