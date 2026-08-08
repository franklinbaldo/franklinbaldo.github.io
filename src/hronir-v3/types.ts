export type EvaluationSubject = "work" | "expression" | "revision" | "media";

export type EvaluationEffect =
  | "editorial-work-ranking"
  | "situated-reading"
  | "affective-experiment"
  | "media-ranking"
  | "revision-attention";

export type EvaluationLens =
  | { kind: "calibration" }
  | { kind: "perspective"; perspectiveId: string }
  | { kind: "affective-chain"; perspectiveId?: string }
  | { kind: "media"; perspectiveId?: string };

export interface EvaluationPlan {
  type: "Evaluation Plan";
  id: string;
  version: number;
  question: string;
  subject: EvaluationSubject;
  observedThrough: "expression-revision" | "media-revision";
  population: {
    publishableOnly: boolean;
    mediaKind: "text" | "audio";
  };
  languagePolicy:
    | "balanced-expression"
    | "same-language"
    | "not-applicable";
  lens: EvaluationLens;
  sampling: {
    policy: "coverage" | "information-gain" | "refine-top" | "hunt-worst";
    cooldownDays: number;
  };
  effects: EvaluationEffect[];
  stoppingRule: {
    assignments: number;
  };
}

export interface RevisionTarget {
  kind: "revision";
  workId: string;
  expressionId: string;
  revisionId: string;
  language: string;
  contentDigest: string;
  blobOid: string | null;
  observedInCommits: string[];
  pathAtAssignment: string;
}

export interface MediaTarget {
  kind: "media";
  workId: string | null;
  mediaId: string;
  revisionId: string;
  mediaKind: "audio";
  contentDigest: string;
}

export type EvaluationTarget = RevisionTarget | MediaTarget;

export interface Assignment {
  type: "Assignment";
  id: string;
  planId: string;
  planVersion: number;
  planDigest: string;
  seed: string;
  evaluatorId: string;
  createdAt: string;
  sideA: EvaluationTarget;
  sideB: EvaluationTarget;
}

export interface AssignmentState {
  type: "Assignment State";
  id: string;
  assignmentId: string;
  status: "pending" | "completed" | "aborted";
}

export type Preference = "a" | "b" | "tie" | "incomparable";

export interface EvaluationEvidence {
  side: "a" | "b";
  anchor: string;
  observation: string;
}

export interface Evaluation {
  type: "Evaluation";
  id: string;
  assignmentId: string;
  planId: string;
  planVersion: number;
  planDigest: string;
  evaluatorId: string;
  modelId: string;
  promptVersion: string;
  submittedAt: string;
  preference: Preference;
  confidence: number;
  ratings: {
    a: { editorialQuality: number | null };
    b: { editorialQuality: number | null };
  };
  evidence: EvaluationEvidence[];
  critiqueA: string;
  critiqueB: string;
  comparison: string;
}

export interface ProjectionDefinition {
  type: "Projection";
  id: string;
  version: number;
  acceptsEffects: EvaluationEffect[];
  mediaKind: "text" | "audio";
}

