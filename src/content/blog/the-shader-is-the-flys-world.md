---
type: Blog Post
title: "The Shader Is the Fly’s World"
description: "Close the loop between a fly connectome and a Fourier-parameterized shader: give the descending neurons the knobs, feed the result back to the visual system, and look for attractors and sensorimotor operators."
docType: essay
date: 2026-10-05
author: franklin
tags:
  - connectome
  - neuroscience
  - drosophila
  - dynamical systems
  - fourier
  - shaders
emoji: "🪰"
---

Imagine a fly looking at a screen.

On that screen, instead of showing a photograph or a prerecorded movie, we render a shader: moving textures, gradients, edges, oscillations, patterns and optical flow.

There are knobs controlling this world.

Contrast. Direction. Velocity. Spatial frequency. Temporal frequency. Orientation. Phase. Motion.

Now give the knobs to the fly.

Not literally, of course.

Give them to its brain.

## A world made of Fourier modes

Instead of treating the shader as a collection of arbitrary parameters, we can describe its visual field through a Fourier basis.

A complicated visual pattern can then be understood as a combination of simpler modes: different spatial frequencies, orientations, phases and temporal dynamics.

The knobs become coefficients.

Turn one coefficient and a particular structure becomes stronger. Turn another and it disappears. Change their phases and the world moves.

This gives us a relatively compact mathematical space in which a nervous system can act.

And this is where the connectome enters the picture.

## Connect the knobs to the connectome

We now have increasingly detailed maps of the fly nervous system.

Suppose we simulate activity propagating from the visual system through the central nervous system and eventually into descending neurons — the neurons through which the brain normally influences the body.

Normally, those descending signals would ultimately contribute to turning, walking, flying, stopping or changing posture.

But we can intercept them.

Instead of sending those signals to muscles, map them onto the coefficients controlling our shader.

The descending layer of the connectome gets the knobs.

The shader changes.

And then we show the resulting shader back to the fly's visual system.

Now we have closed the loop:

```text
visual stimulus → sensory system → CNS → descending neurons → Fourier coefficients → shader → visual stimulus
```

The shader is no longer merely a visualization of neural activity.

The shader is the fly's world.

## What happens when we close the loop?

This is where the experiment becomes interesting.

We are not telling the system what visual world it should produce.

We let the connectome interact with it.

Perhaps nothing interesting happens.

Perhaps the dynamics explode into noise.

But perhaps the coupled system begins settling into particular configurations.

Certain combinations of Fourier modes might become stable. Others might oscillate. Some might produce repeating trajectories through stimulus space.

In dynamical-systems language, we could start looking for attractors.

In biological language, something more interesting may be happening:

we may be observing the nervous system constructing the sensory consequences of its own actions.

A fly does not normally experience vision passively. Movement changes vision. Turning produces optic flow. Forward motion expands the visual field. Rotations transform edges and textures in predictable ways.

Perception and action therefore form a loop.

Our shader gives us an artificial world in which that loop is explicit, controllable and measurable.

## Perturb the world

Now we can do something even more useful.

Perturb one Fourier component.

Inject a particular spatial frequency. Rotate an orientation. Shift a phase. Increase one temporal mode.

Then watch what happens.

Does the connectome amplify the perturbation?

Suppress it?

Transform it into another mode?

Return the visual field toward its previous state?

Move toward an entirely different attractor?

Instead of merely asking:

> What does this neuron respond to?

we can ask:

> What transformations of its sensory world can this circuit produce?

That is a much more causal question.

## From neurons to operators

There is another way to describe the experiment.

A perturbation enters the visual field.

It propagates through the nervous system.

The nervous system produces descending activity.

That activity transforms the visual field.

The transformed field becomes the next input.

So rather than characterizing a circuit only by correlations between neurons and stimuli, we can characterize it by the transformations it repeatedly performs.

If similar perturbations across different visual scenes produce similar transformations, we may have identified something resembling a sensorimotor operator.

For example, a circuit might behave approximately like:

```text
rotation → counter-rotation
```

or

```text
expansion → deceleration
```

or

```text
asymmetric motion → corrective turn
```

But we do not need to specify those operators beforehand.

We can search for them.

The Fourier representation is useful precisely because it gives us a vocabulary for measuring transformations without deciding in advance what they mean.

## A connectome as a controller

This also suggests a different way of thinking about connectome simulation.

Instead of asking whether a simulated connectome reproduces every spike of a biological animal, ask whether parts of the connectome can function as controllers inside an environment.

Give the network something it can influence.

Close the sensory loop.

Perturb it.

Then measure what kinds of invariants, attractors and transformations emerge.

A nervous system evolved inside a causal loop between perception and action. Perhaps some of its organization becomes easier to understand when we put that loop back.

The first experiment does not need a realistic world.

It can be a shader.

A handful of Fourier modes.

A simulated visual pathway.

A descending layer.

And some knobs.

Then we give the knobs to the fly.

And see what kind of world it makes.

## Try it

So I built the first experiment. Twelve drifting Fourier modes are the whole world. A frozen MaleCNS connectome (165,122 neurons) looks at it through an 8×4 eye, and its 1,314 descending neurons, through a fixed random projection, push the twelve complex coefficients. Nothing is trained. Turn on auto-probe and the empirical operator fills in: which mode the circuit amplifies, which it suppresses, which it converts into another.

<div style="margin: 1.5rem 0;">
  <div style="margin-bottom: .6rem;">
    <a
      href="/fly-shader/"
      target="_blank"
      rel="noopener"
      style="display:inline-block;padding:.55rem .8rem;border:1px solid #30363d;border-radius:8px;text-decoration:none;"
    >
      🪰 Open the demo on its own page ↗
    </a>
  </div>
  <iframe
    src="/fly-shader/index.html"
    width="100%"
    height="1320"
    style="border: 2px solid #30363d; border-radius: 10px; background: #05090d;"
    title="The Shader Is the Fly’s World: MaleCNS holding the knobs of a Fourier shader"
    loading="lazy"
  ></iframe>
</div>
