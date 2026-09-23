---
type: changelog
date: 2026-09-23
description: Reframe the Scientific Equation Atlas around rights-aware, source-first bulk ingestion for million-scale coverage.
tags: [science, equations, okf, datasets, ingestion]
---

# Scientific Equation Atlas source-first ingestion

- Changes the recurring unit of work from one formula to one source/corpus.
- Defines a million-scale pipeline: snapshot, extract, classify, normalize, deduplicate, cluster, verify and promote.
- Separates attested expressions from reconstructed mathematical formalizations of algorithms, code and legal/regulatory rules.
- Expands explicit scope to computer science, law, regulation, engineering and other quantitatively formalizable domains.
- Adds a rights-aware source plan spanning Wikidata P2534, OEIS, LMFDB, PMC/JATS, arXiv, IETF RFCXML, GovInfo/CFR/eCFR, software documentation and additional scientific/legal corpora.
- Corrects DLMF from a bulk-ingestion target to reference-only because its official terms prohibit bulk copying/redistribution, and records the 2026 PMC distribution transition plus the arXiv per-item license boundary.
- Adds a streaming Wikidata P2534 dump harvester that preserves source notation, QID/statement provenance, qualifiers, references, symbol claims and source-statement checksums without loading the full dump into memory.
- Adds unit coverage for Wikidata dump-line parsing, provenance preservation and bounded JSONL streaming.
- Makes clear that mass occurrences belong in sharded structured artifacts rather than millions of Markdown files or Git blobs, while Markdown OKF remains the canonical conceptual and audit layer.
- Records the source-first scale audit in `knowledge/science-equations/runs/2026-09-23-source-first-million-scale.md`.
