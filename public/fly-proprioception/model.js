// Qualitative, hand-written FeCO-inspired channels; not fitted biological rates.
export const CHANNELS = Object.freeze([
  "clawFlexion",
  "clawExtension",
  "hookFlexion",
  "hookExtension",
  "clubMovement",
]);
export const LIMITS = Object.freeze({ min: 20, max: 160 });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
// Angle is the included femur–tibia angle: increasing = extension.
// Amplitude/frequency limits are demonstration choices, not anatomical estimates.
export function passiveState(
  time,
  { center = 90, amplitude = 45, frequency = 0.2 } = {}
) {
  finite(time, "time");
  finite(center, "center");
  finite(amplitude, "amplitude");
  finite(frequency, "frequency");
  if (
    time < 0 ||
    center < 20 ||
    center > 160 ||
    amplitude < 0 ||
    amplitude > 70 ||
    frequency < 0 ||
    frequency > 1
  )
    throw new RangeError("outside demonstration limits");
  const safeAmplitude = Math.min(
    amplitude,
    center - LIMITS.min,
    LIMITS.max - center
  );
  const phase = 2 * Math.PI * frequency * time;
  return {
    angleDeg: center + safeAmplitude * Math.sin(phase),
    velocityDegPerSec:
      safeAmplitude * 2 * Math.PI * frequency * Math.cos(phase),
    timeSec: time,
    source: "passive",
  };
}
export function encodeFeCO(state) {
  const angle = finite(state.angleDeg, "angleDeg");
  const velocity = finite(state.velocityDegPerSec, "velocityDegPerSec");
  if (angle < LIMITS.min || angle > LIMITS.max)
    throw new RangeError("angle outside demonstration limits");
  const extension = (angle - LIMITS.min) / (LIMITS.max - LIMITS.min);
  // Normalization at 180 deg/s is arbitrary and explicitly not a fitted gain.
  return {
    clawFlexion: 1 - extension,
    clawExtension: extension,
    hookFlexion: clamp(-velocity / 180, 0, 1),
    hookExtension: clamp(velocity / 180, 0, 1),
    clubMovement: clamp(Math.abs(velocity) / 180, 0, 1),
  };
}
// Initial state only. The optional worker must verify the pinned artifact and
// audited identities before replacing this with exploratory model summaries.
export function neuralFrame() {
  return {
    status: "NOT_CONNECTED",
    activity: null,
    mapping: null,
    reason: "The connectome has not been loaded and verified.",
  };
}
