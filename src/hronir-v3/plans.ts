import type {
  EvaluationEffect,
  EvaluationPlan,
  ProjectionDefinition,
} from "./types.js";

export const EDITORIAL_CALIBRATION_PLAN: EvaluationPlan = {
  type: "Evaluation Plan",
  id: "editorial-work-calibration",
  version: 1,
  question: "Qual obra oferece a experiência editorial mais forte?",
  subject: "work",
  observedThrough: "expression-revision",
  population: { publishableOnly: true, mediaKind: "text" },
  languagePolicy: "balanced-expression",
  lens: { kind: "calibration" },
  sampling: { policy: "information-gain", cooldownDays: 7 },
  effects: ["editorial-work-ranking", "revision-attention"],
  stoppingRule: { assignments: 5 },
};

export const AFFECTIVE_EXPERIMENT_PLAN: EvaluationPlan = {
  type: "Evaluation Plan",
  id: "affective-chain",
  version: 1,
  question: "Como estas revisões são recebidas nesta leitura afetiva?",
  subject: "revision",
  observedThrough: "expression-revision",
  population: { publishableOnly: true, mediaKind: "text" },
  languagePolicy: "balanced-expression",
  lens: { kind: "affective-chain" },
  sampling: { policy: "coverage", cooldownDays: 7 },
  effects: ["affective-experiment"],
  stoppingRule: { assignments: 5 },
};

export const MEDIA_AUDIO_PLAN: EvaluationPlan = {
  type: "Evaluation Plan",
  id: "media-audio-calibration",
  version: 1,
  question: "Qual gravação oferece a experiência musical mais forte?",
  subject: "media",
  observedThrough: "media-revision",
  population: { publishableOnly: true, mediaKind: "audio" },
  languagePolicy: "not-applicable",
  lens: { kind: "media" },
  sampling: { policy: "coverage", cooldownDays: 7 },
  effects: ["media-ranking"],
  stoppingRule: { assignments: 5 },
};

export const BUILTIN_PLANS = [
  EDITORIAL_CALIBRATION_PLAN,
  AFFECTIVE_EXPERIMENT_PLAN,
  MEDIA_AUDIO_PLAN,
] as const;

export const EDITORIAL_WORK_PROJECTION: ProjectionDefinition = {
  type: "Projection",
  id: "editorial-work-ranking",
  version: 1,
  acceptsEffects: ["editorial-work-ranking"],
  mediaKind: "text",
};

export function validatePlan(plan: EvaluationPlan): string[] {
  const errors: string[] = [];
  if (!plan.id.trim()) errors.push("plan id is required");
  if (!Number.isInteger(plan.version) || plan.version < 1) {
    errors.push("plan version must be a positive integer");
  }
  if (!plan.question.trim()) errors.push("plan question is required");
  if (plan.effects.length === 0) errors.push("plan must declare effects");
  if (new Set(plan.effects).size !== plan.effects.length) {
    errors.push("plan effects must be unique");
  }
  if (plan.stoppingRule.assignments < 1) {
    errors.push("stopping rule must request at least one assignment");
  }
  if (plan.sampling.cooldownDays < 0) {
    errors.push("sampling cooldown cannot be negative");
  }

  const has = (effect: EvaluationEffect) => plan.effects.includes(effect);
  if (plan.lens.kind === "affective-chain" && has("editorial-work-ranking")) {
    errors.push("affective-chain cannot affect the editorial work ranking");
  }
  if (plan.lens.kind === "perspective" && has("editorial-work-ranking")) {
    errors.push("a situated perspective cannot affect the editorial work ranking");
  }
  if (plan.population.mediaKind === "audio") {
    if (plan.observedThrough !== "media-revision" || plan.subject !== "media") {
      errors.push("audio plans must observe media revisions");
    }
    if (plan.effects.some((effect) => effect !== "media-ranking")) {
      errors.push("audio plans may only affect media projections");
    }
  } else if (has("media-ranking")) {
    errors.push("text plans cannot affect media projections");
  }
  return errors;
}

export function planCanFeedProjection(
  plan: EvaluationPlan,
  projection: ProjectionDefinition
): boolean {
  if (plan.population.mediaKind !== projection.mediaKind) return false;
  return projection.acceptsEffects.some((effect) =>
    plan.effects.includes(effect)
  );
}

