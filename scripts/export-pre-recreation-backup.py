#!/usr/bin/env python3
"""Export a restorable pre-recreation backup of franklinbaldo.github.io.

Designed to run inside the source repository's GitHub Actions context. It creates:
- a verified full Git bundle including heads/tags/pull refs;
- Git LFS objects;
- repository metadata and labels/milestones/releases;
- every open issue with its comments;
- every open PR with conversation comments, reviews, inline comments, and a binary patch;
- a recreation plan whose public seed is an explicit sanitized commit SHA.

Historical discussion is preserved for provenance but is not intended to be reposted under
new authorship in the recreated repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.github.com"


def run(cmd: list[str], *, cwd: Path | None = None, check: bool = True, stdout=None) -> subprocess.CompletedProcess:
    p = subprocess.run(cmd, cwd=cwd, stdout=stdout, stderr=subprocess.PIPE, text=stdout is None)
    if check and p.returncode != 0:
        err = p.stderr if isinstance(p.stderr, str) else ""
        raise RuntimeError(f"command failed ({p.returncode}): {' '.join(cmd)}\n{err[-4000:]}")
    return p


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


class GitHub:
    def __init__(self, token: str, repo: str):
        self.token = token
        self.repo = repo

    def get(self, path: str, *, best_effort: bool = False):
        req = urllib.request.Request(
            API + path,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {self.token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "blog-pre-recreate-backup",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as exc:
            if best_effort:
                return {"_error": str(exc), "_endpoint": path}
            raise

    def paginate(self, path: str, *, max_pages: int = 100) -> list:
        out: list = []
        for page in range(1, max_pages + 1):
            sep = "&" if "?" in path else "?"
            chunk = self.get(f"{path}{sep}per_page=100&page={page}")
            if not isinstance(chunk, list) or not chunk:
                break
            out.extend(chunk)
            if len(chunk) < 100:
                break
        return out


def dump_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def dump_jsonl(path: Path, rows: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--seed-sha", required=True)
    ap.add_argument("--consumed-pr", type=int, default=1956)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("GH_TOKEN/GITHUB_TOKEN is required")

    out = Path(args.output).resolve()
    mirror = out / "repository.git"
    meta = out / "metadata"
    mig = out / "migration"
    settings = out / "settings"
    shutil.rmtree(out, ignore_errors=True)
    meta.mkdir(parents=True)
    (mig / "open-issues").mkdir(parents=True)
    (mig / "open-prs").mkdir(parents=True)
    settings.mkdir(parents=True)

    gh = GitHub(token, args.source)

    # 1. Full Git history + PR refs.
    run(["git", "clone", "--mirror", f"https://github.com/{args.source}.git", str(mirror)])
    run(["git", "fetch", "origin", "+refs/pull/*/head:refs/pull/*/head"], cwd=mirror, check=False)
    run(["git", "lfs", "install", "--skip-smudge"])
    run(["git", "lfs", "fetch", "--all", "origin"], cwd=mirror)

    run(["git", "cat-file", "-e", f"{args.seed_sha}^{{commit}}"], cwd=mirror)
    seed_tree = run(["git", "rev-parse", f"{args.seed_sha}^{{tree}}"], cwd=mirror).stdout.strip()
    source_main = run(["git", "rev-parse", "refs/heads/main"], cwd=mirror).stdout.strip()
    (mig / "public-seed.sha").write_text(args.seed_sha + "\n", encoding="utf-8")
    (mig / "public-seed.tree").write_text(seed_tree + "\n", encoding="utf-8")
    (mig / "source-main.sha").write_text(source_main + "\n", encoding="utf-8")

    bundle = out / "repository.bundle"
    run(["git", "bundle", "create", str(bundle), "--all"], cwd=mirror)
    run(["git", "bundle", "verify", str(bundle)])
    (out / "repository.bundle.sha256").write_text(
        f"{sha256_file(bundle)}  repository.bundle\n", encoding="utf-8"
    )

    # 2. Repository metadata.
    repo = gh.get(f"/repos/{args.source}")
    dump_json(meta / "repository.json", repo)

    refs = {"heads": {}, "tags": {}}
    raw = run(
        ["git", "for-each-ref", "--format=%(refname)\t%(objectname)", "refs/heads", "refs/tags"],
        cwd=mirror,
    ).stdout
    for line in raw.splitlines():
        ref, sha = line.split("\t", 1)
        if ref.startswith("refs/heads/"):
            refs["heads"][ref.removeprefix("refs/heads/")] = sha
        elif ref.startswith("refs/tags/"):
            refs["tags"][ref.removeprefix("refs/tags/")] = sha
    dump_json(meta / "refs.json", refs)
    dump_json(meta / "branches.json", [{"name": k, "commit": {"sha": v}} for k, v in sorted(refs["heads"].items())])
    dump_json(meta / "topics.json", repo.get("topics", []))
    dump_json(meta / "labels.json", gh.paginate(f"/repos/{args.source}/labels", max_pages=10))
    dump_json(meta / "milestones.json", gh.paginate(f"/repos/{args.source}/milestones?state=all", max_pages=10))
    dump_json(meta / "releases.json", gh.paginate(f"/repos/{args.source}/releases", max_pages=20))

    issue_rows = gh.paginate(f"/repos/{args.source}/issues?state=open", max_pages=10)
    open_issues = [x for x in issue_rows if "pull_request" not in x]
    pulls = gh.paginate(f"/repos/{args.source}/pulls?state=open", max_pages=10)
    dump_jsonl(meta / "issues.jsonl", open_issues)
    dump_jsonl(meta / "pulls.jsonl", pulls)

    deny_terms = (
        "pontifex",
        "cado-nfs",
        "path-tseitin",
        "language-switch arena",
        "p versus np",
        "p vs np",
        "integer factorization",
        "rsa factor",
    )

    def sensitive(text: str) -> bool:
        t = text.lower()
        return any(term in t for term in deny_terms)

    issue_plan = []
    all_issue_comments = []
    for issue in open_issues:
        n = issue["number"]
        idir = mig / "open-issues" / str(n)
        idir.mkdir()
        comments = gh.paginate(f"/repos/{args.source}/issues/{n}/comments", max_pages=30)
        dump_json(idir / "issue.json", issue)
        dump_json(idir / "comments.json", comments)
        body = issue.get("body") or ""
        entry = {
            "old_number": n,
            "title": issue.get("title") or "",
            "body": body,
            "labels": [x.get("name") for x in issue.get("labels", []) if isinstance(x, dict)],
            "assignees": [x.get("login") for x in issue.get("assignees", []) if isinstance(x, dict)],
            "old_url": issue.get("html_url"),
            "withheld_from_public_recreation": sensitive((issue.get("title") or "") + "\n" + body),
            "comment_count_preserved": len(comments),
        }
        dump_json(idir / "migration.json", entry)
        issue_plan.append(entry)
        all_issue_comments.extend({"issue_number": n, **c} for c in comments)

    pr_plan = []
    all_pr_comments = []
    all_reviews = []
    all_review_comments = []
    for pr in pulls:
        n = pr["number"]
        pdir = mig / "open-prs" / str(n)
        pdir.mkdir()
        conversation = gh.paginate(f"/repos/{args.source}/issues/{n}/comments", max_pages=30)
        reviews = gh.paginate(f"/repos/{args.source}/pulls/{n}/reviews", max_pages=30)
        review_comments = gh.paginate(f"/repos/{args.source}/pulls/{n}/comments", max_pages=30)
        dump_json(pdir / "pull.json", pr)
        dump_json(pdir / "conversation-comments.json", conversation)
        dump_json(pdir / "reviews.json", reviews)
        dump_json(pdir / "review-comments.json", review_comments)

        base = pr["base"]["sha"]
        head = pr["head"]["sha"]
        patch = pdir / "changes.patch"
        with patch.open("wb") as fh:
            proc = subprocess.run(
                ["git", "diff", "--binary", base + "..." + head],
                cwd=mirror,
                stdout=fh,
                stderr=subprocess.PIPE,
            )
        patch_mode = "merge-base"
        if proc.returncode != 0:
            with patch.open("wb") as fh:
                proc2 = subprocess.run(
                    ["git", "diff", "--binary", base, head],
                    cwd=mirror,
                    stdout=fh,
                    stderr=subprocess.PIPE,
                )
            if proc2.returncode != 0:
                patch.write_bytes(b"")
                patch_mode = "unavailable"
            else:
                patch_mode = "direct"
        patch_text = patch.read_bytes().decode("utf-8", "replace")
        title = pr.get("title") or ""
        body = pr.get("body") or ""
        entry = {
            "old_number": n,
            "title": title,
            "body": body,
            "draft": bool(pr.get("draft")),
            "base_ref": pr["base"]["ref"],
            "base_sha": base,
            "head_ref": pr["head"]["ref"],
            "head_sha": head,
            "old_url": pr.get("html_url"),
            "patch_mode": patch_mode,
            "consumed_by_public_seed": n == args.consumed_pr,
            "withheld_from_public_recreation": sensitive(title + "\n" + body + "\n" + patch_text),
            "conversation_comment_count_preserved": len(conversation),
            "review_count_preserved": len(reviews),
            "review_comment_count_preserved": len(review_comments),
        }
        dump_json(pdir / "migration.json", entry)
        pr_plan.append(entry)
        all_pr_comments.extend({"pr_number": n, **c} for c in conversation)
        all_reviews.extend({"pr_number": n, **r} for r in reviews)
        all_review_comments.extend({"pr_number": n, **c} for c in review_comments)

    dump_jsonl(meta / "issue-comments.jsonl", all_issue_comments)
    dump_jsonl(meta / "pull-comments.jsonl", all_pr_comments + all_review_comments)
    dump_jsonl(meta / "pull-reviews.jsonl", all_reviews)

    plan = {
        "source_repository": args.source,
        "source_repository_id": repo.get("id"),
        "public_seed_sha": args.seed_sha,
        "public_seed_tree": seed_tree,
        "source_main_sha_at_backup": source_main,
        "consumed_pr": args.consumed_pr,
        "open_issues_total": len(issue_plan),
        "open_prs_total": len(pr_plan),
        "issues_to_recreate": [x["old_number"] for x in issue_plan if not x["withheld_from_public_recreation"]],
        "issues_withheld": [x["old_number"] for x in issue_plan if x["withheld_from_public_recreation"]],
        "prs_to_recreate": [
            x["old_number"] for x in pr_plan
            if not x["consumed_by_public_seed"] and not x["withheld_from_public_recreation"]
        ],
        "prs_withheld": [x["old_number"] for x in pr_plan if x["withheld_from_public_recreation"]],
        "prs_consumed_by_seed": [x["old_number"] for x in pr_plan if x["consumed_by_public_seed"]],
        "numbering_rule": "New repository numbers are expected; old numbers are provenance only.",
    }
    dump_json(mig / "recreation-plan.json", plan)

    readme = [
        f"# Migration package for {args.source}",
        "",
        f"Public seed SHA: {args.seed_sha}",
        f"Public seed tree: {seed_tree}",
        f"Old main SHA at backup: {source_main}",
        "",
        f"Open issues preserved: {len(issue_plan)}",
        f"Open PRs preserved: {len(pr_plan)}",
        f"PR #{args.consumed_pr} is consumed by the seed and must not be recreated.",
        "Old numbering is provenance only; GitHub will allocate new numbers.",
        "Historical comments/reviews are preserved privately and must not be reposted as if newly authored.",
        "Items matching the withdrawn-research denylist stay private.",
        "",
        "Recreation: restore bundle privately; create a root commit from the seed tree; push only that new root;",
        "then recreate eligible issues and each eligible PR as one new squash commit on a fresh branch.",
        "",
    ]
    (mig / "README.md").write_text("\n".join(readme), encoding="utf-8")

    # 3. Best-effort settings snapshot; the owner-authenticated Cloud session must finish this.
    endpoints = {
        "pages.json": f"/repos/{args.source}/pages",
        "environments.json": f"/repos/{args.source}/environments",
        "actions-permissions.json": f"/repos/{args.source}/actions/permissions",
        "actions-workflow-permissions.json": f"/repos/{args.source}/actions/permissions/workflow",
        "rulesets.json": f"/repos/{args.source}/rulesets",
        "variables.json": f"/repos/{args.source}/actions/variables",
        "secrets-names.json": f"/repos/{args.source}/actions/secrets",
        "hooks.json": f"/repos/{args.source}/hooks",
        "deploy-keys.json": f"/repos/{args.source}/keys",
    }
    status = {}
    for filename, endpoint in endpoints.items():
        data = gh.get(endpoint, best_effort=True)
        dump_json(settings / filename, data)
        status[filename] = "_error" not in data if isinstance(data, dict) else True

    dump_json(
        meta / "recursos-auxiliares.json",
        {
            "public_url": "https://franklinbaldo.github.io/",
            "seed_sha": args.seed_sha,
            "seed_tree": seed_tree,
            "open_issues": len(issue_plan),
            "open_prs": len(pr_plan),
            "settings_export_status": status,
            "note": "Secret values are never exported. Cloud must reapply settings using owner-authenticated gh before/after recreation.",
        },
    )

    # 4. LFS object store.
    lfs_src = mirror / "lfs"
    lfs_dst = out / "lfs" / "lfs"
    if lfs_src.exists():
        shutil.copytree(lfs_src, lfs_dst, dirs_exist_ok=True)

    lfs_files = []
    if (lfs_dst / "objects").exists():
        lfs_files = [p for p in (lfs_dst / "objects").rglob("*") if p.is_file()]

    # Remove temporary bare repo; the verified bundle is the Git-history artifact.
    shutil.rmtree(mirror)

    # 5. Checksums and final manifest.
    bundle_sha = sha256_file(bundle)
    export_manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_repository": args.source,
        "source_repository_id": repo.get("id"),
        "bundle_sha256": bundle_sha,
        "bundle_bytes": bundle.stat().st_size,
        "seed_sha": args.seed_sha,
        "seed_tree": seed_tree,
        "source_main_sha": source_main,
        "heads": len(refs["heads"]),
        "tags": len(refs["tags"]),
        "lfs_objects": len(lfs_files),
        "lfs_bytes": sum(p.stat().st_size for p in lfs_files),
        "open_issues": len(issue_plan),
        "open_prs": len(pr_plan),
        "bundle_verified": True,
    }
    dump_json(out / "EXPORT-MANIFEST.json", export_manifest)

    rows = []
    for p in sorted(x for x in out.rglob("*") if x.is_file() and x.name != "SHA256SUMS"):
        rows.append(f"{sha256_file(p)}  {p.relative_to(out).as_posix()}")
    (out / "SHA256SUMS").write_text("\n".join(rows) + "\n", encoding="utf-8")

    # Final local verification.
    run(["git", "bundle", "verify", str(bundle)])
    if not (mig / "recreation-plan.json").stat().st_size:
        raise RuntimeError("empty recreation plan")

    print(json.dumps(export_manifest, indent=2))
    print("BACKUP_EXPORT_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
