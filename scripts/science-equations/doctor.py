#!/usr/bin/env python3
"""Scientific Equation Atlas — Local Data Plane Environment Doctor.

Verifies and audits all local dependencies, toolchains, credentials, disk space,
working directories, and network connectivity to integrated sources without
requiring GitHub Actions.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

# Use Windows native trust store when available
if sys.platform == "win32":
    try:
        import truststore
        truststore.inject_into_ssl()
    except ImportError:
        pass


def check_node(repo_root: Path) -> dict[str, Any]:
    pkg_json_path = repo_root / "package.json"
    req_str = ">=24.0.0"
    if pkg_json_path.exists():
        try:
            pkg = json.loads(pkg_json_path.read_text(encoding="utf-8"))
            req_str = pkg.get("engines", {}).get("node", req_str)
        except Exception:
            pass

    node_bin = shutil.which("node")
    if not node_bin:
        return {"status": "FAIL", "message": "node not found in PATH", "requirement": req_str}

    try:
        res = subprocess.run([node_bin, "--version"], capture_output=True, text=True, check=True)
        version_str = res.stdout.strip().lstrip("v")
        major = int(version_str.split(".")[0])
        req_major_match = re.search(r"\d+", req_str)
        req_major = int(req_major_match.group()) if req_major_match else 24
        if major >= req_major:
            return {"status": "OK", "version": version_str, "requirement": req_str}
        return {
            "status": "FAIL",
            "version": version_str,
            "requirement": req_str,
            "message": f"Node {version_str} is below required {req_str}",
        }
    except Exception as exc:
        return {"status": "FAIL", "message": str(exc), "requirement": req_str}


def check_python() -> dict[str, Any]:
    version_str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if sys.version_info >= (3, 10):
        return {"status": "OK", "version": version_str, "executable": sys.executable}
    return {
        "status": "FAIL",
        "version": version_str,
        "executable": sys.executable,
        "message": "Python >= 3.10 is required",
    }


def check_python_packages() -> dict[str, Any]:
    packages = {}
    # Pydantic v2
    try:
        import pydantic
        p_ver = getattr(pydantic, "__version__", "unknown")
        major = int(p_ver.split(".")[0]) if p_ver != "unknown" else 0
        if major >= 2:
            packages["pydantic"] = {"status": "OK", "version": p_ver}
        else:
            packages["pydantic"] = {"status": "FAIL", "version": p_ver, "message": "Pydantic v2 is required"}
    except ImportError:
        packages["pydantic"] = {"status": "FAIL", "message": "pydantic not installed"}

    # PyArrow
    try:
        import pyarrow
        packages["pyarrow"] = {"status": "OK", "version": getattr(pyarrow, "__version__", "installed")}
    except ImportError:
        packages["pyarrow"] = {"status": "FAIL", "message": "pyarrow not installed"}

    # internetarchive python package
    try:
        import internetarchive
        packages["internetarchive"] = {"status": "OK", "version": getattr(internetarchive, "__version__", "installed")}
    except ImportError:
        packages["internetarchive"] = {"status": "WARN", "message": "internetarchive python package not installed"}

    return packages


def check_ia_cli() -> dict[str, Any]:
    ia_bin = shutil.which("ia") or shutil.which("ia.exe")
    if not ia_bin:
        return {"status": "FAIL", "message": "ia executable not found in PATH (install via `uv tool install internetarchive`)"}
    try:
        res = subprocess.run([ia_bin, "--version"], capture_output=True, text=True, check=True)
        version_str = res.stdout.strip() or res.stderr.strip()
        return {"status": "OK", "version": version_str, "executable": ia_bin}
    except Exception as exc:
        return {"status": "FAIL", "executable": ia_bin, "message": str(exc)}


def check_ia_credentials() -> dict[str, Any]:
    key_id = os.environ.get("IA_ACCESS_KEY_ID")
    secret = os.environ.get("IA_SECRET_ACCESS_KEY")
    has_env = bool(key_id and secret)

    # Check ~/.ia config file
    has_config = False
    ia_config_path = Path.home() / ".ia"
    if ia_config_path.exists():
        try:
            content = ia_config_path.read_text(encoding="utf-8")
            if "access" in content and "secret" in content:
                has_config = True
        except Exception:
            pass

    if has_env:
        return {
            "status": "OK",
            "source": "environment",
            "configured": True,
            "message": "IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY configured in environment",
        }
    if has_config:
        return {
            "status": "OK",
            "source": "config_file",
            "configured": True,
            "message": "Configured in ~/.ia file",
        }

    return {
        "status": "WARN",
        "configured": False,
        "message": "IA credentials missing in environment (required for Internet Archive upload/publish)",
    }


def check_ia_connectivity() -> dict[str, Any]:
    url = "https://archive.org/metadata/test_collection"
    req = urllib.request.Request(url, headers={"User-Agent": "ScientificEquationAtlas-Doctor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                return {"status": "OK", "http_status": resp.status}
            return {"status": "FAIL", "http_status": resp.status}
    except Exception as exc:
        return {"status": "FAIL", "message": str(exc)}


def check_okf_parser(repo_root: Path) -> dict[str, Any]:
    okf_bin = shutil.which("okf-parser") or shutil.which("okf-parser.exe")
    if not okf_bin:
        # Check python -m okf_parser
        try:
            import okf_parser
            ver = getattr(okf_parser, "__version__", "installed")
            okf_bin = f"{sys.executable} -m okf_parser"
            return {"status": "OK", "version": ver, "invocation": okf_bin}
        except ImportError:
            return {"status": "FAIL", "message": "okf-parser executable or python package not found"}

    try:
        res = subprocess.run([okf_bin, "--version"], capture_output=True, text=True, check=True)
        version_str = res.stdout.strip() or res.stderr.strip()
        return {"status": "OK", "version": version_str, "executable": okf_bin}
    except Exception as exc:
        return {"status": "FAIL", "executable": okf_bin, "message": str(exc)}


def check_git(repo_root: Path) -> dict[str, Any]:
    git_bin = shutil.which("git")
    if not git_bin:
        return {"status": "FAIL", "message": "git not found in PATH"}

    try:
        # Check remote
        res = subprocess.run([git_bin, "-C", str(repo_root), "remote", "-v"], capture_output=True, text=True, check=True)
        remotes = res.stdout.strip().splitlines()
        token_found = False
        for r in remotes:
            if re.search(r"https://[^@]+@github\.com", r):
                token_found = True
                break

        # Check clean tree
        status_res = subprocess.run([git_bin, "-C", str(repo_root), "status", "--porcelain"], capture_output=True, text=True, check=True)
        clean = len(status_res.stdout.strip()) == 0

        # Branch
        branch_res = subprocess.run([git_bin, "-C", str(repo_root), "branch", "--show-current"], capture_output=True, text=True, check=True)
        branch = branch_res.stdout.strip()

        return {
            "status": "OK" if not token_found else "WARN",
            "branch": branch,
            "clean_working_tree": clean,
            "embedded_token_in_remote": token_found,
            "remotes": [r.split()[1] for r in remotes if "origin" in r and "(push)" in r] or remotes,
        }
    except Exception as exc:
        return {"status": "FAIL", "message": str(exc)}


def check_gh() -> dict[str, Any]:
    gh_bin = shutil.which("gh")
    if not gh_bin:
        return {"status": "WARN", "message": "gh CLI not found in PATH"}

    try:
        res = subprocess.run([gh_bin, "auth", "status"], capture_output=True, text=True)
        out = (res.stdout + res.stderr).strip()
        logged_in = "Logged in to" in out or "✓" in out
        user_match = re.search(r"account\s+([A-Za-z0-9_-]+)", out)
        account = user_match.group(1) if user_match else "unknown"
        if logged_in:
            return {"status": "OK", "account": account}
        return {"status": "WARN", "message": "gh not authenticated"}
    except Exception as exc:
        return {"status": "WARN", "message": str(exc)}


def check_disk_space(data_root: Path) -> dict[str, Any]:
    try:
        target = data_root if data_root.exists() else data_root.parent
        total, used, free = shutil.disk_usage(target)
        free_gb = free / (1024**3)
        total_gb = total / (1024**3)
        status = "OK" if free_gb >= 5.0 else ("WARN" if free_gb >= 1.0 else "ALERT_LOW_SPACE")
        return {
            "status": status,
            "path": str(data_root),
            "free_gb": round(free_gb, 2),
            "total_gb": round(total_gb, 2),
            "free_mb": round(free / (1024**2), 1),
            "note": "Low free disk space on drive; use streaming/shards or external executor for multi-GB dumps" if free_gb < 2.0 else "Sufficient disk space",
        }
    except Exception as exc:
        return {"status": "WARN", "message": str(exc)}


def check_work_directories(data_root: Path, create: bool = True) -> dict[str, Any]:
    subdirs = ["downloads", "work", "parquet", "manifests", "logs"]
    created = []
    existed = []
    for sub in subdirs:
        p = data_root / sub
        if p.exists():
            existed.append(sub)
        elif create:
            p.mkdir(parents=True, exist_ok=True)
            created.append(sub)

    return {
        "status": "OK",
        "data_root": str(data_root),
        "existing_subdirectories": existed,
        "created_subdirectories": created,
    }


def check_bulk_tools() -> dict[str, Any]:
    tools = {}
    # curl
    curl = shutil.which("curl.exe") or shutil.which("curl")
    tools["curl"] = {"status": "OK" if curl else "WARN", "path": curl}

    # 7z / bzip2 / gzip / xz
    seven_zip = shutil.which("7z.exe") or shutil.which("7z")
    bzip2 = shutil.which("bzip2")
    gzip = shutil.which("gzip")
    xz = shutil.which("xz")
    has_decompression = bool(seven_zip or bzip2 or gzip or xz)
    tools["decompression"] = {
        "status": "OK" if has_decompression else "WARN",
        "7z": seven_zip,
        "bzip2": bzip2,
        "gzip": gzip,
        "xz": xz,
    }

    # DuckDB
    duckdb_bin = shutil.which("duckdb") or shutil.which("duckdb.exe")
    tools["duckdb"] = {"status": "OK" if duckdb_bin else "INFO", "path": duckdb_bin}

    # aws
    aws_bin = shutil.which("aws") or shutil.which("aws.exe")
    tools["aws"] = {"status": "OK" if aws_bin else "INFO", "path": aws_bin}

    # psql
    psql_bin = shutil.which("psql") or shutil.which("psql.exe")
    tools["psql"] = {"status": "OK" if psql_bin else "INFO", "path": psql_bin}

    # rsync
    rsync_bin = shutil.which("rsync")
    tools["rsync"] = {"status": "OK" if rsync_bin else "INFO", "path": rsync_bin}

    return tools


def check_sources(repo_root: Path) -> dict[str, Any]:
    sources_dir = repo_root / "data" / "science-equations" / "sources"
    manifests_dir = repo_root / "data" / "science-equations" / "manifests"

    discovered: dict[str, dict[str, Any]] = {}

    def extract_urls(data: Any) -> list[str]:
        urls = []
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, str) and v.startswith("http"):
                    urls.append(v)
                elif isinstance(v, (dict, list)):
                    urls.extend(extract_urls(v))
        elif isinstance(data, list):
            for item in data:
                urls.extend(extract_urls(item))
        return urls

    if sources_dir.exists():
        for path in sorted(sources_dir.glob("*.json")):
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
                sid = content.get("source_id", path.stem)
                discovered[sid] = {
                    "source_id": sid,
                    "descriptor_path": str(path.relative_to(repo_root)),
                    "source_name": content.get("source_name", sid),
                    "readiness": content.get("readiness", "unknown"),
                    "urls": extract_urls(content.get("official_access", {})),
                }
            except Exception as exc:
                discovered[path.stem] = {"descriptor_path": str(path.relative_to(repo_root)), "error": str(exc)}

    if manifests_dir.exists():
        for path in sorted(manifests_dir.glob("*.json")):
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
                sid = content.get("source_id", path.stem)
                if sid not in discovered:
                    discovered[sid] = {
                        "source_id": sid,
                        "manifest_path": str(path.relative_to(repo_root)),
                        "source_name": content.get("source_name", sid),
                        "readiness": content.get("readiness", "unknown"),
                        "urls": extract_urls(content),
                    }
            except Exception:
                pass

    # Test basic connectivity for discovered source URLs (limit to 1-2 per source)
    for sid, info in discovered.items():
        endpoints = info.get("urls", [])
        tested = []
        for url in endpoints[:2]:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ScientificEquationAtlas/Doctor)"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    tested.append({"url": url, "status": resp.status, "connectivity": "OK"})
            except Exception as exc:
                tested.append({"url": url, "error": str(exc), "connectivity": "FAIL"})
        info["connectivity_checks"] = tested

    return discovered


def main() -> int:
    parser = argparse.ArgumentParser(description="Scientific Equation Atlas local data plane doctor")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--data-root", type=Path, default=None, help="Root directory for external atlas datasets")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    data_root = args.data_root or Path(os.environ.get("ATLAS_DATA_ROOT", Path.home() / "data" / "scientific-equation-atlas"))

    report: dict[str, Any] = {
        "node": check_node(repo_root),
        "python": check_python(),
        "python_packages": check_python_packages(),
        "ia_cli": check_ia_cli(),
        "ia_credentials": check_ia_credentials(),
        "ia_connectivity": check_ia_connectivity(),
        "okf_parser": check_okf_parser(repo_root),
        "disk_space": check_disk_space(data_root),
        "work_directories": check_work_directories(data_root),
        "git": check_git(repo_root),
        "gh": check_gh(),
        "bulk_tools": check_bulk_tools(),
        "sources": check_sources(repo_root),
    }

    critical_failures = []
    if report["node"]["status"] == "FAIL":
        critical_failures.append(f"Node: {report['node'].get('message')}")
    if report["python"]["status"] == "FAIL":
        critical_failures.append(f"Python: {report['python'].get('message')}")
    for pkg, pinfo in report["python_packages"].items():
        if pinfo["status"] == "FAIL":
            critical_failures.append(f"Python package {pkg}: {pinfo.get('message')}")
    if report["ia_cli"]["status"] == "FAIL":
        critical_failures.append(f"IA CLI: {report['ia_cli'].get('message')}")
    if report["okf_parser"]["status"] == "FAIL":
        critical_failures.append(f"okf-parser: {report['okf_parser'].get('message')}")

    all_ok = len(critical_failures) == 0
    report["all_critical_ok"] = all_ok
    report["critical_failures"] = critical_failures

    if args.json:
        print(json.dumps(report, indent=2))
        return 0

    print("=" * 60)
    print("Scientific Equation Atlas — Local Data Plane Doctor")
    print("=" * 60)
    print(f"Repository root : {repo_root}")
    print(f"Data root       : {data_root}")
    print(f"Disk free space : {report['disk_space'].get('free_gb', '?')} GB ({report['disk_space']['status']})")
    print(f"Node.js         : {report['node'].get('version', 'FAIL')} ({report['node']['status']})")
    print(f"Python          : {report['python'].get('version', 'FAIL')} ({report['python']['status']})")

    pkgs = report["python_packages"]
    p_status = ", ".join(f"{k} {v.get('version', v['status'])}" for k, v in pkgs.items())
    print(f"Python packages : {p_status}")

    ia_cli = report["ia_cli"]
    print(f"ia CLI          : {ia_cli.get('version', ia_cli['status'])} ({ia_cli['status']})")

    ia_cred = report["ia_credentials"]
    print(f"IA credentials  : {ia_cred['message']} [{ia_cred['status']}]")

    ia_conn = report["ia_connectivity"]
    print(f"IA public API   : HTTP {ia_conn.get('http_status', 'FAIL')} ({ia_conn['status']})")

    okf = report["okf_parser"]
    print(f"okf-parser      : {okf.get('version', okf['status'])} ({okf['status']})")

    git_info = report["git"]
    print(f"Git branch      : {git_info.get('branch')} (Clean: {git_info.get('clean_working_tree')}, Token in URL: {git_info.get('embedded_token_in_remote')})")

    gh_info = report["gh"]
    print(f"GitHub (gh)     : {gh_info.get('account', gh_info['status'])} ({gh_info['status']})")

    tools = report["bulk_tools"]
    tools_str = f"curl: {'OK' if tools['curl']['path'] else 'MISSING'}, 7z/decomp: {'OK' if tools['decompression']['status']=='OK' else 'MISSING'}, duckdb: {'OK' if tools['duckdb']['path'] else 'MISSING'}"
    print(f"Bulk tools      : {tools_str}")

    print("\nIntegrated Sources:")
    for sid, sinfo in report["sources"].items():
        checks = sinfo.get("connectivity_checks", [])
        conn_str = ", ".join(f"{c['url']}: {c['connectivity']}" for c in checks) or "No URL checks"
        print(f"  • {sid} ({sinfo.get('readiness', 'unknown')}): {conn_str}")

    print("=" * 60)
    if all_ok:
        print("RESULT: Core data plane toolchain is READY.")
        if not report["ia_credentials"]["configured"]:
            print("NOTE: Internet Archive credentials not configured; publication to IA will fail-closed until keys are set.")
        return 0
    else:
        print("RESULT: Missing critical data plane dependencies:")
        for fail in critical_failures:
            print(f"  ❌ {fail}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
