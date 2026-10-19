// Static preview for the complete Zola artifact, including post-processing and
// Pagefind. Never point Zola's output at public/, which holds source assets.
import { createReadStream, existsSync, watch } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
};
const within = (root, file) => {
  const path = relative(root, file);
  return path === "" || (!path.startsWith("../") && path !== "..");
};

export function createStaticServer(directory) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(
          new URL(request.url, "http://localhost").pathname
        );
      } catch {
        response.writeHead(400).end("Invalid URL");
        return;
      }
      if (pathname.includes("\0") || pathname.includes("\\")) {
        response.writeHead(400).end("Invalid path");
        return;
      }
      let file = resolve(root, "." + pathname);
      if (!within(root, file)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      let info = await stat(file).catch(() => null);
      let status = 200;
      if (info?.isDirectory()) {
        if (!pathname.endsWith("/")) {
          const url = new URL(request.url, "http://localhost");
          response.writeHead(301, {
            Location: url.pathname + "/" + url.search,
          });
          response.end();
          return;
        }
        file = join(file, "index.html");
        info = await stat(file).catch(() => null);
      }
      if (!info?.isFile()) {
        status = 404;
        file = join(root, "404.html");
        info = await stat(file).catch(() => null);
        if (!info?.isFile()) {
          response.writeHead(404).end("Not found");
          return;
        }
      }
      if (!within(await realpath(root), await realpath(file))) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const headers = {
        "Content-Type": mime[extname(file)] ?? "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": "no-cache",
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
      };
      let start = 0,
        end = info.size - 1;
      if (request.headers.range && status === 200) {
        const match = request.headers.range.match(/^bytes=(\d*)-(\d*)$/);
        if (!match || (!match[1] && !match[2])) {
          response
            .writeHead(416, { "Content-Range": `bytes */${info.size}` })
            .end();
          return;
        }
        if (match[1]) {
          start = Number(match[1]);
          end = match[2] ? Math.min(Number(match[2]), end) : end;
        } else start = Math.max(0, info.size - Number(match[2]));
        if (
          start > end ||
          start >= info.size ||
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end)
        ) {
          response
            .writeHead(416, { "Content-Range": `bytes */${info.size}` })
            .end();
          return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
        headers["Content-Length"] = end - start + 1;
      }
      response.writeHead(status, headers);
      if (request.method === "HEAD" || info.size === 0) {
        response.end();
        return;
      }
      const stream = createReadStream(file, { start, end });
      stream.on("error", () => response.destroy());
      stream.pipe(response);
    } catch (error) {
      console.error(error.message);
      if (!response.headersSent) response.writeHead(500);
      response.end("Unable to serve the static artifact");
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const options = { directory: "dist-zola", host: "127.0.0.1", port: 4321 };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--build", "--watch"].includes(arg)) options[arg.slice(2)] = true;
    else if (["--directory", "--host", "--port"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = args[++index];
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Invalid port");
  if (options.watch && !options.build)
    throw new Error("--watch requires --build");
  if (options.build && options.directory !== "dist-zola")
    throw new Error(
      "Native builds output to dist-zola; --directory is for preview only"
    );
  let child;
  async function build() {
    return new Promise((accept, reject) => {
      child = spawn(process.execPath, ["scripts/zola/build.mjs"], {
        stdio: "inherit",
        env: process.env,
      });
      child.once("error", reject);
      child.once("exit", (code) => {
        child = undefined;
        if (code === 0) accept();
        else reject(new Error(`Zola build exited ${code}`));
      });
    });
  }
  if (options.build) await build();
  if (!existsSync(join(options.directory, "index.html")))
    throw new Error(
      `${options.directory}/index.html is missing; run npm run build first`
    );
  const server = createStaticServer(options.directory);
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(port, options.host, accept);
  });
  console.log(
    `Zola static preview: http://${options.host}:${server.address().port}/ (${options.directory})`
  );
  const watchers = [];
  let timer,
    building = false,
    queued = false;
  async function rebuild() {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    do {
      queued = false;
      try {
        await build();
        console.log("Rebuilt Zola; refresh the browser to see changes.");
      } catch (error) {
        console.error(error.message);
      }
    } while (queued);
    building = false;
  }
  if (options.watch) {
    for (const directory of [
      "src",
      "zola",
      "scripts",
      "knowledge",
      "data",
      "public",
      ".routines",
      "changelog",
    ]) {
      if (!existsSync(directory)) continue;
      watchers.push(
        watch(directory, { recursive: true }, (_event, filename) => {
          const changed = join(directory, String(filename ?? "")).replaceAll(
            "\\",
            "/"
          );
          // Pregen writes these derived artifacts on every build; they must not
          // recursively trigger the watcher. Their canonical inputs are watched.
          if (
            changed.startsWith("src/generated/") ||
            changed.startsWith("public/katex/")
          )
            return;
          clearTimeout(timer);
          timer = setTimeout(() => void rebuild(), 300);
        })
      );
    }
    console.log("Watching canonical sources. Browser refresh is manual.");
  }
  const close = () => {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
    child?.kill();
    server.close(() => process.exit(0));
    server.closeAllConnections();
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
