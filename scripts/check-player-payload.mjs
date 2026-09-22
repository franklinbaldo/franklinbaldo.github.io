import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

const catalogText = await readFile("dist/music-player.json", "utf8");
const catalog = JSON.parse(catalogText);
if (!Array.isArray(catalog)) {
  throw new Error("dist/music-player.json must contain an array");
}

const catalogBytes = Buffer.byteLength(catalogText);
const htmlFiles = await walk("dist");
let playerPages = 0;
let maxBootstrapBytes = 0;
const violations = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  if (!html.includes('id="gmp"')) continue;
  playerPages += 1;

  if (!html.includes('data-songs-url="/music-player.json"')) {
    violations.push(`${file}: missing lazy catalog URL`);
  }

  const match = html.match(/data-songs="([^"]*)"/);
  if (!match) {
    violations.push(`${file}: missing bootstrap data-songs payload`);
    continue;
  }
  const bootstrapBytes = Buffer.byteLength(match[1]);
  maxBootstrapBytes = Math.max(maxBootstrapBytes, bootstrapBytes);
  if (bootstrapBytes > 2048) {
    violations.push(`${file}: bootstrap payload is ${bootstrapBytes} bytes (> 2048)`);
  }
}

if (playerPages === 0) violations.push("no built pages contain the global music player");

if (violations.length > 0) {
  console.error("Global music player payload regression:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const perPageSaved = Math.max(0, catalogBytes - maxBootstrapBytes);
const duplicatedBytesAvoided = perPageSaved * playerPages;
console.log(
  `music-player payload: ${catalog.length} songs; static asset ${catalogBytes} B; ` +
    `${playerPages} player pages; max bootstrap ${maxBootstrapBytes} B; ` +
    `>=${perPageSaved} B removed per player page (~${duplicatedBytesAvoided} B across this build).`,
);
