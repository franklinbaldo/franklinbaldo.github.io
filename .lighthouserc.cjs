// Budgets are calibrated against this site's own measured state, not generic
// aspirational targets. Measured 2026-07-09 on a production build (`npm run
// build`) of main (ba52d4e), Lighthouse run locally (numberOfRuns: 1) against
// the 5 pages `staticDistDir` autodiscovers (/, /404, /about, /archive, and
// one /blog/<slug> post — lhci's default `maxAutodiscoverUrls`), two runs to
// check for noise:
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
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 1,
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
