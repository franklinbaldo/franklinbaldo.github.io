"""Gera a narração (TTS edge, pt-BR), mede durações reais e monta a linha do tempo.

Saídas:
  public/audio/voice.wav          trilha de vozes já posicionada
  src/generated/timeline.json     cenas, falas, palavras (legendas) e envelope de boca

Uso: python tools/build_audio.py   (cache em .cache/tts/)
"""

import asyncio
import hashlib
import json
import subprocess
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
FPS = 30
CACHE = ROOT / ".cache" / "tts"
CACHE.mkdir(parents=True, exist_ok=True)

FX = {
    "robot": "highpass=f=140,chorus=0.7:0.9:20|32:0.35|0.3:0.25|0.4:2|1.3,aecho=0.8:0.6:9:0.25,volume=1.25",
}


def decode(path: Path, fx: str | None = None) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "quiet", "-i", str(path)]
    if fx:
        cmd += ["-af", FX[fx]]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


async def tts(text: str, v: dict) -> tuple[Path, list]:
    key = hashlib.sha1(json.dumps([text, v], sort_keys=True).encode()).hexdigest()[:16]
    mp3, words_path = CACHE / f"{key}.mp3", CACHE / f"{key}.json"
    if mp3.exists() and words_path.exists() and mp3.stat().st_size > 0:
        return mp3, json.loads(words_path.read_text())
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(
                text, v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary"
            )
            words, audio = [], bytearray()
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
                elif chunk["type"] == "WordBoundary":
                    words.append(
                        {
                            "text": chunk["text"],
                            "startMs": chunk["offset"] / 10_000,
                            "endMs": (chunk["offset"] + chunk["duration"]) / 10_000,
                        }
                    )
            if not audio:
                raise RuntimeError("no audio")
            mp3.write_bytes(bytes(audio))
            words_path.write_text(json.dumps(words, ensure_ascii=False))
            return mp3, words
        except Exception as exc:  # serviço remoto: tenta de novo
            print("retry", attempt, v["voice"], exc)
            await asyncio.sleep(2 + attempt * 2)
    raise RuntimeError(f"TTS falhou: {text}")


def trim_tail(x: np.ndarray, thr=0.006) -> np.ndarray:
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    return x[: min(len(x), idx[-1] + int(0.08 * SR))]


def envelope(x: np.ndarray) -> list[float]:
    hop = SR // FPS
    n = int(np.ceil(len(x) / hop))
    pad = np.zeros(n * hop, np.float32)
    pad[: len(x)] = x
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1))
    peak = np.percentile(rms, 95) or 1.0
    return [round(float(min(1.0, r / peak)), 2) for r in rms]


async def main():
    script = json.loads((ROOT / "data" / "script.json").read_text())
    voices = script["voices"]
    jobs = []
    for sc in script["scenes"]:
        for line in sc["lines"]:
            lid, who, text, *_ = line
            opts = line[4] if len(line) > 4 else {}
            v = {**voices[who], **{k: opts[k] for k in ("rate", "pitch") if k in opts}}
            v.pop("name", None)
            fx = v.pop("fx", None)
            jobs.append((lid, who, text, line[3], opts, v, fx))

    sem = asyncio.Semaphore(6)

    async def run(job):
        async with sem:
            return await tts(job[2], job[5])

    results = await asyncio.gather(*(run(j) for j in jobs))
    by_id = {j[0]: (j, r) for j, r in zip(jobs, results)}

    t = 0.0  # segundos
    scenes, lines, chunks = [], [], []
    for sc in script["scenes"]:
        s_start = t
        t += sc["lead"]
        for line in sc["lines"]:
            (lid, who, text, gap, opts, v, fx), (mp3, words) = by_id[line[0]]
            audio = trim_tail(decode(mp3, fx))
            if "cut" in opts:
                n = int(opts["cut"] * SR)
                audio = audio[:n] * np.linspace(1, 0, n) ** 0.3
            dur = len(audio) / SR
            start = t
            chunks.append((int(round(start * SR)), audio))
            lines.append(
                {
                    "id": lid,
                    "who": who,
                    "scene": sc["id"],
                    "text": text,
                    "start": round(start * FPS),
                    "end": round((start + dur) * FPS),
                    "words": [
                        {
                            "text": w["text"],
                            "startMs": round(start * 1000 + w["startMs"]),
                            "endMs": round(start * 1000 + w["endMs"]),
                        }
                        for w in words
                        if w["startMs"] < dur * 1000
                    ],
                    "amp": envelope(audio),
                }
            )
            t = start + dur + gap
        t += sc["tail"]
        scenes.append(
            {"id": sc["id"], "title": sc["title"], "start": round(s_start * FPS), "end": round(t * FPS)}
        )

    total = int(np.ceil(t * SR))
    mix = np.zeros(total, np.float32)
    for off, a in chunks:
        mix[off : off + len(a)] += a
    mix = np.clip(mix * 0.95, -1, 1)
    out = ROOT / "public" / "audio"
    out.mkdir(parents=True, exist_ok=True)
    write_wav(out / "voice.wav", mix)

    captions = [c for l in lines for c in caption_chunks(l)]
    names = {k: v["name"] for k, v in voices.items()}
    srt = []
    for i, c in enumerate(captions, 1):
        prefix = "" if c["who"] == "N" else f"{names[c['who']].upper()}: "
        srt.append(f"{i}\n{srt_time(c['startMs'])} --> {srt_time(c['endMs'])}\n{prefix}{c['text']}\n")
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / "out" / "legendas.srt").write_text("\n".join(srt), encoding="utf-8")

    gen = ROOT / "src" / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    timeline = {
        "fps": FPS,
        "durationInFrames": round(t * FPS),
        "scenes": scenes,
        "lines": lines,
        "captions": captions,
        "speakers": {k: v["name"] for k, v in voices.items()},
    }
    (gen / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False))
    print(f"duração total: {t / 60:.2f} min ({round(t * FPS)} frames)")
    for s in scenes:
        print(f"  {s['id']:8s} {s['start'] / FPS:7.1f}s → {s['end'] / FPS:7.1f}s  ({(s['end'] - s['start']) / FPS:5.1f}s)  {s['title']}")


def alnum_len(s: str) -> int:
    return sum(ch.isalnum() for ch in s)


def caption_chunks(line: dict, max_words=7) -> list[dict]:
    """Quebra a fala em blocos curtos de legenda, com tempo tirado das palavras do TTS.

    Alinha por posição de caracteres alfanuméricos, o que tolera diferenças de
    tokenização entre o texto e as WordBoundary do serviço.
    """
    tokens = line["text"].split()
    chunks, cur = [], []
    for tok in tokens:
        cur.append(tok)
        if len(cur) >= max_words or (tok[-1] in ".!?:;" and len(cur) >= 2) or (tok[-1] == "," and len(cur) >= 4):
            chunks.append(cur)
            cur = []
    if cur:
        if chunks and len(cur) <= 2:
            chunks[-1] += cur
        else:
            chunks.append(cur)
    words = line["words"]
    cum, acc = [], 0
    for w in words:
        cum.append(acc)
        acc += alnum_len(w["text"])
    out, pos = [], 0
    for ch in chunks:
        a = pos
        pos += sum(alnum_len(t) for t in ch)
        def at(c):
            j = max([i for i, v in enumerate(cum) if v <= c] or [0])
            return j
        if words:
            j0, j1 = at(a), at(max(a, pos - 1))
            start, end = words[j0]["startMs"], words[j1]["endMs"]
        else:
            start, end = line["start"] / FPS * 1000, line["end"] / FPS * 1000
        out.append({"text": " ".join(ch), "startMs": start, "endMs": end, "who": line["who"]})
    for i in range(len(out) - 1):  # sem buracos dentro da mesma fala
        out[i]["endMs"] = max(out[i]["endMs"], out[i + 1]["startMs"])
    return out


def srt_time(ms: float) -> str:
    ms = int(round(ms))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_wav(path: Path, x: np.ndarray):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(path)],
        input=pcm,
        check=True,
    )


if __name__ == "__main__":
    asyncio.run(main())
