---
type: science-atlas-run
date: "2026-09-23"
mode: "source-first scale pivot + corpus rights audit"
summary: "Replace one-formula-at-a-time acquisition with a corpus-first pipeline, audit eight high-yield source families for bulk access and reuse constraints, and establish a rights-aware queue spanning science, mathematics, computing, engineering and law."
updated: "2026-09-23"
---

# Source-first million-scale run — 2026-09-23

## Starting state reconstructed from `main`

This run reread `docs/science-equation-atlas-routine.md` and reconstructed the Atlas from the current Markdown OKF bundle rather than from conversational state.

At the start of the run the canonical bundle contained:

- **14** curated `science-formula` cards;
- **23** `science-branch` cards;
- **3** verified `equation-family` cards;
- **11** prior `science-atlas-run` records.

That state is scientifically useful but structurally incapable of reaching the intended scale if each execution researches one formula manually. The frontier is therefore not another isolated formula; it is the acquisition architecture itself.

## Prior art and source access audited

The source plan was checked against current official documentation rather than assuming that public web access implies bulk-reuse permission.

### Harvest-ready or bulk-capable

1. **Wikidata P2534 (`defining formula`)** — the property documentation reported **113,316 current uses** during this run. Wikidata structured data in the main/property/lexeme namespaces is CC0. This is the best first adapter because formula strings already attach to QIDs and may carry symbol metadata through related properties.
2. **OEIS** — official bulk download paths and the `oeisdata` repository are documented; content is CC BY-SA 4.0. Treat formulas, recurrences, generating functions and transforms as distinct structures rather than treating every sequence as an equation.
3. **LMFDB** — official API/download access is documented and the underlying data are CC BY-SA. It is a strong structured source for typed mathematical objects.
4. **GovInfo / CFR / eCFR** — the GovInfo Developer Hub exposes bulk XML for multiple legislative and regulatory collections, including annual CFR and current eCFR. This is the first high-yield legal/regulatory lane and avoids page-by-page scraping.
5. **IETF RFC series** — more than 9000 RFCs are available under the IETF Trust terms; RFCXML is the raw source format for newer RFCs. This is a strong computing/network-protocol lane, with modification restrictions preserved as provenance constraints.

### Bulk-accessible but license-filtered

6. **PMC Article Datasets / JATS** — bulk article data are available through the PMC Cloud Service on AWS. The 2026 distribution transition is complete; the old OA Web Service/legacy dataset files must not be used by a new importer. JATS gives first-class formula containers such as `disp-formula` and `inline-formula`. Reuse rights remain article-specific.
7. **arXiv full text/source** — official requester-pays S3 bulk access exists for source and PDF files, with manifests and monthly-ish updates. The default arXiv license does not grant third parties a blanket redistribution right, so the Atlas may analyze/index at scale but must gate redistribution by per-item license and link back to arXiv where required.

### Reference, not harvest

8. **NIST DLMF** — excellent reference for mathematical semantics and normalization, but its official notices explicitly prohibit bulk copying/reproduction/redistribution. The previous source ordering incorrectly treated it as a top bulk-ingestion target; this run corrected that mistake and moved DLMF to `reference-only`.

Other candidates such as S2ORC, OpenAlex, European/Brazilian legal corpora, software repositories and Common Crawl remain in the plan, but a concrete snapshot/version must be rights-audited before being called harvest-ready.

## Architecture changes

The routine now makes the **source/corpus** the default unit of work and explicitly targets millions of occurrences. It also broadens the object of collection beyond equations explicitly named as such to functions, recurrences, losses, constraints, transitions, cost functions, transforms, kernels, distributions and quantitatively formalizable rules.

Two provenance classes were made explicit:

- `attested`: the source actually contains the mathematical expression or an equivalent mathematical form;
- `reconstructed`: the source contains a function, algorithm, rule, pseudocode, API behavior or normative procedure and the Atlas creates a faithful mathematical formalization.

This distinction is essential for computer science and law. A sorting/update rule or a tax/benefit rule may be mathematically expressible even when the source never prints an equation; the Atlas must not misrepresent the reconstructed notation as source-original.

Mass occurrences are not required to become millions of Markdown files. The stable conceptual layer remains Markdown OKF, while bulk occurrences may be stored in immutable Parquet/JSONL shards or equivalent external artifacts referenced by manifests. Git remains the home for schemas, importers, manifests, checksums, fixtures, aggregate metrics, curated concepts, families, audits and runs.

## Deduplication / equivalence boundary

No new `equation-family` edge was created in this run because no new mathematical equivalence was tested. This was deliberate.

The bulk pipeline separates:

1. source-exact duplicates;
2. normalized-text duplicates;
3. syntax-normalized candidates;
4. algebraic-equivalence candidates;
5. typed variable-renaming candidates;
6. dimensionless candidates;
7. functional/dynamical family candidates.

Only the later layers can propose semantic family relations, and those relations still require a reproducible transformation or argument before promotion to Markdown OKF.

## Yield metrics

- source families rights/access-audited against official documentation: **8**;
- immediately high-value bulk lanes identified: **Wikidata, OEIS, LMFDB, GovInfo/CFR/eCFR, PMC/JATS, IETF RFCXML**, plus license-filtered arXiv;
- current addressable structured formula statements identified in the first lane: **113,316 P2534 uses** at audit time;
- existing curated formula occurrences: **14**;
- new equation-family confirmations: **0**;
- raw equation candidates ingested in this architecture run: **0**;
- false bulk assumptions corrected: **1 major case** (DLMF moved from ingestion priority to reference-only), plus the PMC 2026 access path and arXiv redistribution boundary made explicit.

The zero raw-ingestion count is recorded rather than hidden: this run changes the pipeline so subsequent executions can harvest source-sized batches without creating license or Git-history debt.

## Frontier left by the corpus

The next high-return implementation target is a reproducible **Wikidata P2534 adapter** with a versioned manifest and small fixture. It should preserve QID, statement identity when available, original mathematical expression, ranks/qualifiers/references and symbol metadata, then emit sharded occurrence records outside the conceptual Markdown layer.

After that, the strongest independent lanes are OEIS for discrete mathematics, GovInfo/eCFR for law/regulation, PMC/JATS for biomedical science, and IETF RFCXML for computing/protocols. This is a portfolio rather than a single disciplinary queue: the scheduler should avoid spending many consecutive runs on one domain while other high-yield corpora remain untouched.

## Validation

The canonical Atlas validation remains the repository-pinned `okf-parser` normative check:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The PR must also pass the normal blog checks before squash merge. Validation results belong to the PR/CI evidence; a failed gate is not to be rewritten as success in this run record.
