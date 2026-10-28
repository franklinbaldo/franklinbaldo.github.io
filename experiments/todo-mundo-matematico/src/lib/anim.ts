import { Easing, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entre `a` e `b`, com easing suave. */
export const ramp = (frame: number, a: number, b: number, easing = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

/** Rampa linear. */
export const lin = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], clamp);

/** Interpolação por keyframes com clamp. */
export const kf = (frame: number, input: number[], output: number[], easing = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, input, output, { ...clamp, easing });

/** Mola que começa em `at`. */
export const pop = (frame: number, at: number, fps = 30, damping = 11, mass = 0.6) =>
  spring({ frame: frame - at, fps, config: { damping, mass, stiffness: 140 } });

/** Mola sem overshoot. */
export const soft = (frame: number, at: number, fps = 30) =>
  spring({ frame: frame - at, fps, config: { damping: 200 } });

/** Oscilação contínua (respiração, flutuação). */
export const wobble = (frame: number, period = 60, amp = 1, phase = 0) =>
  Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

/** Tremor nervoso determinístico. */
export const shake = (frame: number, intensity: number, seed = 1) =>
  intensity === 0
    ? [0, 0]
    : [
        Math.sin(frame * 1.7 + seed) * intensity + Math.sin(frame * 3.1 + seed * 2) * intensity * 0.5,
        Math.cos(frame * 2.3 + seed) * intensity + Math.cos(frame * 4.3 + seed) * intensity * 0.4,
      ];

/** Piscar de olhos: retorna 0..1 (1 = olho aberto). */
export const blink = (frame: number, seed = 0) => {
  const period = 97 + ((seed * 37) % 53);
  const f = (frame + seed * 13) % period;
  return f < 3 ? [0.6, 0.1, 0.6][f] : 1;
};

/** Visível só dentro de [a, b). */
export const within = (frame: number, a: number, b: number) => frame >= a && frame < b;
