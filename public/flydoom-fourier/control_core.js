const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

export function spectralEnvelopeForMode(mode, complexity = 0.55) {
  const cutoff = 1.8 + complexity * 23;
  const slope = 1.35 - complexity * 0.65;
  return (
    Math.exp(-Math.pow(mode.freq / cutoff, 1.35)) /
    Math.pow(Math.max(1, mode.freq), slope)
  );
}

export function coefficientLimitForMode(mode, complexity = 0.55) {
  const envelope = spectralEnvelopeForMode(mode, complexity);
  return clamp(0.03 + envelope * 0.92, 0.03, 0.95);
}

export function velocityLimitForMode(mode, complexity = 0.55) {
  const envelope = spectralEnvelopeForMode(mode, complexity);
  return clamp(0.025 + envelope * 0.45, 0.025, 0.475);
}

export function boundCoefficient(value, mode, complexity = 0.55) {
  const limit = coefficientLimitForMode(mode, complexity);
  return clamp(value, -limit, limit);
}

export function boundVelocity(value, mode, complexity = 0.55) {
  const limit = velocityLimitForMode(mode, complexity);
  return clamp(value, -limit, limit);
}

/**
 * Reward-safe shape score.
 *
 * The surface is parameterized by a unique Fourier coefficient vector plus
 * an explicit translation. Comparing those latent physical parameters avoids
 * the sparse-probe aliasing that allowed narrow high-frequency spikes to score
 * as a hit between sampled points.
 */
export function robustShapeMatch({
  coeff,
  target,
  modes,
  count,
  complexity = 0.55,
  currentOffsetX = 0,
  currentOffsetZ = 0,
  targetOffsetX = 0,
  targetOffsetZ = 0,
}) {
  const n = Math.max(
    1,
    Math.min(count ?? coeff.length, coeff.length, target.length, modes.length),
  );
  let squared = 0;
  let worst = 0;

  for (let k = 0; k < n; k++) {
    const scale = Math.max(0.03, coefficientLimitForMode(modes[k], complexity));
    const normalizedError = (coeff[k] - target[k]) / scale;
    squared += normalizedError * normalizedError;
    worst = Math.max(worst, Math.abs(normalizedError));
  }

  const rms = Math.sqrt(squared / n);
  const translationError =
    Math.hypot(
      currentOffsetX - targetOffsetX,
      currentOffsetZ - targetOffsetZ,
    ) / 4.8;

  // The max-error term prevents a single unsampled high-frequency mode from
  // hiding inside the mean over hundreds or thousands of Fourier coefficients.
  const loss = 0.7 * rms + 0.22 * worst + 0.7 * translationError;
  return clamp(Math.exp(-loss), 0, 1);
}
