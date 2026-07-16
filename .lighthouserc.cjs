// Budgets are calibrated against this site's own measured state, not generic
// aspirational targets. Measured 2026-07-09 on a production build (`npm run
// build`) of main (ba52d4e), Lighthouse run locally (numberOfRuns: 1) against
// 5 pages — /, /404, /about, /archive, and one /blog/<slug> post — two runs
// to check for noise:
//
//   page             performance  accessibility  best-practices  seo
//   /404.html            0.99          1.00           1.00      1.00
//   /index.html          0.99–1.00     1.00           1.00      1.00
//   /about               1.00          1.00           1.00      1.00
//   /archive             0.99–1.00     0.96           1.00      1.00
//   /blog/<post>          0.93          0.97           1.00      1.00
//
// Thresholds below = worst observed score per category, minus ~5 points of
// slack (headroom for normal run-to-run Lighthouse noise, which measured
// <=1pt across two runs here). Previously this only asserted performance at
// "warn" with minScore 0.7 — 23+ points below the real worst case, and
// "warn" never fails the command anyway, so combined with the workflow's
// `continue-on-error: true` this job could not currently catch any
// regression. Both are fixed here: real numbers, "error" level, no
// continue-on-error.
//
// We intentionally do NOT use the `lighthouse:no-pwa` preset: it ships many
// audit-level assertions (e.g. zero render-blocking resources, zero unused
// CSS) that are generic aspirational targets the site does not meet today
// and that aren't what we're trying to gate on — using it made every run
// fail regardless of the PR's actual change. Category-score budgets, sized
// to this site's real numbers, are what we want CI to enforce.
//
// If a page legitimately regresses, re-measure locally and move these
// numbers — don't just bump them blindly to make CI pass.
//
// numberOfRuns is 3 here (not the 1 used for local calibration above): the
// very first CI run of this config failed /404.html's performance assertion
// at 0.76 — 23pt below both the 0.88 threshold and the 0.99 measured
// locally, on a PR that touches no application/build code, only CI config.
// That gap is CI-runner noise (shared/throttled GH Actions VMs are known to
// produce noisy single-sample Lighthouse performance runs), not a real
// regression. lhci scores each URL from the *median* run when
// numberOfRuns > 1, which is the documented mitigation for exactly this —
// a single unlucky sample no longer trips the assertion by itself. The
// category thresholds themselves are untouched.
//
// `url` below is an explicit, pinned list — not `staticDistDir`'s
// autodiscovery. Every PT post has a same-id "shadow" page under /blog/ (the
// wrong language prefix — see scripts/lib/blog-links.mjs's validTargets)
// that immediately redirects to the real /pt/blog/ page, which then
// auto-redirects again client-side to the EN translation for any visitor
// (real or headless) whose browser language isn't PT (LanguageSwitcher.astro).
// dist/'s legacy date-prefixed redirect stubs (scripts/generate-redirects.mjs)
// and any UUID-prefixed post id sort ahead of every real letter-starting
// slug, so autodiscovery's alphabetical directory walk deterministically —
// not randomly — picked one of these multi-hop redirect chains as its "one
// representative /blog/<post>" sample on 2026-07-16, and its legitimately
// wide run-to-run variance (2 extra client-side navigations before content
// paints) tripped the performance assertion on an unrelated PR. A blocklist
// entry would only chase the next stub in alphabetical order (there are many
// — every legacy date-prefixed URL is one); pinning the sample page sidesteps
// discovery order entirely.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 3,
      url: ["/", "/404.html", "/about/", "/archive/", "/blog/the-amanuensis/"],
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.88 }],
        "categories:accessibility": ["error", { minScore: 0.91 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
  },
};
