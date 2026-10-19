// Static assets are source inputs, not output directories. Preserve SSG's
// generated pages/feeds when a public asset has the same output pathname.
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
const ROOT = resolve(".");
const SITE = join(ROOT, "dist-ssg");
if (!existsSync(join(SITE, "index.html")))
  throw new Error("Missing native SSG output; run the SSG build first");
const collisions = [];
let copied = 0;
function copyMissing(source, prefix = "") {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const subpath = join(prefix, entry.name);
    if (entry.isDirectory()) copyMissing(from, subpath);
    else if (entry.isFile()) {
      const to = join(SITE, subpath);
      if (existsSync(to)) collisions.push(subpath);
      else {
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(from, to);
        copied++;
      }
    }
  }
}
copyMissing(join(ROOT, "public"));
copyMissing(join(ROOT, ".cache/ssg-native/assets"));
const css = join(SITE, "ssg-preview.css");
if (!existsSync(css)) copyFileSync(join(ROOT, "ssg/ssg-preview.css"), css);
writeFileSync(join(SITE, ".nojekyll"), "");
const report = { copied, collisions, native_assets_were_not_overwritten: true };
writeFileSync(join(ROOT, ".cache/ssg-native/asset-report.json"), JSON.stringify(report,null,2)+"\n");
console.log("SSG finish: " + copied + " assets, " + collisions.length + " native collisions kept");
