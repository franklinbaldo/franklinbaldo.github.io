import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createStaticServer } from "./serve.mjs";

test("native static preview serves HTML, Pagefind, redirects, 404s and audio ranges", async () => {
  const root = await mkdtemp(join(tmpdir(), "zola-preview-"));
  const server = createStaticServer(root);
  try {
    await mkdir(join(root, "pt"));
    await writeFile(join(root, "index.html"), "<!doctype html><h1>Home</h1>");
    await writeFile(
      join(root, "pt", "index.html"),
      "<!doctype html><h1>Olá</h1>"
    );
    await writeFile(join(root, "404.html"), "<!doctype html><h1>Missing</h1>");
    await writeFile(join(root, "bundle.js"), "export const search = true;");
    await writeFile(join(root, "engine.wasm"), "wasm");
    await writeFile(join(root, "chapter.mp3"), "0123456789");
    await symlink(process.cwd(), join(root, "outside"));
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    let response = await fetch(base + "/");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.match(await response.text(), /Home/);
    response = await fetch(base + "/pt?x=1", { redirect: "manual" });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "/pt/?x=1");
    response = await fetch(base + "/pt/");
    assert.match(await response.text(), /Olá/);
    response = await fetch(base + "/missing/");
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Missing/);
    response = await fetch(base + "/bundle.js");
    assert.match(response.headers.get("content-type"), /^text\/javascript/);
    response = await fetch(base + "/engine.wasm");
    assert.equal(response.headers.get("content-type"), "application/wasm");
    response = await fetch(base + "/chapter.mp3", {
      headers: { Range: "bytes=2-5" },
    });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
    assert.equal(await response.text(), "2345");
    response = await fetch(base + "/chapter.mp3", {
      headers: { Range: "bytes=-3" },
    });
    assert.equal(await response.text(), "789");
    response = await fetch(base + "/chapter.mp3", {
      headers: { Range: "bytes=99-" },
    });
    assert.equal(response.status, 416);
    response = await fetch(base + "/chapter.mp3", { method: "HEAD" });
    assert.equal(response.headers.get("content-length"), "10");
    assert.equal(await response.text(), "");
    response = await fetch(base + "/outside/package.json");
    assert.equal(response.status, 403);
    response = await fetch(base + "/", { method: "POST" });
    assert.equal(response.status, 405);
  } finally {
    server.closeAllConnections();
    await new Promise((accept) => server.close(accept));
    await rm(root, { recursive: true, force: true });
  }
});
