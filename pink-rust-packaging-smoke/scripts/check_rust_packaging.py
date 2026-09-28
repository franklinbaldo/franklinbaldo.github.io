#!/usr/bin/env python3
"""Cross-platform smoke contract for RFC 0058 Phase 1 native packaging."""

from __future__ import annotations

from email.parser import Parser
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / "native"
RELEASE_DIST = ROOT / "dist"


def _run(
    command: list[str],
    *,
    cwd: Path = ROOT,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(command))
    result = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode:
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        raise SystemExit(result.returncode)
    return result


def _native_version() -> str:
    with (NATIVE / "pyproject.toml").open("rb") as handle:
        return str(tomllib.load(handle)["project"]["version"])


def _single_wheel(directory: Path, label: str) -> Path:
    wheels = list(directory.glob("pink-*.whl"))
    if len(wheels) != 1:
        raise SystemExit(f"expected exactly one {label} Pink wheel, found {wheels!r}")
    return wheels[0]


def _wheel_version(wheel: Path) -> str:
    with zipfile.ZipFile(wheel) as archive:
        metadata_paths = [
            name for name in archive.namelist() if name.endswith(".dist-info/METADATA")
        ]
        if len(metadata_paths) != 1:
            raise SystemExit(
                f"expected exactly one METADATA file in {wheel.name}, found {metadata_paths!r}"
            )
        metadata = Parser().parsestr(
            archive.read(metadata_paths[0]).decode("utf-8")
        )
    if metadata.get("Name", "").lower() != "pink":
        raise SystemExit(f"unexpected distribution in {wheel.name}: {metadata.get('Name')!r}")
    version = metadata.get("Version")
    if not version:
        raise SystemExit(f"missing Version metadata in {wheel.name}")
    return version


def _simple_index(directory: Path, wheel: Path) -> str:
    package_dir = directory / "pink"
    package_dir.mkdir(parents=True)
    indexed_wheel = package_dir / wheel.name
    shutil.copy2(wheel, indexed_wheel)
    (package_dir / "index.html").write_text(
        f'<a href="{wheel.name}">{wheel.name}</a>\n',
        encoding="utf-8",
    )
    return directory.resolve().as_uri()


def _assert_smoke(result: subprocess.CompletedProcess[str], version: str) -> None:
    payload = json.loads(result.stdout)
    expected = {
        "package": "pink",
        "executable": "pink",
        "runtime": "rust",
        "version": version,
    }
    if payload != expected:
        raise SystemExit(f"native smoke mismatch: expected {expected!r}, got {payload!r}")


def main() -> None:
    version = _native_version()
    legacy_wheel = _single_wheel(RELEASE_DIST, "committed release")
    legacy_version = _wheel_version(legacy_wheel)
    if version == legacy_version:
        raise SystemExit("native packaging probe must not reuse the released Python version")

    with tempfile.TemporaryDirectory(
        prefix="pink-rust-packaging-", ignore_cleanup_errors=True
    ) as raw_tmp:
        tmp = Path(raw_tmp)
        native_dist = tmp / "native-dist"
        tool_dir = tmp / "tools"
        bin_dir = tmp / "bin"
        cache_dir = tmp / "cache"
        python_dir = tmp / "python"
        native_dist.mkdir()

        env = os.environ.copy()
        env.update(
            {
                "UV_TOOL_DIR": str(tool_dir),
                "UV_TOOL_BIN_DIR": str(bin_dir),
                "UV_CACHE_DIR": str(cache_dir),
                "UV_PYTHON_INSTALL_DIR": str(python_dir),
            }
        )

        _run(["uv", "python", "install", "3.13"], env=env)
        _run(["uv", "build", "--wheel", "--out-dir", str(native_dist)], cwd=NATIVE, env=env)
        native_wheel = _single_wheel(native_dist, "native")

        legacy_index = _simple_index(tmp / "legacy-index", legacy_wheel)
        native_index = _simple_index(tmp / "native-index", native_wheel)

        # Exercise the real migration shape: the exact committed Python release wheel
        # becomes a uv tool first, then uv upgrades that same distribution to Rust.
        _run(
            [
                "uv",
                "tool",
                "install",
                "--force",
                "--python",
                "3.13",
                "pink",
                "--index",
                legacy_index,
            ],
            env=env,
        )
        executable = shutil.which("pink", path=str(bin_dir))
        if executable is None:
            raise SystemExit("legacy uv tool install did not expose a pink executable")
        legacy_result = _run([executable, "--version"], env=env)
        if legacy_version not in legacy_result.stdout:
            raise SystemExit(
                f"legacy Pink version mismatch: expected {legacy_version!r}, "
                f"got {legacy_result.stdout!r}"
            )

        _run(
            [
                "uv",
                "tool",
                "upgrade",
                "pink",
                "--index",
                native_index,
            ],
            env=env,
        )
        upgraded = shutil.which("pink", path=str(bin_dir))
        if upgraded is None:
            raise SystemExit("uv tool upgrade removed the pink executable")
        _assert_smoke(_run([upgraded, "packaging-smoke", "--json"], env=env), version)

        # Reinstall explicitly too; this catches stale launcher/wrapper behavior.
        _run(["uv", "tool", "install", "--force", str(native_wheel)], env=env)
        executable = shutil.which("pink", path=str(bin_dir))
        if executable is None:
            raise SystemExit("native uv tool reinstall did not expose a pink executable")

        version_result = _run([executable, "--version"], env=env)
        if version_result.stdout.strip() != f"pink {version}":
            raise SystemExit(f"unexpected --version output: {version_result.stdout!r}")

        _assert_smoke(_run([executable, "packaging-smoke", "--json"], env=env), version)
        _assert_smoke(
            _run(
                ["uvx", "--from", str(NATIVE), "pink", "packaging-smoke", "--json"],
                env=env,
            ),
            version,
        )
        _assert_smoke(
            _run(
                [
                    "uv",
                    "run",
                    "--project",
                    str(NATIVE),
                    "pink",
                    "packaging-smoke",
                    "--json",
                ],
                env=env,
            ),
            version,
        )

        _run(["uv", "tool", "uninstall", "pink"], env=env)
        if shutil.which("pink", path=str(bin_dir)) is not None:
            raise SystemExit("uv tool uninstall left a pink executable behind")

    print("rust packaging smoke: ok")


if __name__ == "__main__":
    main()
