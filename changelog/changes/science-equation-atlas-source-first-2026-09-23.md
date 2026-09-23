---
type: changelog
date: 2026-09-23
description: Reframe the Scientific Equation Atlas around source-first bulk ingestion for million-scale coverage.
tags: [science, equations, okf, datasets, ingestion]
---

# Scientific Equation Atlas source-first ingestion

- Changes the recurring unit of work from one formula to one source/corpus.
- Defines a million-scale pipeline: snapshot, extract, classify, normalize, deduplicate, cluster, verify and promote.
- Separates attested expressions from reconstructed mathematical formalizations of algorithms, code and rules.
- Expands explicit scope to computer science, law, regulation and other quantitatively formalizable domains.
- Adds a source plan covering Wikidata, DLMF/DRMF, OEIS, LMFDB, arXiv, S2ORC, PMC OA/JATS, OpenAlex, software documentation, legal corpora and Common Crawl.
- Makes clear that mass occurrences belong in sharded structured artifacts rather than millions of Markdown files or Git blobs.
