"""Efeitos sonoros, todos sintetizados aqui (nenhum sample de terceiros).

Saída: public/sfx/*.wav
"""

import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(3)



def save(name, x):
    x = x / (np.max(np.abs(x)) or 1) * 0.9
    pcm = (x * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-v", "quiet", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(OUT / f"{name}.wav")],
        input=pcm,
        check=True,
    )


def t_(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, "same")


def stamp():
    t = t_(0.5)
    thud = np.sin(2 * np.pi * np.cumsum(60 + 120 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)
    slap = lowpass(rng.standard_normal(len(t)), 6) * np.exp(-t * 60)
    return thud + 0.7 * slap


def crash():
    t = t_(2.2)
    noise = rng.standard_normal(len(t))
    boom = np.sin(2 * np.pi * np.cumsum(40 + 80 * np.exp(-t * 8)) / SR) * np.exp(-t * 3)
    debris = np.zeros(len(t))
    for _ in range(40):
        i = rng.integers(0, int(1.8 * SR))
        d = int(0.05 * SR)
        seg = rng.standard_normal(d) * np.exp(-np.arange(d) / SR * 60)
        debris[i : i + d] += seg * rng.uniform(0.1, 0.4)
    return 1.2 * boom + 0.6 * lowpass(noise, 3) * np.exp(-t * 2.5) + debris


def siren():
    t = t_(2.4)
    f = 700 + 300 * np.sin(2 * np.pi * 1.6 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    return lowpass(x, 5) * np.minimum(1, t * 8) * np.minimum(1, (2.4 - t) * 4)


def pop():
    t = t_(0.25)
    return np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 18) + 200) / SR) * np.exp(-t * 25) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 80)


def confetti():
    x = np.zeros(int(1.8 * SR))
    for _ in range(26):
        p = pop() * rng.uniform(0.2, 0.8)
        i = rng.integers(0, len(x) - len(p))
        x[i : i + len(p)] += p
    return x


def drumroll_short():
    x = np.zeros(int(1.2 * SR))
    for i in range(int(1.15 / 0.04)):
        n = int(0.1 * SR)
        s = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 40) * (0.3 + 0.7 * i / 28)
        j = int(i * 0.04 * SR)
        x[j : j + n] += s[: len(x) - j]
    return x


def slide_down():  # desmaio
    t = t_(1.3)
    f = 1400 * np.exp(-t * 1.6) + 120
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t * 20) * np.exp(-t * 0.8)


def slide_up():
    t = t_(0.6)
    f = 300 + 1600 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t * 20) * (1 - t / 0.6)


def boing():
    t = t_(0.7)
    f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)


def buzzer():
    t = t_(0.7)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) + 0.5 * np.sign(np.sin(2 * np.pi * 116 * t))
    return lowpass(x, 8) * np.minimum(1, t * 50) * np.minimum(1, (0.7 - t) * 20) * 0.6


def success():
    x = np.zeros(int(1.4 * SR))
    for i, n in enumerate([72, 76, 79, 84]):
        f = 440 * 2 ** ((n - 69) / 12)
        t = t_(1.0)
        s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 4)
        j = int(i * 0.09 * SR)
        x[j : j + len(s)] += s[: len(x) - j]
    return x


def crickets():
    x = np.zeros(int(2.4 * SR))
    for k in range(5):
        start = int((0.15 + k * 0.45) * SR)
        for c in range(3):
            t = t_(0.035)
            s = np.sin(2 * np.pi * 4300 * t) * np.sin(np.pi * t / 0.035)
            j = start + int(c * 0.05 * SR)
            x[j : j + len(s)] += s
    return x * 0.5


def typing():
    x = np.zeros(int(2.0 * SR))
    tt = 0.0
    while tt < 1.9:
        n = int(0.02 * SR)
        s = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 300)
        j = int(tt * SR)
        x[j : j + n] += s * rng.uniform(0.4, 1)
        tt += rng.uniform(0.05, 0.13)
    return x


def thud_big():  # processo de 4000 páginas
    t = t_(1.2)
    return np.sin(2 * np.pi * np.cumsum(35 + 70 * np.exp(-t * 12)) / SR) * np.exp(-t * 5) + 0.4 * lowpass(rng.standard_normal(len(t)), 10) * np.exp(-t * 10)


def zap():
    t = t_(0.4)
    f = 2000 * np.exp(-t * 8) + 300
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 7) * 0.5


def sparkle():
    x = np.zeros(int(1.2 * SR))
    for i in range(10):
        f = rng.uniform(2000, 5000)
        t = t_(0.3)
        s = np.sin(2 * np.pi * f * t) * np.exp(-t * 18)
        j = int(rng.uniform(0, 0.8) * SR)
        x[j : j + len(s)] += s
    return x


def whoosh():
    t = t_(0.7)
    noise = rng.standard_normal(len(t))
    k = (3 + 25 * np.sin(np.pi * t / 0.7)).astype(int)
    out = np.array([noise[max(0, i - kk):i + 1].mean() for i, kk in enumerate(k)])
    return out * np.sin(np.pi * t / 0.7) ** 2


def ding():
    t = t_(1.4)
    f = 1318.5
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 5)) * np.exp(-t * 3)


def scratch():
    t = t_(0.55)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 2.6 * t))
    return lowpass(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * rng.uniform(0.6, 1, len(t)), 3) * 0.5 * (1 - t / 0.55)


def click():
    t = t_(0.04)
    return np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 250)


def page():
    t = t_(0.35)
    return lowpass(rng.standard_normal(len(t)), 2) * np.sin(np.pi * t / 0.35) * 0.5


def collapse():
    x = crash()[: int(1.6 * SR)]
    return lowpass(x, 4)


def main():
    for name, fn in {
        "stamp": stamp,
        "crash": crash,
        "siren": siren,
        "pop": pop,
        "confetti": confetti,
        "drumroll": drumroll_short,
        "slide-down": slide_down,
        "slide-up": slide_up,
        "boing": boing,
        "buzzer": buzzer,
        "success": success,
        "crickets": crickets,
        "typing": typing,
        "thud": thud_big,
        "zap": zap,
        "sparkle": sparkle,
        "collapse": collapse,
        "whoosh": whoosh,
        "ding": ding,
        "record-scratch": scratch,
        "click": click,
        "page-turn": page,
    }.items():
        save(name, fn())
    print("sfx:", sorted(p.stem for p in OUT.glob("*.wav")))


if __name__ == "__main__":
    main()
