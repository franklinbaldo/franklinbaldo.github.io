#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Audiobook Factory media worker.

The worker deliberately has no editorial intelligence. It receives an already
validated TTS plan and turns each request into audio through a selected backend.

The script declares no PEP 723 dependencies on purpose: the `fake` backend is
stdlib-only, and the `breeze` backend must install its pinned stack into the
interpreter that is actually running, because on a hosted GPU box the CUDA build
of torch has to match that image's driver.

`fake` produces deterministic WAV tones for CI. `breeze` bootstraps a pinned
Breeze TTS 2 runtime, loads the model once, then synthesizes all segments through
its official streaming API. Remote runners therefore execute the same worker
without notebooks or provider-specific editorial logic.
"""

from __future__ import annotations

import argparse
from contextlib import suppress
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import shutil
import socket
import struct
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import wave
import zipfile

PLAN_SCHEMA = "audiobook-tts-plan-v1"
MANIFEST_SCHEMA = "audiobook-media-manifest-v1"

BREEZE_CODE_REPOSITORY = "https://github.com/breezeblue-ai/breeze-tts.git"
BREEZE_CODE_REVISION = "ca632ce6c4d05f7985da4eab29b1a5d445b43f7b"
BREEZE_MODEL_REPOSITORY = "BreezeBlue/Breeze-TTS-2"
BREEZE_MODEL_REVISION = "a3bd0a6e83cd2d046ce783df2f7cb84292869ef7"

# Breeze pins `torch==2.9.1` but does not pin `torchvision`. Hosted GPU images
# (Kaggle, Colab) ship a `torchvision` built against their own older torch, and
# `transformers` imports it eagerly, so upgrading torch alone breaks the import
# with `operator torchvision::nms does not exist`. Install the matching release.
BREEZE_TORCHVISION = "torchvision==0.24.1"

VOXCPM_PACKAGE = "voxcpm==2.0.3"
VOXCPM_MODEL_REPOSITORY = "openbmb/VoxCPM2"

KOKORO_PACKAGE = "kokoro>=0.9"
KOKORO_MODEL_REPOSITORY = "hexgrad/Kokoro-82M"
KOKORO_LANG_CODE = "p"  # misaki's Brazilian Portuguese phonemisation
# Reading a paragraph in a single call was judged worse than splitting it per
# clause, with the same voice and the same text, in the pt-BR listening test.
KOKORO_SPLIT_PATTERN = r"(?<=[.;])\s+"

# Audiobook loudness target. VoxCPM2 varies its own output level by as much
# as 17 dB across segments — asking for emphasis raises the gain, not just the
# interpretation — so segments are normalized before they are written. The
# window is the one audiobook distributors ask for: RMS in [-23, -18] dBFS
# with true peaks no hotter than -3 dBFS.
TARGET_RMS_DBFS = -20.0
TARGET_PEAK_CEILING_DBFS = -3.0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def load_plan(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as stream:
        plan = json.load(stream)
    if plan.get("schema") != PLAN_SCHEMA:
        raise ValueError(f"unsupported plan schema: {plan.get('schema')!r}")
    if not plan.get("work_id") or not plan.get("chapter_id"):
        raise ValueError("plan requires work_id and chapter_id")
    segments = plan.get("segments")
    if not isinstance(segments, list) or not segments:
        raise ValueError("plan requires a non-empty segments array")
    return plan


def hardware_info() -> dict:
    result = {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "gpu": None,
    }
    try:
        completed = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if completed.returncode == 0 and completed.stdout.strip():
            result["gpu"] = completed.stdout.strip().splitlines()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return result


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def stable_voice_seed(segment: dict) -> int:
    identity = {
        "speaker": segment["speaker"],
        "voice": segment.get("voice", {}),
    }
    digest = hashlib.sha256(canonical_json(identity).encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") & 0x7FFFFFFF


def write_pcm16_wav(output_path: Path, pcm: bytes, sample_rate: int) -> dict:
    if sample_rate <= 0:
        raise ValueError(f"invalid sample rate: {sample_rate}")
    if not pcm or len(pcm) % 2:
        raise ValueError("backend returned invalid signed 16-bit PCM")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        stream.writeframes(pcm)

    frames = len(pcm) // 2
    return {
        "duration_ms": round(frames * 1000 / sample_rate),
        "sample_rate": sample_rate,
        "audio_digest": sha256_file(output_path),
    }


def normalize_to_pcm16(audio) -> tuple[bytes, float]:
    """Bring one segment to the audiobook loudness window and pack it as PCM16.

    Generative TTS sets its own level: across the pt-BR benchmark VoxCPM2 spread
    17 dB of RMS between segments, and 18 of 41 clips peaked hotter than the
    -3 dBFS ceiling distributors ask for. Concatenating that as-is produces an
    audiobook whose volume moves under the listener, so each segment is scaled
    to `TARGET_RMS_DBFS` and then pulled back if that would breach the ceiling.

    Returns the little-endian signed 16-bit frames and the gain that was applied,
    which the manifest records so a suspicious segment can be traced.
    """
    samples = [float(value) for value in audio]
    if not samples:
        raise ValueError("backend returned no audio")

    rms = math.sqrt(sum(value * value for value in samples) / len(samples))
    peak = max(abs(value) for value in samples)
    if rms <= 0 or peak <= 0:
        raise ValueError("backend returned silence")

    gain = 10 ** (TARGET_RMS_DBFS / 20) / rms
    ceiling = 10 ** (TARGET_PEAK_CEILING_DBFS / 20)
    if peak * gain > ceiling:
        gain = ceiling / peak

    scaled = bytearray()
    for value in samples:
        clamped = max(-1.0, min(1.0, value * gain))
        scaled += struct.pack("<h", int(round(clamped * 32767)))
    return bytes(scaled), round(20 * math.log10(gain), 2)


def fake_synthesize(segment: dict, output_path: Path) -> dict:
    """Write deterministic audible proof-of-pipeline audio for one segment."""

    seed = hashlib.sha256(segment["input_digest"].encode("utf-8")).digest()
    sample_rate = 16_000
    duration_ms = 220 + seed[0]
    frequency = 220 + seed[1] * 2
    frames = round(sample_rate * duration_ms / 1000)
    amplitude = 0.12 * 32767

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        for index in range(frames):
            sample = int(
                amplitude
                * math.sin(2 * math.pi * frequency * index / sample_rate)
            )
            stream.writeframesraw(struct.pack("<h", sample))

    return {
        "duration_ms": duration_ms,
        "sample_rate": sample_rate,
        "audio_digest": sha256_file(output_path),
    }


class FakeBackend:
    metadata = {"implementation": "deterministic-tone-v1"}

    def synthesize(self, segment: dict, output_path: Path) -> dict:
        return fake_synthesize(segment, output_path)

    def close(self) -> None:
        pass


def run_checked(args: list[str], *, cwd: Path | None = None) -> str:
    completed = subprocess.run(
        args,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise RuntimeError(
            f"command failed ({completed.returncode}): {' '.join(args)}\n"
            f"{completed.stderr or completed.stdout}"
        )
    return completed.stdout.strip()


def ensure_breeze_source(cache_dir: Path, revision: str) -> Path:
    source_dir = cache_dir / "source" / f"breeze-tts-{revision[:12]}"
    if source_dir.exists():
        head = run_checked(["git", "rev-parse", "HEAD"], cwd=source_dir)
        if head != revision:
            raise RuntimeError(
                f"cached Breeze source revision mismatch: {head} != {revision}"
            )
        return source_dir

    source_dir.parent.mkdir(parents=True, exist_ok=True)
    run_checked(
        [
            "git",
            "clone",
            "--filter=blob:none",
            "--no-checkout",
            BREEZE_CODE_REPOSITORY,
            str(source_dir),
        ]
    )
    run_checked(["git", "checkout", "--detach", revision], cwd=source_dir)
    return source_dir


def install_breeze_dependencies(source_dir: Path) -> None:
    if os.environ.get("AUDIOBOOK_SKIP_BACKEND_INSTALL") == "1":
        return
    run_checked(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "-r",
            str(source_dir / "requirements.txt"),
            BREEZE_TORCHVISION,
        ]
    )


def resolve_breeze_model(
    model: str,
    *,
    cache_dir: Path,
    revision: str,
) -> Path:
    candidate = Path(model).expanduser()
    if candidate.exists():
        return candidate.resolve()

    script = (
        "from huggingface_hub import snapshot_download; "
        "import sys; "
        "print(snapshot_download(repo_id=sys.argv[1], revision=sys.argv[2], "
        "cache_dir=sys.argv[3]))"
    )
    model_path = run_checked(
        [
            sys.executable,
            "-c",
            script,
            model,
            revision,
            str(cache_dir / "huggingface"),
        ]
    )
    return Path(model_path.splitlines()[-1]).resolve()


def flash_attention_available() -> bool:
    """Whether this box can actually run FlashAttention 2.

    The package only builds kernels for Ampere and newer (compute capability
    8.0+), so a T4 (7.5) can never satisfy it regardless of installation.
    """
    probe = (
        "import sys, torch, importlib.util;"
        "ok = importlib.util.find_spec('flash_attn') is not None"
        " and torch.cuda.is_available()"
        " and torch.cuda.get_device_capability(0)[0] >= 8;"
        "sys.exit(0 if ok else 1)"
    )
    completed = subprocess.run(
        [sys.executable, "-c", probe], check=False, capture_output=True
    )
    return completed.returncode == 0


def link_or_copy(source: Path, target: Path) -> None:
    """Materialize `source` at `target` as cheaply as the platform allows.

    Symlinks are the cheapest but need a privilege Windows does not grant by
    default; hard links fail across filesystems. Copying always works and is the
    last resort.
    """
    for attempt in (target.symlink_to, target.hardlink_to):
        try:
            attempt(source.resolve())
            return
        except (OSError, NotImplementedError):
            continue
    shutil.copyfile(source, target)


def prepare_breeze_checkpoint(snapshot_dir: Path, cache_dir: Path) -> tuple[Path, str]:
    """Return a checkpoint directory whose attention backend this GPU supports.

    Breeze's checkpoint sets `text_encoder_config.preferred_attn_implementation`
    to `flash_attention_2`, and the text encoder honours it even when the caller
    asks for eager attention, so loading the model on a pre-Ampere GPU dies with
    `FlashAttention2 has been toggled on, but it cannot be used`.

    The Hugging Face snapshot is content-addressed by revision and must stay
    byte-identical, so instead of editing it we build a sibling directory that
    symlinks every file and carries a rewritten `config.json`. The pin is
    preserved; only the attention backend differs, and the manifest records it.
    """
    requested = os.environ.get("BREEZE_TEXT_ENCODER_ATTENTION")
    if not requested:
        if flash_attention_available():
            return snapshot_dir, "flash_attention_2"
        requested = "eager"

    config_path = snapshot_dir / "config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if config.get("text_encoder_config", {}).get(
        "preferred_attn_implementation"
    ) == requested:
        return snapshot_dir, requested

    overlay = cache_dir / "checkpoints" / f"{snapshot_dir.name}-{requested}"
    if not overlay.exists():
        staging = overlay.with_name(f"{overlay.name}.partial")
        if staging.exists():
            raise RuntimeError(f"stale Breeze checkpoint overlay: {staging}")
        for source in snapshot_dir.rglob("*"):
            if source.is_dir():
                continue
            relative = source.relative_to(snapshot_dir)
            target = staging / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            # Only the top-level config.json is rewritten. Nested ones, notably
            # audio_tokenizer/config.json, must be linked like any other file.
            if relative != Path("config.json"):
                link_or_copy(source, target)
        config.setdefault("text_encoder_config", {})[
            "preferred_attn_implementation"
        ] = requested
        (staging / "config.json").write_text(
            json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        staging.rename(overlay)
    return overlay, requested


def free_local_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def voice_instruction(segment: dict) -> str:
    voice = segment.get("voice") or {}
    direction = segment.get("direction") or {}
    pieces = []

    description = voice.get("description")
    if description:
        pieces.append(str(description).strip())
    locale = voice.get("locale")
    if locale:
        pieces.append(f"Fale naturalmente no idioma e variante {locale}.")

    labels = {
        "emotion": "Emoção",
        "pace": "Ritmo",
        "pitch": "Altura",
        "energy": "Energia",
        "style": "Estilo",
        "delivery": "Interpretação",
    }
    for key, value in direction.items():
        label = labels.get(key, key.replace("_", " ").capitalize())
        pieces.append(f"{label}: {value}.")

    return " ".join(piece for piece in pieces if piece).strip() or (
        "Fale com clareza, naturalidade e interpretação apropriada ao texto."
    )


class BreezeBackend:
    def __init__(self, model: str, output_dir: Path) -> None:
        self.code_revision = os.environ.get(
            "BREEZE_CODE_REVISION", BREEZE_CODE_REVISION
        )
        self.model_revision = os.environ.get(
            "BREEZE_MODEL_REVISION", BREEZE_MODEL_REVISION
        )
        self.cache_dir = Path(
            os.environ.get(
                "AUDIOBOOK_MODEL_CACHE",
                str(Path.home() / ".cache" / "audiobook-factory"),
            )
        ).expanduser()
        self.source_dir = ensure_breeze_source(self.cache_dir, self.code_revision)
        install_breeze_dependencies(self.source_dir)
        snapshot_dir = resolve_breeze_model(
            model,
            cache_dir=self.cache_dir,
            revision=self.model_revision,
        )
        self.model_path, self.text_encoder_attention = prepare_breeze_checkpoint(
            snapshot_dir, self.cache_dir
        )
        self.port = free_local_port()
        self.base_url = f"http://127.0.0.1:{self.port}"
        output_dir.mkdir(parents=True, exist_ok=True)
        self.log_path = output_dir / "breeze-runtime.log"
        self.log_stream = self.log_path.open("w", encoding="utf-8")
        self.process = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "breeze_infer.api",
                str(self.model_path),
                "--host",
                "127.0.0.1",
                "--port",
                str(self.port),
            ],
            cwd=self.source_dir,
            stdout=self.log_stream,
            stderr=subprocess.STDOUT,
            text=True,
        )
        self.sample_rate = self._wait_until_ready()
        self.metadata = {
            "code_repository": BREEZE_CODE_REPOSITORY,
            "code_revision": self.code_revision,
            "model_repository": model,
            "model_revision": self.model_revision,
            "api": "official-streaming-v1",
            "text_encoder_attn_implementation": self.text_encoder_attention,
            "sample_rate": self.sample_rate,
            "cfg_scale": float(os.environ.get("BREEZE_CFG_SCALE", "4")),
        }

    def _wait_until_ready(self) -> int:
        deadline = time.monotonic() + float(
            os.environ.get("BREEZE_START_TIMEOUT", "1200")
        )
        last_error = "not started"
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                self.log_stream.flush()
                tail = self.log_path.read_text(encoding="utf-8", errors="replace")[-8000:]
                raise RuntimeError(
                    f"Breeze runtime exited during startup ({self.process.returncode}):\n{tail}"
                )
            try:
                with urlopen(f"{self.base_url}/health", timeout=5) as response:
                    payload = json.load(response)
                if payload.get("status") == "ok":
                    return int(payload["sample_rate"])
            except (HTTPError, URLError, TimeoutError, ValueError) as error:
                last_error = str(error)
            time.sleep(2)
        raise TimeoutError(f"Breeze runtime did not become ready: {last_error}")

    def synthesize(self, segment: dict, output_path: Path) -> dict:
        seed = stable_voice_seed(segment)
        instruction = voice_instruction(segment)
        cfg_scale = float(os.environ.get("BREEZE_CFG_SCALE", "4"))
        body = urlencode(
            {
                "text": segment["text"],
                "instruction": instruction,
                "cfg_scale": str(cfg_scale),
                "seed": str(seed),
            }
        ).encode("utf-8")
        request = Request(
            f"{self.base_url}/v1/audio/speech",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        try:
            with urlopen(
                request,
                timeout=float(os.environ.get("BREEZE_REQUEST_TIMEOUT", "900")),
            ) as response:
                pcm = response.read()
                sample_rate = int(
                    response.headers.get("X-Sample-Rate", str(self.sample_rate))
                )
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Breeze synthesis failed with HTTP {error.code}: {detail}"
            ) from error

        generated = write_pcm16_wav(output_path, pcm, sample_rate)
        return {
            **generated,
            "seed": seed,
            "instruction": instruction,
            "cfg_scale": cfg_scale,
        }

    def close(self) -> None:
        if getattr(self, "process", None) is not None:
            self.process.terminate()
            with suppress(subprocess.TimeoutExpired):
                self.process.wait(timeout=15)
            if self.process.poll() is None:
                self.process.kill()
                self.process.wait(timeout=10)
        if getattr(self, "log_stream", None) is not None:
            self.log_stream.close()


class VoxCpmBackend:
    """VoxCPM2: tokenizer-free diffusion TTS with natural-language voice design.

    The voice description and the per-segment direction are compiled into a
    single parenthetical prefix on the text, which is how this model takes its
    style instruction. Nothing else about the plan changes, so the same
    `plan.json` drives this backend and Breeze alike.
    """

    def __init__(self, model: str, output_dir: Path) -> None:
        if os.environ.get("AUDIOBOOK_SKIP_BACKEND_INSTALL") != "1":
            run_checked(
                [
                    sys.executable, "-m", "pip", "install",
                    "--disable-pip-version-check", VOXCPM_PACKAGE,
                ]
            )
        from voxcpm import VoxCPM

        self.cfg_value = float(os.environ.get("VOXCPM_CFG_VALUE", "2"))
        self.timesteps = int(os.environ.get("VOXCPM_TIMESTEPS", "10"))
        self.model = VoxCPM.from_pretrained(model, load_denoiser=False)
        self.sample_rate = int(self.model.tts_model.sample_rate)
        self.metadata = {
            "package": VOXCPM_PACKAGE,
            "model_repository": model,
            "api": "voxcpm-generate",
            "sample_rate": self.sample_rate,
            "cfg_value": self.cfg_value,
            "inference_timesteps": self.timesteps,
            "loudness_target_dbfs": TARGET_RMS_DBFS,
        }

    def synthesize(self, segment: dict, output_path: Path) -> dict:
        instruction = voice_instruction(segment)
        prompt = f"({instruction}){segment['text']}"
        audio = self.model.generate(
            text=prompt,
            cfg_value=self.cfg_value,
            inference_timesteps=self.timesteps,
        )
        pcm, gain_db = normalize_to_pcm16(audio)
        generated = write_pcm16_wav(output_path, pcm, self.sample_rate)
        return {
            **generated,
            "instruction": instruction,
            "cfg_value": self.cfg_value,
            "gain_applied_db": gain_db,
        }

    def close(self) -> None:
        self.model = None


# Kokoro takes no style prompt: `voice`, `speed` and `split_pattern` are its
# entire control surface. But a voice is a 256-dimension style tensor, and in
# StyleTTS2 that tensor carries affect as well as timbre, so an emotion can be
# approximated by moving through voice space instead of by instruction.
#
# These presets were rated by ear against the pt-BR corpus. Only the ones judged
# good are enabled by default; two more are kept as provisional, and the two that
# were judged bad are deliberately absent until they are redesigned.
KOKORO_EMOTIONS = {
    "neutro": {"voices": [("pm_alex", 1.0)], "speed": 1.00, "gain_db": 0.0},
    "medo": {"voices": [("pm_alex", 0.70), ("pf_dora", 0.30)], "speed": 1.15, "gain_db": -2.0},
    "raiva": {"voices": [("pm_alex", 0.70), ("am_onyx", 0.30)], "speed": 1.10, "gain_db": 2.0},
    "ternura": {"voices": [("pm_alex", 0.60), ("pf_dora", 0.40)], "speed": 0.90, "gain_db": -3.0},
    "sussurro": {"voices": [("pm_alex", 1.0)], "speed": 0.92, "gain_db": -12.0,
                 "provisional": True},
    "solene": {"voices": [("pm_alex", 0.70), ("pm_santa", 0.30)], "speed": 0.82, "gain_db": 0.0,
               "provisional": True},
}

# `[emocao] ... [/emocao]` and `<speaker:name> ... </speaker:name>` select the
# configuration for the span that follows. The tag never reaches the model:
# Kokoro pronounces whatever is left in the text, down to the word "asterisco".
KOKORO_SPAN = re.compile(
    r"\[(/?)([A-Za-z\u00c0-\u017f]+)\]|<(/?)speaker:([A-Za-z0-9_-]+)>"
)


class KokoroBackend:
    """Kokoro-82M: fast, permissively licensed, steered entirely through voice space."""

    def __init__(self, model: str, output_dir: Path) -> None:
        if os.environ.get("AUDIOBOOK_SKIP_BACKEND_INSTALL") != "1":
            run_checked([sys.executable, "-m", "pip", "install",
                         "--disable-pip-version-check", KOKORO_PACKAGE])
        from kokoro import KPipeline

        self.pipeline = KPipeline(lang_code=KOKORO_LANG_CODE)
        self.sample_rate = 24000
        self.split_pattern = os.environ.get("KOKORO_SPLIT_PATTERN", KOKORO_SPLIT_PATTERN)
        self._blends = {}
        self.metadata = {
            "package": KOKORO_PACKAGE,
            "model_repository": model,
            "lang_code": KOKORO_LANG_CODE,
            "split_pattern": self.split_pattern,
            "sample_rate": self.sample_rate,
            "emotions": sorted(KOKORO_EMOTIONS),
        }

    def _blend(self, voices):
        """Weighted sum of style tensors; a lone voice is used unchanged."""
        key = tuple(voices)
        if key not in self._blends:
            import torch

            packs = [self.pipeline.load_single_voice(name) * weight
                     for name, weight in voices]
            self._blends[key] = torch.stack(packs).sum(dim=0)
        return self._blends[key]

    def _speak(self, text, preset):
        import numpy as np

        parts = [np.asarray(audio) for _, _, audio in self.pipeline(
            text, voice=self._blend(preset["voices"]), speed=preset["speed"],
            split_pattern=self.split_pattern)]
        if not parts:
            raise ValueError(f"kokoro produced no audio for: {text[:60]!r}")
        return np.concatenate(parts) * (10 ** (preset["gain_db"] / 20))

    def _preset_for(self, segment, emotion, speaker):
        preset = dict(KOKORO_EMOTIONS.get(emotion or "", KOKORO_EMOTIONS["neutro"]))
        if speaker:
            # A speaker span replaces the voice outright; emotion still applies.
            preset["voices"] = [(speaker, 1.0)]
            return preset
        config = (segment.get("voice") or {}).get("kokoro") or {}
        named = config.get("voice")
        if named:
            preset["voices"] = (
                [(item["name"], float(item["weight"])) for item in named]
                if isinstance(named, list) else [(named, 1.0)]
            )
        if config.get("speed") is not None:
            preset["speed"] = float(config["speed"])
        return preset

    def _spans(self, text):
        spans, cursor, emotion, speaker = [], 0, None, None
        for match in KOKORO_SPAN.finditer(text):
            chunk = text[cursor:match.start()].strip()
            if chunk:
                spans.append((emotion, speaker, chunk))
            if match.group(2) is not None:
                emotion = None if match.group(1) else match.group(2).lower()
            else:
                speaker = None if match.group(3) else match.group(4).lower()
            cursor = match.end()
        tail = text[cursor:].strip()
        if tail:
            spans.append((emotion, speaker, tail))
        return spans

    def synthesize(self, segment, output_path):
        import numpy as np

        spans = self._spans(segment["text"])
        if not spans:
            raise ValueError("segment has no narratable text")

        gap = np.zeros(int(0.12 * self.sample_rate), dtype="float32")
        rendered = []
        for index, (emotion, speaker, chunk) in enumerate(spans):
            if index:
                rendered.append(gap)
            rendered.append(self._speak(chunk, self._preset_for(segment, emotion, speaker)))

        pcm, gain_db = normalize_to_pcm16(np.concatenate(rendered))
        generated = write_pcm16_wav(output_path, pcm, self.sample_rate)
        return {
            **generated,
            "spans": [{"emotion": e, "speaker": s} for e, s, _ in spans],
            "voice_partition": "mixed" if any(s for _, s, _ in spans) else "single",
            "gain_applied_db": gain_db,
        }

    def close(self):
        self.pipeline = None


def create_backend(name: str, model: str, output_dir: Path):
    if name == "fake":
        return FakeBackend()
    if name == "breeze":
        return BreezeBackend(model, output_dir)
    if name == "voxcpm2":
        return VoxCpmBackend(model, output_dir)
    if name == "kokoro":
        return KokoroBackend(model, output_dir)
    raise ValueError(
        f"unsupported backend: {name}; available: breeze, fake, kokoro, voxcpm2"
    )


def make_archive(output_dir: Path, archive_path: Path) -> None:
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(
        archive_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as archive:
        for file_path in sorted(output_dir.rglob("*")):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(output_dir))


def run(
    plan_path: Path,
    output_dir: Path,
    backend: str,
    model: str,
    archive_path: Path | None,
) -> dict:
    plan = load_plan(plan_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    segment_dir = output_dir / "segments"
    # Bootstrap is everything before the first token of audio: cloning the
    # pinned upstream, installing its stack, downloading the weights and loading
    # the model. On a cold remote GPU it dominates the job, so the benchmark has
    # to be able to tell it apart from inference.
    bootstrap_started = time.monotonic()
    runtime = create_backend(backend, model, output_dir)
    bootstrap_ms = round((time.monotonic() - bootstrap_started) * 1000)
    manifest_segments = []
    synthesis_ms = 0

    try:
        for index, segment in enumerate(plan["segments"]):
            for field in ("segment_id", "speaker", "text", "input_digest"):
                if not segment.get(field):
                    raise ValueError(f"segment {index} missing {field}")
            audio_path = segment_dir / f"{segment['segment_id']}.wav"
            segment_started = time.monotonic()
            generated = runtime.synthesize(segment, audio_path)
            segment_ms = round((time.monotonic() - segment_started) * 1000)
            synthesis_ms += segment_ms
            manifest_segments.append(
                {
                    "segment_id": segment["segment_id"],
                    "speaker": segment["speaker"],
                    "input_digest": segment["input_digest"],
                    "audio_file": str(audio_path.relative_to(output_dir)),
                    "synthesis_ms": segment_ms,
                    **generated,
                }
            )

        manifest = {
            "schema": MANIFEST_SCHEMA,
            "work_id": plan["work_id"],
            "chapter_id": plan["chapter_id"],
            "narration_digest": plan.get("narration_digest"),
            "backend": backend,
            "model": model,
            "backend_metadata": runtime.metadata,
            "hardware": hardware_info(),
            "timings": {
                "bootstrap_ms": bootstrap_ms,
                "synthesis_ms": synthesis_ms,
                "audio_ms": sum(item["duration_ms"] for item in manifest_segments),
            },
            "segments": manifest_segments,
        }
        manifest_path = output_dir / "manifest.json"
        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        if archive_path is not None:
            make_archive(output_dir, archive_path)

        return manifest
    finally:
        runtime.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument(
        "--backend", default="fake",
        choices=["breeze", "fake", "kokoro", "voxcpm2"],
    )
    parser.add_argument("--model", default="deterministic-tone-v1")
    parser.add_argument("--result-archive", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.model == "deterministic-tone-v1":
        if args.backend == "breeze":
            args.model = BREEZE_MODEL_REPOSITORY
        elif args.backend == "voxcpm2":
            args.model = VOXCPM_MODEL_REPOSITORY
        elif args.backend == "kokoro":
            args.model = KOKORO_MODEL_REPOSITORY
    try:
        manifest = run(
            args.plan,
            args.output_dir,
            args.backend,
            args.model,
            args.result_archive,
        )
    except Exception as error:  # noqa: BLE001 - CLI boundary surfaces non-zero failure.
        print(f"audiobook worker failed: {error}", file=sys.stderr)
        return 2

    print(
        json.dumps(
            {
                "status": "ok",
                "work_id": manifest["work_id"],
                "chapter_id": manifest["chapter_id"],
                "backend": manifest["backend"],
                "segments": len(manifest["segments"]),
                "output_dir": os.fspath(args.output_dir),
                "result_archive": os.fspath(args.result_archive)
                if args.result_archive
                else None,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
