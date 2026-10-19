# Bounded experiment queue: offline planning contract

Status: implemented offline planner, NOT activated scheduler or exactly-once execution.

`python3 tools/experiment_queue.py --requests requests.json --approved approved.json --ledger ledger.json`

Tests: `python3 -m unittest discover -s tools/tests -v` (11 tests).
JSON arrays are transient machine snapshots exported from canonical OKF records, never a new authoritative persistent queue or ledger. All files are JSON arrays; reads are capped at 1 MiB, eight requested/approved jobs and 1,000 ledger entries. Missing, malformed or overflowing snapshots must stop planning, not silently truncate history.

## Immutable specification

Every request and approved entry has exactly these fields:

- experiment: `vasco-archived-36` or `vasco-official-refetch-3`
- code_sha: exact 40-character lowercase Git commit
- runner_sha256, input_sha256, protocol_sha256: exact SHA256 digests
- runtime: e.g. `python-3.12.3;ubuntu-24.04;image-20261012.334.1`
- parameters: exactly plate_id 7538, scan_id 9720 and rows 36 or 3 respectively

Identity is SHA256 of canonical JSON `{schema:1,spec:...}`, including runtime and protocol bytes. This queue identity is distinct from the older RESULT run_identity. Reordering JSON object keys does not change identity. Changes to code/data/protocol/runtime create a new technical identity; they DO NOT establish a new scientific hypothesis, independent data or permission to repeat a stopped experiment.

Each ledger record has exactly identity_schema (`queue-v1`), identity, state (`reserved`, `success`, `failure`) and evidence (GitHub URL). A prior reservation or success skips the job; failure requires explicit reconciliation, never automatic retries. Duplicate identities and duplicate JSON keys fail closed. A new exact approved identity is merely `eligible-unreserved`; dispatch_authorized is always false.

The caller supplies complete authenticated snapshots from protected main and canonical evidence. The planner cannot authenticate these files, verify that approval happened, verify GitHub links, prove ledger completeness, reserve atomically, fetch code, execute jobs, or persist anything. It is not a security boundary for untrusted PR input. Historical run_identity values require explicit backfill from the complete original immutable specification into queue-v1 identities. Copying old run_identity hashes will not deduplicate; do not activate until complete migration and reconciliation are verified. The namespace field rejects legacy-tagged entries but cannot prove a digest was derived honestly. A forged empty ledger would evade historical dedupe: no execution may rely on such an unauthenticated snapshot.

## Activation prerequisites and architecture

1. A trusted controller reads a frozen approved manifest from protected main, validates code/data/protocol/runtime and reviews the scientific stop gates. No shell command, dependency URL or arbitrary experiment path comes from the queue.
2. Before executing, the controller creates an atomic durable reservation keyed by queue identity. A PR record alone is NOT atomic, and Actions concurrency only serializes overlapping jobs. Reservation publication and reconciliation after crashes are required before claiming durable dedupe.
3. A credential-free executor checks out the approved exact SHA and runs only an allowlisted fixed entrypoint under existing time/size bounds. PR code never receives secrets or write access.
4. A separate trusted harvester consumes only bounded data, checks expected hashes and schemas, and independently revalidates the bundle. It never executes code from the artifact or interpolates it into shell commands.
5. Persistence writes deterministic evidence paths and a single PR to papers, preserving success, failure and negative results. Scientific validity is a separate gate; routine integrity checks cannot approve scientific conclusions.

No activation, permissions change, credentials, network query or workflow modification is included here. Existing VASCO workflow remains unchanged and is not wired to this planner. Its current SHA concurrency does NOT provide historical dedupe.

## Minimal cross-repository authorization proposal (not configured)

Existing blog legacy workflow references PAPERS_READ_TOKEN; its name does not establish token type or actual scope. Do not reuse it by inference. No suitable dedicated write integration was verified.

If approved at action time, use a dedicated GitHub App installed only on franklinbaldo/papers, Metadata read, Contents write and Pull requests write. Limit each installation token to that repository and those permissions. A protected trusted persistence job would hold the app credential; the experiment job must never receive it. Secret entry requires secure user handling. GITHUB_TOKEN from the blog cannot independently write papers. No Administration, Actions write, Workflows write or Secrets permission is proposed.

Contents write is repository-wide, not path-scoped: application-side path checks are not a GitHub permission boundary. Before activation, approve that precise risk and select a durable reservation implementation. Creating a new ledger branch or automatically merging evidence must respect repository protection and cannot bypass required checks. An external database/service is not assumed or authorized.

Until that decision, manual MCP persistence is available under the user's explicit handoff and was used for papers PR1635; this is not unattended persistence.

## Reconciliation, 2026-10-18

- Official three-ID Actions run39173272861 at blog b4d936e5b6cd1f7d3e0249c7b638a632ea491f23 succeeded; evidence preserved by papers PR1635 at 8f75549bd52723b9f84f78418dbc7425683c0a67
- Blog PR2385 remains open at e6fee3bf0790a364f0fc7999078884a95ce1b474: archived 2,500-record replay reported by another conversation, not independently verified by this planner
- Blog PR2388 remains open at e06de9d19af3e374cdba604c61e33caab274f16d: bounded TAP diagnostics, not full collection
- No 2,500/full-scan expansion or duplicate TAP experiment is queued here

Next activation decision: trusted durable reservation storage and scoped persistence permission. Next scientific discriminator remains epoch-aware independent Gaia matching with uncertainty and image controls, under the canonical protocol; this planner supplies no scientific result.
