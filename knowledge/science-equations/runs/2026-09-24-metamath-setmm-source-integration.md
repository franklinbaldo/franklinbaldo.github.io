---
type: science-atlas-run
date: "2026-09-24"
mode: "source-first bulk source integration"
summary: "Integrate the Metamath Proof Explorer set.mm corpus as a CC0 harvest-ready lane for attested formal equality, inequality, membership and subset assertions with proof-context provenance."
updated: "2026-09-24"
---

# Metamath Proof Explorer set.mm source integration — 2026-09-24

## State reconstructed from main

This run began from contemporary `main` commit `2b3a61924501322c62be11b4bd148c2c11cad07f` after reading `docs/science-equation-atlas-routine.md`, `docs/science-equation-atlas-sources.md`, `knowledge/science-equations/`, the source-descriptor tree and the persisted ingestion manifests.

The latest persisted source-integration run on `main` states that fifteen descriptors existed immediately before the Physiome CellML lane was added. The current tree contains that Physiome descriptor as well, so source selection began with sixteen integrated source descriptors. `data/science-equations/manifests/` contains exactly one persisted ingestion manifest, `oeis-2026-09-23.json`.

No previous automation message, remembered queue, branch state or transient blocker was used to choose the work. The unit of work is the **Metamath Proof Explorer `set.mm` corpus**, not an individual theorem such as `2+2=4`.

## Why Metamath set.mm

`set.mm` is the machine-verifiable source database behind the Metamath Proof Explorer. It provides tens of thousands of completely formal proofs spanning logic, set theory and substantial downstream mathematics, with theorem/axiom assertions represented as structured token sequences rather than only rendered prose.

The generated Proof Explorer describes more than 26,000 completely worked proofs in its main sections and more than 41,000 when user mathboxes are counted. The active upstream development branch observed during source research was `develop`, at commit `440d944b9c183ab852c52ec69af5fbe3fb178f89` on 2026-09-24. That commit is run evidence only: the source descriptor deliberately requires each real acquisition to resolve and pin the exact commit actually harvested rather than hardcoding a moving revision.

Official surfaces used for this source contract:

- <https://github.com/metamath/set.mm>
- <https://us.metamath.org/mpeuni/mmset.html>
- <https://us.metamath.org/mpeuni/mathbox.html>
- <https://us.metamath.org/copyright.html>

## Source semantics

`scripts/science-equations/harvest-metamath-setmm.py` consumes one pinned `set.mm` object. It parses Metamath scopes and statements and emits only logical `$a`/`$p` assertions whose typecode is `|-` and whose token sequence contains an explicitly configured relation token: equality/non-equality, order, membership/non-membership or subset/non-subset.

Every emitted row is `attested`. For each occurrence the adapter preserves:

- exact lexical assertion substring as `expression_original`;
- complete Metamath assertion token sequence;
- axiom versus proved-theorem statement type and theorem label;
- exact relation token(s) that caused inclusion;
- active essential hypotheses;
- relevant floating hypotheses that provide variable typecodes;
- relevant distinct-variable constraints;
- immediate preceding source comment when available;
- exact Git commit, immutable source snapshot, line range and stable Git blob locator;
- SHA-256 of the full `set.mm` source, assertion, proof body for `$p`, and occurrence identity.

The Proof Explorer contributor convention requires each `$p` and `$a` statement to be immediately preceded by the comment shown as the theorem-page description, so that source comment is useful human context without scraping generated pages.

Proof bodies are not copied into each occurrence row because they would cause avoidable lake bloat; a proof SHA-256 is retained. The extracted stage does not translate Metamath tokens into textbook TeX, prove algebraic or logical equivalence, expand definitions, infer a family, or reconstruct a formula from prose.

## Rights and redistribution

The official Metamath copyright page states that Metamath database `.mm` files are CC0/public-domain except for the separately identified `peano.mm` GPL exception. The repository-level `LICENSE` is also CC0, while the `peano.mm` source itself contains its GPL notice.

The Atlas therefore makes a deliberately narrow rights decision: this lane includes **`set.mm` only** and records `CC0-1.0`. It does not inherit that decision to `peano.mm` or future separately licensed files. This keeps the corpus harvest-ready for redistribution while preserving commit/path/hashes for provenance.

## Snapshot identity

A real data-plane run is content-addressed and immutable:

1. resolve the official source branch used for acquisition to an exact Git commit;
2. acquire exactly `set.mm` on an external executor, never GitHub Actions;
3. SHA-256 the source bytes;
4. build the deterministic file inventory with `scripts/science-equations/build-source-inventory.py`;
5. use `metamath-setmm:git:<commit>:inventory-sha256:<digest>` as `source_snapshot`.

A changed commit or changed bytes creates a new snapshot and a new Internet Archive item. No published snapshot is silently overwritten.

## Canonical equation lake

The harvester writes JSONL only as transient adapter transport. Persistent outputs remain:

1. `extracted` Apache Parquet/Zstd preserving exact assertion and formal provenance;
2. non-destructive `normalized` Parquet;
3. layered `deduplicated` Parquet.

The shared materializer remains responsible for schema versioning, one-source/one-snapshot batch invariants, deterministic default shards of 250,000 rows, row counts, byte counts and SHA-256 per shard. Source-exact, textual, syntactic, algebraic, typed-renaming, nondimensional, functional/dynamic and structural-family relations remain separate layers; a formal theorem statement is not automatically equivalent to a visually similar formula in another source.

Permitted Parquets and manifests are published only from an external executor using `scripts/science-equations/publish-internet-archive.py`, followed by remote metadata/listing, size and checksum verification where exposed. Massive shards never enter Git.

## Reproducible adapter validation in this execution

The new adapter was validated in the available sandbox, outside GitHub Actions:

- `python3 -m py_compile` passed;
- Node regression suite passed `2/2`;
- the fixture exercised a proved equality, an axiomatic inequality, membership, a non-relation theorem and a non-logical syntax assertion;
- relation-bearing logical assertions emitted: `3`;
- a theorem without a configured relation was filtered;
- a syntax assertion with non-`|-` typecode was filtered;
- an active essential hypothesis and relevant floating hypotheses were retained;
- all emitted rows remained `attested`;
- OCR count was zero;
- reconstruction count was zero;
- occurrence hashes were identical across two different checkout directories.

These fixture rows are validation only and are not counted as corpus yield.

## Real corpus yield in this execution

The external data plane was unavailable. The Jatobá control-plane status call timed out. The fallback sandbox has no external DNS, PyArrow, `ia` CLI/Internet Archive credentials, or compatible `okf-parser`; moving bulk acquisition, Parquet materialization or publication into GitHub Actions would violate Atlas policy and was not done.

Measured real-corpus results are therefore:

- external acquisition executor used: none available;
- real `set.mm` source objects acquired for lake ingestion: `0`;
- extracted real occurrences: `0`;
- normalized real occurrences: `0`;
- deduplicated real occurrences: `0`;
- rejected real source objects: `0` because bulk acquisition did not begin;
- Parquet shards produced: `0`;
- Internet Archive identifier: none;
- candidate families generated: `0`;
- verified families generated: `0`.

GitHub source inspection, upstream theorem counts and fixture assertions are not reported as ingestion yield.

## Coverage gained

This integration adds a formal-mathematics lane whose occurrences carry machine-checkable theorem identity, explicit hypotheses, variable typecodes and distinct-variable conditions. It complements rendered mathematics from textbooks/articles and structured mathematical objects from LMFDB by preserving the logical context in which a relation is actually proved or assumed.

The lane is also a strong future verification surface for cross-source family candidates: an equality found in OEIS, Wikidata, OpenStax or Wikipedia can be reconciled to a formal Metamath assertion without claiming equivalence merely from string or embedding similarity.

## Audit debt

- Run the pinned upstream `set.mm` corpus on an external executor and persist the lightweight source/lake manifests.
- Measure yield by relation token and theorem/axiom statement type.
- Sample source comments and scoped hypotheses to quantify parser-context fidelity on real `set.mm`.
- Decide whether relation-bearing assertions in other CC0 Metamath databases merit separate source descriptors rather than broadening this rights-scoped lane.
- Build a later parser-aware normalization from Metamath syntax trees; do not replace the original token expression.
- Compare source-exact/textual/syntactic dedup separately before proposing verified cross-source families.
- Run `okf-parser` graph inspection when an executor with the compatible parser is available.

## Validation and merge gate

The source adapter fixture and Python compilation were green before the branch was written. The OKF bundle and normal blog checks remain control-plane gates: this change must not merge unless the repository's existing validation gates are green. Those gates may run on GitHub because they do not acquire/process corpora, generate Parquet, or upload data.

## Next data-plane action

On an external executor with internet, PyArrow, `okf-parser` and Internet Archive credentials:

```text
resolve official set.mm source branch to exact commit
→ acquire exactly set.mm outside GitHub Actions
→ SHA-256 + deterministic inventory
→ harvest attested relation-bearing $a/$p assertions
→ extracted Parquet
→ non-destructive normalized Parquet
→ layered deduplicated Parquet
→ quality/rights audit
→ immutable Internet Archive upload
→ post-upload metadata/size/checksum verification
→ lightweight manifest + measured counts back to Git
```
