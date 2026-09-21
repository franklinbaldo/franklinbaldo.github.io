// CI guard: no internal blog link may point at a page that doesn't exist.
//
// A link is OK if it resolves to a real post directly, or if it's a legacy
// date-prefixed URL that generate-redirects.mjs will redirect to the canonical
// slug. Anything left over (a link to a deleted/never-created post) fails the
// build so it gets fixed at the source instead of 404'ing silently.
import { loadPosts, analyzeLinks } from "./lib/blog-links.mjs";

const posts = loadPosts();
const { redirects, dangling } = analyzeLinks(posts);

const redirectCount = Object.keys(redirects).length;
if (redirectCount > 0) {
  console.log(
    `ℹ ${redirectCount} legacy date-prefixed link(s) covered by generated redirects.`
  );
}

if (dangling.length > 0) {
  console.error(
    `\n✗ ${dangling.length} broken internal blog link(s) with no valid target:\n`
  );
  for (const { file, link } of dangling) {
    console.error(`  ${file}\n    → ${link}`);
  }
  console.error(
    "\nFix: point the link at an existing post, or remove it if the target was deleted."
  );
  process.exit(1);
}

console.log(
  `✔ check-links: ${posts.length} posts scanned, no broken internal links.`
);
