"""Trilha sonora original, sintetizada do zero (sem samples de terceiros).

Lê src/generated/timeline.json, escolhe um "humor" musical por trecho do
roteiro, sintetiza e aplica ducking automático sob a voz.

Saída: public/audio/music.wav
"""

import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a=0.005, d=0.1, s=0.6, r=0.1):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else 1
    e[na : na + nd] = np.linspace(1, s, len(e[na : na + nd]))
    if nr and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e[: len(t)]


def pluck(f, dur, bright=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum((bright**k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return x * np.exp(-t * (5 + f / 200))


def bell(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (
        np.sin(2 * np.pi * f * t)
        + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
        + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    )
    return x * np.exp(-t * 3.2)


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return x * env_adsr(n, 0.008, 0.15, 0.55, 0.06)


def tuba(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * t) / k**1.3 for k in range(1, 7))
    return 0.6 * x * env_adsr(n, 0.03, 0.1, 0.7, 0.08)


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for det in (-0.25, 0.0, 0.3):
            ff = f * 2 ** (det / 12 / 10)
            x += np.sin(2 * np.pi * ff * t) + 0.3 * np.sin(2 * np.pi * 2 * ff * t)
    return x / (len(freqs) * 3) * env_adsr(n, 0.35, 0.2, 0.85, 0.4)


def brass(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        x += sum(np.sin(2 * np.pi * f * k * t) * (0.8**k) for k in range(1, 8))
    return x / len(freqs) * env_adsr(n, 0.04, 0.15, 0.7, 0.15) * 0.5


def kick():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare(level=1.0):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - np.convolve(noise, np.ones(4) / 4, "same")
    return level * (0.6 * noise * np.exp(-t * 22) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30))


def hat():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - np.convolve(noise, np.ones(3) / 3, "same")
    return 0.25 * noise * np.exp(-t * 80)


def tick():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return 0.3 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200)


# Progressões (graus em MIDI): C  Am  F  G   |  Am F C E (curioso)
PROG_MAJOR = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
PROG_MINOR = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]]
MOTIF = [0, 2, 1, 2, 0, None, 2, 1]  # índices nas notas do acorde (colcheias)
MOTIF_B = [2, 1, 0, 1, 2, 2, None, None]


class Track:
    def __init__(self, seconds):
        self.x = np.zeros(int(seconds * SR) + SR * 3)

    def add(self, t, sig, gain=1.0):
        i = int(t * SR)
        if i < 0 or i >= len(self.x):
            return
        sig = sig[: len(self.x) - i]
        self.x[i : i + len(sig)] += gain * sig


def render_style(style, t0, t1, tr: Track):
    """Escreve no Track as notas cujo início cai em [t0, t1), alinhadas à grade global."""
    first_bar = int(np.floor(t0 / BAR))
    last_bar = int(np.ceil(t1 / BAR))
    for b in range(first_bar, last_bar + 1):
        bar_t = b * BAR
        prog = PROG_MINOR if style in ("curious", "tension") else PROG_MAJOR
        chord = prog[b % 4]
        events = []
        if style == "march":
            for q in range(4):
                events.append((bar_t + q * BEAT, "tuba" if q % 2 == 0 else "snare", chord))
            for e in range(8):
                events.append((bar_t + e * BEAT / 2, "snare_soft", chord))
            for i, k in enumerate([0, 1, 2, 1]):
                events.append((bar_t + i * BEAT, "brass_note", [chord[k] + 12]))
        elif style == "bouncy":
            motif = MOTIF if b % 2 == 0 else MOTIF_B
            for e, k in enumerate(motif):
                if k is not None:
                    events.append((bar_t + e * BEAT / 2, "pluck", [chord[k] + 12]))
            for q in range(4):
                events.append((bar_t + q * BEAT, "bass", [chord[0] - 24 + (7 if q % 2 else 0)]))
                events.append((bar_t + q * BEAT, "kick" if q % 2 == 0 else "snare_soft", chord))
            for e in range(8):
                events.append((bar_t + e * BEAT / 2 + BEAT / 4, "hat", chord))
            if b % 4 == 3:
                events.append((bar_t + 3 * BEAT, "bell", [chord[2] + 24]))
        elif style == "curious":
            for e in (0, 3, 6):
                events.append((bar_t + e * BEAT / 2, "pluck_soft", [chord[(e // 3) % 3] + 12]))
            events.append((bar_t, "bass", [chord[0] - 24]))
            events.append((bar_t + 2.5 * BEAT, "bass", [chord[0] - 12]))
            if b % 2 == 0:
                events.append((bar_t + 2 * BEAT, "bell", [chord[1] + 24]))
        elif style == "tension":
            for e in range(8):
                events.append((bar_t + e * BEAT / 2, "tick", chord))
            for q in range(4):
                events.append((bar_t + q * BEAT, "bass", [45 if b % 2 == 0 else 44]))
            if b % 2 == 0:
                events.append((bar_t, "pad", [57, 60, 63]))
        elif style == "triumph":
            events.append((bar_t, "pad", [n + 12 for n in chord]))
            events.append((bar_t, "brass", chord))
            events.append((bar_t + 2 * BEAT, "brass", chord))
            for q in range(4):
                events.append((bar_t + q * BEAT, "kick", chord))
                events.append((bar_t + q * BEAT, "bass", [chord[0] - 24]))
            for e in range(8):
                events.append((bar_t + e * BEAT / 2, "pluck", [chord[e % 3] + 24]))
                events.append((bar_t + e * BEAT / 2 + BEAT / 4, "hat", chord))
            events.append((bar_t + 1 * BEAT, "snare", chord))
            events.append((bar_t + 3 * BEAT, "snare", chord))
        elif style == "city":
            events.append((bar_t, "pad", chord))
            for e in range(16):
                k = [0, 1, 2, 1][e % 4]
                events.append((bar_t + e * BEAT / 4, "pluck_soft", [chord[k] + 12 + (12 if e >= 8 else 0)]))
            events.append((bar_t, "kick", chord))
            events.append((bar_t + 2 * BEAT, "kick", chord))
            events.append((bar_t, "bass", [chord[0] - 24]))
        for t, kind, notes in events:
            if not (t0 <= t < t1):
                continue
            if kind == "pluck":
                tr.add(t, pluck(midi(notes[0]), 0.6), 0.28)
            elif kind == "pluck_soft":
                tr.add(t, pluck(midi(notes[0]), 0.8, 0.35), 0.22)
            elif kind == "bell":
                tr.add(t, bell(midi(notes[0]), 1.5), 0.16)
            elif kind == "bass":
                tr.add(t, bass(midi(notes[0]), BEAT * 0.9), 0.3)
            elif kind == "tuba":
                tr.add(t, tuba(midi(notes[0] - 24), BEAT * 0.8), 0.3)
            elif kind == "brass_note":
                tr.add(t, brass([midi(notes[0])], BEAT * 0.7), 0.22)
            elif kind == "brass":
                tr.add(t, brass([midi(n) for n in notes], BEAT * 1.6), 0.3)
            elif kind == "pad":
                tr.add(t, pad([midi(n) for n in notes], BAR), 0.22)
            elif kind == "kick":
                tr.add(t, kick(), 0.45)
            elif kind == "snare":
                tr.add(t, snare(), 0.25)
            elif kind == "snare_soft":
                tr.add(t, snare(0.5), 0.18)
            elif kind == "hat":
                tr.add(t, hat(), 0.5)
            elif kind == "tick":
                tr.add(t, tick(), 0.6)


def drumroll(t0, dur, tr: Track):
    n = int(dur / 0.045)
    for i in range(n):
        lvl = 0.25 + 0.75 * i / n
        tr.add(t0 + i * 0.045, snare(lvl), 0.25)


def main():
    tl = json.loads((ROOT / "src" / "generated" / "timeline.json").read_text())
    fps = tl["fps"]
    L = {l["id"]: (l["start"] / fps, l["end"] / fps) for l in tl["lines"]}
    S = {s["id"]: (s["start"] / fps, s["end"] / fps) for s in tl["scenes"]}
    total = tl["durationInFrames"] / fps

    # (início, humor). "none" = silêncio. Cortes secos marcados com "!" no humor.
    plan = [
        (0.0, "march"),
        (L["s1_g"][0] - 0.3, "!none"),  # música para quando a máquina chega
        (L["s1_g"][1] + 0.9, "!bouncy"),  # portão derrubado → festa
        (S["s3"][0], "curious"),
        (L["s3_i"][0], "!triumph"),
        (L["s3_i"][1] + 0.1, "!none"),  # silêncio constrangedor
        (L["s3_j"][1] + 0.2, "tension"),
        (L["s4_m"][0], "!triumph"),
        (L["s4_n"][0], "bouncy"),
        (S["s5"][0], "curious"),
        (L["s5_m"][1] + 0.1, "!none"),
        (L["s5_n"][0], "!triumph"),
        (L["s5_o"][0], "curious"),
        (S["s6"][0], "bouncy"),
        (S["s7"][0], "city"),
        (S["s8"][0], "bouncy"),
        (L["s8_f"][1], "!triumph"),
        (L["s8_h"][0], "curious"),
        (S["s9"][0], "city"),
        (L["s9_h"][0], "triumph"),
        (L["s9_i"][1] + 0.05, "!none"),  # música interrompida: pausa dramática
        (L["s9_j"][0], "!triumph"),
        (S["post"][0], "!none"),
        (S["credits"][0], "!bouncy"),
        (total, "none"),
    ]
    master = np.zeros(int(total * SR) + SR * 3)
    for (t0, style), (t1, nxt) in zip(plan, plan[1:]):
        hard_in = style.startswith("!")
        hard_out = nxt.startswith("!")
        style = style.lstrip("!")
        if style == "none":
            continue
        tr = Track(total)
        render_style(style, t0, t1, tr)
        seg = tr.x
        g = np.zeros_like(seg)
        i0, i1 = int(t0 * SR), int(t1 * SR)
        fade_in = int((0.01 if hard_in else 0.6) * SR)
        g[i0:i1] = 1.0
        g[i0 : i0 + fade_in] = np.linspace(0, 1, fade_in)
        if hard_out:
            fo = int(0.04 * SR)
            g[i1 - fo : i1] = np.linspace(1, 0, fo)
        else:
            end = min(len(g), i1 + int(0.8 * SR))
            g[i1:end] = np.linspace(1, 0, end - i1)
        master += seg * g

    # rufar de tambores antes do veredito do Lean
    tr = Track(total)
    drumroll(L["s5_m"][1] + 0.1, L["s5_n"][0] - L["s5_m"][1] - 0.15, tr)
    master += tr.x

    master = master[: int(total * SR)]

    # ducking pela voz
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", str(ROOT / "public/audio/voice.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True,
        check=True,
    ).stdout
    voice = np.frombuffer(raw, np.float32)
    voice = np.pad(voice, (0, max(0, len(master) - len(voice))))[: len(master)]
    hop = 480
    n = len(voice) // hop
    env = np.sqrt((voice[: n * hop].reshape(n, hop) ** 2).mean(axis=1))
    env = (env > 0.01).astype(float)
    # suaviza (ataque rápido, release lento)
    sm = np.zeros_like(env)
    a, r = 0.35, 0.02
    for i in range(1, n):
        k = a if env[i] > sm[i - 1] else r
        sm[i] = sm[i - 1] + k * (env[i] - sm[i - 1])
    duck = 1.0 - 0.72 * sm
    duck = np.repeat(duck, hop)
    duck = np.pad(duck, (0, len(master) - len(duck)), constant_values=1.0)
    master *= duck

    peak = np.max(np.abs(master)) or 1
    master = master / peak * 0.5  # deixa espaço para a voz
    pcm = (master * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(ROOT / "public/audio/music.wav")],
        input=pcm,
        check=True,
    )
    print("music.wav ok", round(total, 1), "s")


if __name__ == "__main__":
    main()
