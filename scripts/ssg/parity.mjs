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
// Keep one canonical registry of special route ownership: avoid a hardcoded
// second list hidden in a parity script as the SSG migration progresses.
const routeRegistry = JSON.parse(
  readFileSync(join(root, "ssg/route-ownership.json"), "utf8")
);
if (routeRegistry.version !== 1 || !Array.isArray(routeRegistry.routes)) {
  throw new Error("Unknown SSG route ownership registry schema");
}
const specialRoutes = routeRegistry.routes.map((r) => r.path);
if (new Set(specialRoutes).size !== specialRoutes.length ||
    routeRegistry.routes.some((r) =>
      typeof r.path !== "string" ||
      !/^\/(?:[a-z0-9-]+\/|[a-z0-9-]+\.xml)?$/.test(r.path) ||
      typeof r.owner !== "string" || !r.owner ||
      typeof r.strategy !== "string" || !r.strategy)) {
  throw new Error("Duplicate or invalid SSG route ownership records");
}
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
  missing_route_owners: routeRegistry.routes.filter((r) => absentSpecial.includes(r.path)),
  complete_site_parity: missing.length === 0 && manifest.unsupported.length === 0 && absentSpecial.length === 0,
  public_cutover_allowed: false,
  explanation: "Completeness of posts is tested; full behavioral, media, SEO and historical URL parity remains outstanding."
};
writeFileSync(join(root,".cache/ssg-native/parity.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({ posts_projected:report.posts_projected,
  missing_projected_posts:missing.length, unsupported_posts:report.unsupported_posts,
  absent_special:absentSpecial, public_cutover_allowed:false },null,2));
if (missing.length || manifest.unsupported.length) process.exitCode = 1;
