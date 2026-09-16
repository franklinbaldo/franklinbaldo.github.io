# FlyDoom retina geometry provenance

FlyDoom's compound-eye reconstruction uses the 1,771-column retinotopic geometry published by the community project `ZeroXClem/closed-loop-fly`, itself derived from `AbijahKaj/fruit-fly-brain-research` and MaleCNS v1.0.

## Upstream geometry

Expected local asset: `retinotopic_columns_1771.json`

Upstream source:
- `ZeroXClem/closed-loop-fly/src/eye/columns.json`
- Derived from `AbijahKaj/fruit-fly-brain optic.json v2`
- Calibration pipeline: `data/extract_v2.py`
- Source connectome: `male-cns:v1.0`, traced-only, minimum confidence 0.5

The upstream file declares:
- `count = 1771`
- azimuth in radians, where `0 = forward` and positive = right
- elevation in radians, positive = up
- `side = 0` left eye, `side = 1` right eye
- `spacingDeg = 5`

## Licensing

Application code from `ZeroXClem/closed-loop-fly` is MIT licensed.

The MaleCNS-derived retinotopic data is CC BY 4.0. The upstream project requires citation of:

> Berg, S. et al. (2026). *Sexual dimorphism in the complete connectome of the Drosophila male central nervous system.* Cell 189(18): 5504–5526. https://doi.org/10.1016/j.cell.2026.08.015

Data source: https://male-cns.janelia.org/

## FlyDoom interpretation boundary

The 1,771 directions define a biologically grounded retinotopic sampling geometry. In the current FlyDoom simulator, the MaleCNS is still driven by 32 coarse visual encoder channels (`ray_vpl[0..15]` and `ray_vpr[0..15]`).

Therefore the UI must distinguish:

1. **Compound-eye reconstruction** — the 1,771-column retinotopic field used for biologically grounded visualization.
2. **Actual model input** — the 32 coarse encoder channels currently injected into the MaleCNS.

The compound-eye field must not be labelled as the exact current input tensor until the backend migrates to direct ommatidial/optic-column drive.
