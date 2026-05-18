// Copy katex.min.css + fonts to public/katex/ so PageLayout can
// conditionally <link> the stylesheet only on posts with math.
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const src = resolve(root, "node_modules/katex/dist");
const dest = resolve(root, "public/katex");

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(`${src}/katex.min.css`, `${dest}/katex.min.css`);
await cp(`${src}/fonts`, `${dest}/fonts`, { recursive: true });

console.log(`[copy-katex] copied katex.min.css + fonts to ${dest}`);
