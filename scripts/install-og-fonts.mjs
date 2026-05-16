// Register Fraunces TTFs (shipped in public/fonts/) with fontconfig so
// librsvg can resolve `font-family: Fraunces` when sharp rasterizes the
// OG card SVG. Runs as part of `prebuild`.

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = join(root, "public/fonts");
const dest = join(homedir(), ".fonts");

if (!existsSync(src)) {
  console.warn(`[install-og-fonts] no fonts dir at ${src}; skipping`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
const ttfs = readdirSync(src).filter((f) => f.endsWith(".ttf"));
for (const f of ttfs) {
  copyFileSync(join(src, f), join(dest, f));
}

try {
  execSync("fc-cache -f", { stdio: "ignore" });
} catch {
  // fc-cache may not be present (rare); the local user font dir is
  // still picked up by fontconfig's default config in most distros.
}

console.log(`[install-og-fonts] registered ${ttfs.length} font(s) for fontconfig`);
