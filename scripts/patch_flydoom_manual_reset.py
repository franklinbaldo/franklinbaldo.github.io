from pathlib import Path

path = Path("public/flydoom-fourier/index.html")
text = path.read_text()

replacements = [
    (
        """      function finishEpisode(now) {\n        const score = episodeSamples ? episodeScore / episodeSamples : match;\n        if (score >= bestEpisodeScore) {\n          bestEpisodeScore = score;\n          bestW = trialW.map((r) => r.slice());\n        }\n        episode++;\n        episodeStart = now;\n        episodeScore = 0;\n        episodeSamples = 0;\n        perturbFromBest();\n        randomizeStart();\n      }""",
        """      function finishEpisode(now) {\n        const score = episodeSamples ? episodeScore / episodeSamples : match;\n        if (score >= bestEpisodeScore) {\n          bestEpisodeScore = score;\n          bestW = trialW.map((r) => r.slice());\n        }\n        episode++;\n        episodeStart = now;\n        episodeScore = 0;\n        episodeSamples = 0;\n        perturbFromBest();\n      }""",
    ),
    (
        "        if (now - episodeStart >= EPISODE_MS || hit) finishEpisode(now);",
        "        if (now - episodeStart >= EPISODE_MS) finishEpisode(now);",
    ),
    (
        '                <button class="warn" id="randomizeButton">New start</button>\n',
        "",
    ),
    (
        """      document\n        .getElementById(\"randomizeButton\")\n        .addEventListener(\"click\", () => {\n          episodeStart = performance.now();\n          randomizeStart();\n        });\n""",
        "",
    ),
    (
        """          bestEpisodeScore = -Infinity;\n          bestMatch = 0;\n          episode = 0;\n          hits = 0;\n          episodeStart = performance.now();\n          perturbFromBest();\n          randomizeStart();\n          deform(targetGeometry, targetOriginal, target);""",
        """          deform(targetGeometry, targetOriginal, target);""",
    ),
    (
        """        episodeStart = performance.now();\n        randomizeStart();\n      });""",
        """        episodeStart = performance.now();\n        episodeScore = 0;\n        episodeSamples = 0;\n        hitLatched = false;\n        reward = 0;\n        match = 0;\n        randomizeStart();\n      });""",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f"expected snippet not found: {old[:80]!r}")
    text = text.replace(old, new, 1)

path.write_text(text)
