---
author: franklin
date: 2024-07-12
lang: en
title: "Pontifex Architecture Implementation Guide"
translationKey: pontifex-guide
description: "Construction notes for a semantic probing architecture that doesn't exist yet — written before building it, not after."
tags: ["implementation", "code", "python", "pytorch", "pontifex"]
heroImage: ./images/pontifex-architecture-implementation-guide-cover.png
heroImageAlt: "Code snippets and architectural diagrams for a semantic probing system."
---

The most honest thing I can say about this post is that I wrote it before I built anything. Most implementation guides come after. This one is architectural speculation dressed in code — notes for something that doesn't exist yet, written for when it does.

The [Pontifex architecture](/blog/pontifex-novel-architecture-semantic-probing/) is my attempt to describe a system that probes semantic space from multiple directions at once and converges on a signal. The companion post explains the theory. This one is meant to explain what I'd actually type into a terminal. Except that so far I haven't typed most of it. I'm a public interest lawyer who builds things on weekends in Rondônia — I don't have a GPU cluster or a research team, and the architecture I described borrows from five or six papers that don't exactly talk to each other.

So: construction notes, not a build log.

---

The name _Pontifex_ is borrowed from Latin — _pontifex_, bridge-builder, the Roman priest responsible for maintaining the bridges over the Tiber and the metaphorical ones between the human and divine. I found it appropriate for a system that tries to build bridges between semantic spaces. I didn't know until I started searching that Bruce Schneier had already used it for a cryptographic cipher. There is exactly one paper in Google Scholar with "Pontifex" and "semantic probing" in the abstract. It's about something else entirely.

This is fine. I'm not naming an existing thing; I'm naming a thing I want to build.

---

The core problem Pontifex is meant to solve: most semantic similarity systems are one-sided. You have a query, you have a document, you project both into an embedding space and measure distance. This works well enough for retrieval. It works less well for the kind of probing I care about — asking whether two representations that live in _different_ spaces are pointing at the same underlying concept from different angles.

The bilateral part matters. You want to look at concept A from the perspective of space X, and then look at the same concept from the perspective of space Y, and ask: do these two views converge? A face recognition system and a natural language description of a face are representing the same thing in spaces that don't natively talk to each other. Pontifex is about making them talk.

The [Captum library](https://captum.ai/) from PyTorch has occlusion analysis built in, which gets you partway there:

```python
from captum.attr import Occlusion
import torch

def probe_bilateral(model, text, window_size=8):
    byte_input = text.encode('utf-8')
    oc = Occlusion(model)
    return oc.attribute(
        inputs=torch.tensor(list(byte_input), dtype=torch.float32).unsqueeze(0),
        sliding_window_shapes=(window_size,),
        baselines=0
    )
```

This gives you occlusion sensitivity at the byte level — which bytes, when masked, most change the output. Whether this is the right grain for bilateral comparison I genuinely don't know. The paper I had in mind when writing the architecture post worked at the token level, not the byte level. I switched to bytes because I'm interested in what happens with multilingual content where tokenization is uneven. Whether the signal remains independent across the two bilateral channels under byte-level occlusion is one of those questions I have an intuition about and no empirical answer to.

---

The convergence part is less mysterious in theory than in practice. You want a layer that takes representations from multiple spaces and combines them into something more than either alone:

```python
import torch.nn as nn

class MultiSpaceConvergence(nn.Module):
    def __init__(self, embed_dim=768, num_spaces=3):
        super().__init__()
        self.projectors = nn.ModuleList([
            nn.Linear(embed_dim, embed_dim) for _ in range(num_spaces)
        ])
        self.fuse = nn.Linear(embed_dim * num_spaces, embed_dim)

    def forward(self, embeddings):
        projected = [p(embeddings) for p in self.projectors]
        return self.fuse(torch.cat(projected, dim=-1))
```

The dropout and ReLU I had in an earlier draft I've since removed — they were there to show I knew what I was doing, which is a bad reason to include things in code. Whether the convergence layer should be nonlinear at all depends on whether the spaces are already well-structured. For CLIP-like embeddings, linear projection often works well enough that adding nonlinearity is more about training convenience than expressiveness.

The honest dependency list is: you need `torch`, `transformers`, and `open-clip-torch`. Captum for the occlusion analysis. Everything else I listed in earlier versions of this post was scaffolding to sound comprehensive. You can build the architecture without most of it.

---

The gap between this post and a real implementation guide is that a real implementation guide exists after you've run into the problems. I know from the literature that bilateral signal independence is not guaranteed — if both channels attend to the same surface features, you haven't gotten two views, you've gotten the same view twice. I don't know from experience how often this actually happens with this setup, because I haven't run it at scale.

This is a specific kind of intellectual embarrassment I've decided to stop hiding. A lot of technical blog posts are written in the imperative voice of someone who has done the thing, when the author has mostly thought carefully about the thing. The code compiles. The architecture is coherent. The training would take three to fifteen days on hardware I don't own.

For now: [Pontifex Novel Architecture](/blog/pontifex-novel-architecture-semantic-probing/) explains why I think this is worth building. This post explains what I would build if I were building it. The difference between the two posts is a GPU and a month of weekends.

## For further reading

- **[Captum documentation](https://captum.ai/docs/)** — the PyTorch interpretability library. The occlusion module is documented well; the examples are useful even if the API has shifted since the original papers.
- **[CLIP paper](https://arxiv.org/abs/2103.00020)** (Radford et al., 2021) — the multimodal foundation this borrows from. The bilateral comparison in Pontifex is partly an attempt to generalize what CLIP does for image-text to arbitrary space pairs.
- **Zeiler & Fergus, "Visualizing and Understanding Convolutional Networks"** (2013) — the source of occlusion sensitivity analysis as a method. The byte-level application is my extrapolation; the original is image-only.
- **[ByT5](https://arxiv.org/abs/2105.13626)** (Xue et al., 2022) — for byte-level tokenization context. Relevant if you want the occlusion to be genuinely byte-native rather than a workaround for tokenizer alignment.
