import { test } from "node:test";
import assert from "node:assert/strict";
import { _pickNextPair } from "../pairing.js";
import type { CatalogSong } from "../pairing.js";

function song(id: string): CatalogSong {
  return {
    id,
    title: id,
    lyricsPrompt: "",
    styleTags: "",
    audioUrl: `https://example.com/${id}.mp3`,
    isPublic: true,
  };
}

test("_pickNextPair: returns null with fewer than 2 songs", () => {
  assert.equal(_pickNextPair([song("a")], new Map(), new Map()), null);
});

test("_pickNextPair: favors the pair with the least combined appearances (coverage)", () => {
  const songs = [song("a"), song("b"), song("c")];
  // a/b have already dueled a lot; c has never appeared. Coverage should
  // strongly favor pairing c with someone over an a-vs-b rematch.
  const appByKey = new Map([
    ["a", 20],
    ["b", 20],
    ["c", 0],
  ]);
  const pair = _pickNextPair(songs, new Map(), appByKey);
  assert.ok(pair);
  assert.ok([pair!.a.id, pair!.b.id].includes("c"));
});

test("_pickNextPair: with no prior data, still returns a valid distinct pair", () => {
  const songs = [song("a"), song("b")];
  const pair = _pickNextPair(songs, new Map(), new Map());
  assert.ok(pair);
  assert.notEqual(pair!.a.id, pair!.b.id);
  assert.deepEqual(new Set([pair!.a.id, pair!.b.id]), new Set(["a", "b"]));
});
