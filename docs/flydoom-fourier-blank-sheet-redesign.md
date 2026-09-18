# FlyDoom Fourier — blank-sheet redesign

## Purpose

**FlyDoom Fourier exists so that a frozen MaleCNS can learn, through sensed geometric misalignment, to transform a deformable surface until it matches a target, while the causal loop remains inspectable and scientifically honest, without hidden controllers or reward exploits.**

This redesign follows the `blank-sheet-redesign` skill from `franklinbaldo/skills`. Because the old implementation had already been read before the redesign started, the exercise is explicitly treated as anchored; the ideal was therefore re-derived from purpose and constraints rather than by editing the existing artifact.

## Real constraints

### Domain constraints

- MaleCNS recurrence remains frozen. Learning may happen only in thin adapters around it.
- The task must be closed loop: sensed mismatch → MaleCNS state → action → changed surface → new mismatch.
- Target and current surface must inhabit exactly the same action/transform space.
- A hit must mean real geometric agreement, not agreement on a sparse or gameable proxy.
- Sensory mismatch must preserve **where** the error occurs and **what kind** of error it is.
- The demo must run interactively in a browser, including a modern but non-flagship phone.
- Anything biologically artificial must be labeled as artificial.

### Decisions still in force

- The same target may relocate after a sustained success without resetting learned policy.
- Reward/penalty must become substantially stronger near the target while staying progress-based: no reward for merely remaining close.
- The user must be able to see the target, current surface, what the agent feels, and what it does.
- A thin learnable input interface and a thin learnable output interface are desirable; the connectome itself stays fixed.

### Constraints learned from incident history

These are retained as principles, not scars:

- **Sparse-score exploit:** narrow high-frequency spikes previously earned false success. → Score physical geometry densely enough for the active bandwidth and include worst-local disagreement.
- **Unreachable transform:** target translation previously existed outside the current surface action space. → Current and target use one shared parameterization.
- **Late-reward starvation:** ordinary shaping gave little incentive for the last precision. → Use an exponential precision potential on progress, with a small linear backbone when far away.
- **Scalar discomfort was under-specified:** height alone cannot tell tilt from curvature or normal disagreement. → Each local cell exposes several geometric mismatch channels.
- **Mobile cost matters:** differential geometry at render rate is wasteful. → Sense geometry at a lower sensory cadence; render can remain faster.

## v-ideal — designed without using the old artifact as a template

### 1. World state: one factorized, reachable shape space

The surface is represented by:

- **32 bounded Fourier residual modes** for local shape;
- **5 global actuators**:
  - translation X;
  - translation Z;
  - tilt X;
  - tilt Z;
  - bowl/curvature.

The target is generated from the exact same 37-dimensional state space.

This is deliberately small. The base demo is about whether the loop works, not about advertising the largest actuator count. Scaling from 32 to hundreds/thousands becomes a separate capacity experiment after this loop is stable.

### 2. Sensation: a fixed 8 × 4 mismatch sheet

The task sensor is not a fake claim that the fly can “see Fourier coefficients”.

The arena is divided into **32 spatial cells**. Each cell computes several physically interpretable differences between current and target:

1. height;
2. X/forward slope;
3. Z/lateral slope;
4. curvature/Laplacian;
5. surface-normal disagreement;
6. slope magnitude.

Those values are artificial task proprioception, explicitly labeled as such.

The 16 cells on the left and 16 on the right map naturally to the existing 16 + 16 MaleCNS visual ingress buckets. Within each bucket, neurons are partitioned into feature/sign sub-populations so locality, feature identity, and opponent sign survive the encoding.

### 3. Thin learnable input adapter

Before mismatch enters MaleCNS, a tiny learnable adapter scales the six feature families.

It does **not** synthesize a solution. It only learns which mismatch modalities deserve more or less sensory gain.

This is a handful of parameters, trained by the same reward signal as the output adapter.

### 4. Frozen MaleCNS

MaleCNS recurrence is unchanged.

The worker receives the synthetic proprioceptive sheet, runs the frozen 165k-neuron recurrence, and returns the 1,314 descending-neuron values.

The 3D visualization is not the controller input. Rendering is presentation; the task signal is the explicit mismatch sheet.

### 5. Thin learnable output adapter

The 1,314 DNs do not get arbitrarily interpolated into thousands of actuators.

Instead:

```text
1,314 DNs
   ↓ fixed deterministic random projection
16 contextual hidden values
   ↓ trainable linear readout
37 action channels
```

Only the small readout matrix and biases learn.

Action noise is injected at the 37-channel output. Reward-modulated node perturbation updates the readout, giving a simple causal credit path that can be inspected.

### 6. Surface dynamics

Actions are **velocities**, not teleports.

- Fourier channels change residual coefficients with damping and spectral bounds.
- Translation, tilt, and bowl channels have separate bounded rates.
- Current and target share the same parameter limits.
- The surface cannot create arbitrarily large high-frequency energy.

### 7. Score: physical, multi-scale, and difficult to game

Success is evaluated on the realized surface, not on coefficient identity.

A dense sample grid appropriate for the 32-mode bandwidth measures:

- height RMS;
- normal disagreement RMS;
- curvature RMS;
- worst local patch mismatch.

Those are combined into one geometric loss and mapped to `match ∈ [0,1]`.

A hit requires the threshold to remain satisfied for several consecutive sensory ticks. A transient crossing does not count.

### 8. Reward

Reward is the temporal difference of a precision potential:

- small linear progress component when far away;
- exponential component that dominates near success;
- symmetric penalty for regression;
- exactly zero shaping reward when the score does not change.

Local reward uses the same idea on each mismatch cell.

### 9. Curriculum, not actuator inflation

The first version uses three target difficulty presets:

- **coarse** — low-frequency shape + translation;
- **mixed** — low/mid frequencies + global transforms;
- **fine** — all 32 residual modes.

The demo does not unlock thousands of Fourier coefficients. If the 37-action loop works, actuator-count scaling becomes a benchmark built on this architecture, not part of the architecture itself.

### 10. Interface

The interface should answer three questions immediately:

**What is happening?**
- current solid surface;
- target wireframe;
- compact match/reward/hit state.

**What does the fly feel?**
- 8×4 mismatch heatmap;
- toggle among height / slope X / slope Z / curvature / normal / slope magnitude;
- feature RMS summary.

**What is the fly doing?**
- Fourier action bands;
- translation / tilt / bowl actuator values;
- adapter learning magnitude.

Avoid a dashboard full of loosely related cards.

## Reconciliation against the existing implementation

| Existing element | Primary classification | v3 action |
| --- | --- | --- |
| Frozen MaleCNS recurrence | Necessary knowledge | Keep |
| Full 1,314 DN readout | Necessary knowledge | Keep |
| Continuous learning instead of fixed episodes | Necessary knowledge | Keep |
| Relocate same target after success | Necessary knowledge | Keep, but require sustained success |
| Localized multi-statistic discomfort | Necessary knowledge | Keep as the primary task sensor |
| Exponential late-precision shaping | Necessary knowledge | Keep as potential-based progress |
| Runtime neural visualizer registry | Necessary knowledge, orthogonal | Reuse later; do not couple core engine to it |
| 16–4,096 Fourier actuators as primary UX | Superseded decision | Remove from base demo; move to later capacity benchmark |
| Direct DN→N interpolation | Superseded decision | Replace with small learned output adapter |
| Grid resolution as a learned action | Existing is only history for this task | Remove from base demo |
| Coefficient-vector success score | Superseded after reward-hack incident | Replace with physical geometry score |
| 3D retina as mandatory task input | Genuine simplification available | Remove from control loop; keep rendering for humans |
| Many numeric metric cards | Current form not load-bearing | Replace with three causal views: world / feeling / action |
| Existing public `/flydoom-fourier/` route | Not available to replace until successor is reviewed | Keep untouched while `/flydoom-fourier-next/` is evaluated |

## v3

The reconciled version is therefore an **additive successor**, not a patch:

- new route: `/flydoom-fourier-next/`;
- old route remains available for comparison;
- 37-dimensional reachable action space;
- explicit artificial proprioceptive sheet;
- frozen MaleCNS;
- learnable feature gains at input;
- learnable low-rank output readout;
- physical multi-feature score;
- progress-based exponential reward;
- sustained-hit relocation;
- minimal causal UI.

If this version is visibly and experimentally better, it can replace the old route in a later, small reviewable change.

## Concrete task checks

1. **Can the agent distinguish same height but wrong slope?**
   - Yes: slope and normal channels remain non-zero.

2. **Can the agent distinguish same slope but wrong curvature?**
   - Yes: curvature is separately encoded.

3. **Can target ask for a transformation current cannot perform?**
   - No: both are instances of the same 37-parameter state.

4. **Can the agent farm reward by staying near target?**
   - No: shaping uses temporal progress.

5. **Does late precision still pay?**
   - Yes: exponential potential dominates near hit threshold.

6. **Can a sparse sample hide a thin spike?**
   - The active spectral bandwidth is bounded and the physical score sampling density is chosen above its spatial Nyquist requirement; worst-patch disagreement is also included.

7. **Can a reviewer tell what is biological and what is artificial?**
   - Yes: MaleCNS recurrence is frozen biological-connectome-derived computation; proprioceptive mismatch, adapters, arena, target, actions, and reward are artificial.

8. **Can the old demo be recovered while this is evaluated?**
   - Yes: the old route is untouched.

## What this redesign intentionally does not answer yet

- whether 1,314 DNs can control 4,096 Fourier degrees of freedom;
- optimal adaptive mesh resolution;
- comparison against random reservoir / small MLP;
- whether visual scene input improves control.

Those become experiments after the base loop is coherent.
