# MaleCNS byte tagger v2 — training gate

## Why this gate exists

The five-seed 512-neuron v1 run established that the pipeline trains, but it did **not** show a stable MaleCNS-topology advantage:

- MaleCNS F1: `0.27529 ± 0.06820`;
- degree-preserving shuffled F1: `0.27821 ± 0.06101`;
- byte-only F1: `0.27270 ± 0.05618`;
- MaleCNS − shuffled: `-0.00292 ± 0.02840`;
- MaleCNS − byte-only: `+0.00259 ± 0.01399`.

The original run used exactly 3 epochs and always reported the final epoch. The first seed's loss was still falling steeply at epoch 3, so v1 cannot distinguish "the reservoir carries no additional usable signal" from "the trainable adapter/readout stopped too early or the best validation checkpoint occurred at another epoch".

## Frozen change

This gate changes **training selection only**.

Held fixed from v1:

- CausaGanha source commit and train/validation split;
- byte encoding, window construction and negative sampling;
- 512 MaleCNS neurons selected by weighted degree;
- 64d byte embedding and 64 reservoir input neurons;
- frozen recurrent graph and incoming-normalized weights;
- MaleCNS vs degree-preserving shuffled vs byte-only comparison;
- the same five paired seeds `20260912..20260916`.

Changed:

- maximum training: 3 → 30 epochs;
- minimum training: 5 epochs;
- restore the checkpoint with highest validation F1;
- early stopping after 5 epochs without validation-F1 improvement;
- halve learning rate on validation-F1 plateau;
- record `best_epoch` and `stopped_epoch` for every model and seed.

## Interpretation

This is a **training-regime diagnostic**, not a confirmatory result. Validation is used for checkpoint selection, so its F1 cannot be promoted to a held-out final estimate. `test.jsonl` remains untouched.

If the best epochs cluster well above 3 and all model families improve materially, v1 was training-limited. If MaleCNS improves relative to both shuffled and byte-only, that earns a separately frozen confirmatory run. If all three remain close, the next useful change is data/window coverage or reservoir dynamics, not simply more epochs.

The 5k and 10k scale PRs remain downstream. They should not become the primary comparison until this gate tells us whether the 512-node training regime itself was truncated.
