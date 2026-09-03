#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Run CausaGanha's canonical OPF segmenter trainer on a remote GPU.

This worker is intentionally provider-neutral. Kaggle/Colab wrappers only
transport this file and collect its outputs. The worker clones a pinned
CausaGanha ref, installs OPF, copies ONLY train/val/label_space into an
isolated directory, and invokes scripts/run_segmenter_training.py.

The locked test split is never copied into the training workspace and is never
evaluated here. This job is for exploratory train+validation runs only; model
promotion remains a separate CausaGanha concern.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import zipfile
from datetime import UTC, datetime
from pathlib import Path


def _run(cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    print("+", " ".join(cmd), flush=True)
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert proc.stdout is not None
    for line in proc.stdout:
        print(line, end="", flush=True)
    rc = proc.wait()
    if rc != 0:
        raise subprocess.CalledProcessError(rc, cmd)


def _capture(cmd: list[str], *, cwd: Path | None = None) -> str:
    return subprocess.check_output(cmd, cwd=cwd, text=True, stderr=subprocess.STDOUT).strip()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _gpu_snapshot() -> dict[str, object]:
    snapshot: dict[str, object] = {
        "python": sys.version,
        "platform": platform.platform(),
    }
    try:
        snapshot["nvidia_smi"] = _capture(
            [
                "nvidia-smi",
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader",
            ]
        )
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        snapshot["nvidia_smi_error"] = str(exc)
    return snapshot


def _archive_report(report_dir: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(report_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(report_dir))


def _archive_model(checkpoint_dir: Path, manifest: Path, output: Path) -> None:
    """Archive only the selected checkpoint, not every exploratory epoch.

    OPF checkpoints are large and mostly incompressible. A low gzip level keeps
    transfer/storage savings without spending most of the free GPU session on
    CPU compression after training has already completed.
    """
    output.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output, "w:gz", compresslevel=1) as archive:
        archive.add(checkpoint_dir, arcname="checkpoint")
        archive.add(manifest, arcname="experiment_manifest.json")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-url", default="https://github.com/franklinbaldo/causaganha.git")
    parser.add_argument("--ref", default="main")
    parser.add_argument("--data-dir", default="data/segmenter_splits")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--seed", type=int, default=771)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--report-archive", required=True)
    parser.add_argument("--model-archive", required=True)
    args = parser.parse_args()

    started = time.monotonic()
    output_root = Path(args.output_root)
    report_dir = output_root / "report"
    training_dir = output_root / "training"
    report_dir.mkdir(parents=True, exist_ok=True)
    training_dir.mkdir(parents=True, exist_ok=True)

    summary: dict[str, object] = {
        "schema": "causaganha-segmenter-gpu-run-v1",
        "started_at": datetime.now(UTC).isoformat(),
        "repo_url": args.repo_url,
        "requested_ref": args.ref,
        "requested_data_dir": args.data_dir,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "seed": args.seed,
        "locked_test_consumed": False,
        "purpose": "exploratory_train_validation_only",
        "hardware": _gpu_snapshot(),
    }

    work = Path(tempfile.mkdtemp(prefix="causaganha-segmenter-"))
    try:
        repo = work / "causaganha"
        _run(["git", "clone", "--filter=blob:none", args.repo_url, str(repo)])
        _run(["git", "fetch", "origin", args.ref, "--depth", "1"], cwd=repo)
        _run(["git", "checkout", "--detach", "FETCH_HEAD"], cwd=repo)
        resolved_sha = _capture(["git", "rev-parse", "HEAD"], cwd=repo)
        summary["resolved_sha"] = resolved_sha

        # Install only what the canonical trainer needs. Avoid installing the
        # whole web/archive application just to run the segmenter.
        _run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "pydantic>=2.10",
                "structlog>=24.1",
                "opf @ git+https://github.com/openai/privacy-filter.git",
            ]
        )

        try:
            import torch

            cuda_available = bool(torch.cuda.is_available())
            summary["torch_version"] = torch.__version__
            summary["cuda_available"] = cuda_available
            if cuda_available:
                summary["cuda_device"] = torch.cuda.get_device_name(0)
        except Exception as exc:  # noqa: BLE001 - this is diagnostics for remote infrastructure
            summary["torch_probe_error"] = repr(exc)
            cuda_available = False
        if not cuda_available:
            raise RuntimeError("Remote runner has no CUDA device visible to PyTorch")

        source_data = repo / args.data_dir
        isolated_data = work / "train-val-only"
        isolated_data.mkdir()
        required = ("train.jsonl", "val.jsonl", "label_space.json")
        data_hashes: dict[str, str] = {}
        for name in required:
            source = source_data / name
            if not source.is_file():
                raise FileNotFoundError(f"missing required training artifact: {source}")
            target = isolated_data / name
            shutil.copy2(source, target)
            data_hashes[name] = _sha256(target)
        summary["training_artifact_sha256"] = data_hashes
        summary["test_present_in_isolated_workspace"] = (isolated_data / "test.jsonl").exists()

        label_space = json.loads((isolated_data / "label_space.json").read_text(encoding="utf-8"))
        ontology_version = str(label_space.get("category_version") or "unknown")
        release_id = f"gpu-exploratory-{ontology_version}-{resolved_sha[:12]}"

        runtime_lock = report_dir / "runtime-lock.txt"
        freeze = _capture([sys.executable, "-m", "pip", "freeze"])
        runtime_lock.write_text(
            f"python={sys.version}\nresolved_sha={resolved_sha}\n\n{freeze}\n",
            encoding="utf-8",
        )
        dependency_lock_hash = _sha256(runtime_lock)
        summary["dependency_lock_sha256"] = dependency_lock_hash

        env = os.environ.copy()
        env["PYTHONPATH"] = os.pathsep.join([str(repo / "src"), str(repo), env.get("PYTHONPATH", "")])
        cmd = [
            sys.executable,
            str(repo / "scripts" / "run_segmenter_training.py"),
            "--data-dir",
            str(isolated_data),
            "--output-dir",
            str(training_dir),
            "--release-id",
            release_id,
            "--ontology-version",
            ontology_version,
            "--guideline-version",
            "v7.3",
            "--dependency-lock-hash",
            dependency_lock_hash,
            "--epochs",
            str(args.epochs),
            "--batch-size",
            str(args.batch_size),
            "--seed",
            str(args.seed),
            "--device",
            "cuda",
        ]
        summary["trainer_command"] = cmd
        _run(cmd, cwd=repo, env=env)

        # Copy compact evidence into the report archive.
        for path in sorted(training_dir.glob("val_metrics_epoch_*.json")):
            shutil.copy2(path, report_dir / path.name)
        manifest = training_dir / "experiment_manifest.json"
        if not manifest.is_file():
            raise FileNotFoundError("trainer completed without experiment_manifest.json")

        manifest_payload = json.loads(manifest.read_text(encoding="utf-8"))
        shutil.copy2(manifest, report_dir / manifest.name)
        summary["experiment_manifest"] = manifest_payload

        checkpoint_dir = Path(str(manifest_payload["checkpoint_dir"])).resolve()
        training_root = training_dir.resolve()
        if checkpoint_dir.parent != training_root or not checkpoint_dir.is_dir():
            raise RuntimeError(f"selected checkpoint is outside training output: {checkpoint_dir}")

        model_archive = Path(args.model_archive)
        _archive_model(checkpoint_dir, manifest, model_archive)
        summary["selected_checkpoint"] = checkpoint_dir.name
        summary["model_archive_bytes"] = model_archive.stat().st_size

        # Kaggle publishes everything left under /kaggle/working. Remove the
        # multi-GB epoch directories after the selected checkpoint is safely
        # archived, otherwise three epochs cause three full checkpoints to be
        # synchronized in addition to the archive.
        for epoch_dir in training_dir.glob("epoch-*"):
            shutil.rmtree(epoch_dir, ignore_errors=True)

        summary["status"] = "success"
        return_code = 0
    except Exception as exc:  # noqa: BLE001 - preserve diagnostics in report before failing
        summary["status"] = "failed"
        summary["error"] = repr(exc)
        return_code = 1
    finally:
        summary["finished_at"] = datetime.now(UTC).isoformat()
        summary["duration_seconds"] = round(time.monotonic() - started, 3)
        (report_dir / "run-summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        _archive_report(report_dir, Path(args.report_archive))
        shutil.rmtree(work, ignore_errors=True)

    return return_code


if __name__ == "__main__":
    raise SystemExit(main())
