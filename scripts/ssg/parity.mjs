// The candidate is NOT production-ready merely because it can compile.
// Assert every supported canonical post exists, and publish the remaining gap.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(".");
const input = join(root, ".cache/ssg-native/manifest.json");
const site = join(root, "dist-ssg");
if (!existsSync(input)) throw new Error("Missing native projection manifest");
const manifest = JSON.parse(readFileSync(input, "utf8"));
const missing = manifest.entries.filter((e) =>
  !existsSync(join(site, e.route.slice(1), "index.html")));
const specialRoutes = [
  "/", "/pt/", "/archive/", "/projects/", "/music/", "/books/",
  "/ranking/", "/papers/", "/rss.xml", "/atom.xml", "/sitemap.xml"
];
const absentSpecial = specialRoutes.filter((route) => {
  const f = route.endsWith(".xml") ? route.slice(1) : join(route.slice(1), "index.html");
  return !existsSync(join(site, f));
});
const report = {
  generator: "ssg-0.0.68",
  posts_projected: manifest.entries.length,
  excluded_unpublished: manifest.excluded.length,
  unsupported_posts: manifest.unsupported.length,
  missing_projected_posts: missing,
  special_routes_not_yet_replaced: absentSpecial,
  complete_site_parity: missing.length === 0 && manifest.unsupported.length === 0 && absentSpecial.length === 0,
  public_cutover_allowed: false,
  explanation: "Completeness of posts is tested; full behavioral, media, SEO and historical URL parity remains outstanding."
};
writeFileSync(join(root,".cache/ssg-native/parity.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({ posts_projected:report.posts_projected,
  missing_projected_posts:missing.length, unsupported_posts:report.unsupported_posts,
  absent_special:absentSpecial, public_cutover_allowed:false },null,2));
if (missing.length) process.exitCode = 1;
