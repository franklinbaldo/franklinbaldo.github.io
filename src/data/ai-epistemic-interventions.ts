export type InterventionStatus =
  | "planned"
  | "posted"
  | "awaiting_response"
  | "engaged"
  | "experiment_running"
  | "adopted"
  | "declined"
  | "dormant"
  | "closed";

export interface AiEpistemicIntervention {
  slug: string;
  caseSlug: string;
  targetRepository: string;
  targetUrl?: string;
  issueOrPrUrl?: string;
  interventionKind: string;
  status: InterventionStatus;
  hypothesis: string;
  disclosure: string;
  followupAllowed: boolean;
  followupGate: string;
  relatedCaseSlugs?: string[];
  baselineSnapshot?: string;
  lastTouchAt?: string;
  responseSignal?: string;
  nextTouchReason?: string;
  result?: string;
  notes?: string[];
  created: string;
  updated: string;
}

type InterventionModule = {
  frontmatter: {
    type: "ai-epistemic-intervention";
    case_slug: string;
    target_repository: string;
    target_url?: string;
    issue_or_pr_url?: string;
    intervention_kind: string;
    status: InterventionStatus;
    hypothesis: string;
    disclosure: string;
    followup_allowed: boolean;
    followup_gate: string;
    related_case_slugs?: string[];
    baseline_snapshot?: string;
    last_touch_at?: string | Date;
    response_signal?: string;
    next_touch_reason?: string;
    result?: string;
    notes?: string[];
    created: string | Date;
    updated: string | Date;
  };
};

const modules = import.meta.glob<InterventionModule>(
  "../../knowledge/ai-epistemic-interventions/*.md",
  { eager: true },
);

const asDate = (value: string | Date | undefined) =>
  value instanceof Date ? value.toISOString() : value ? String(value) : undefined;

export const aiEpistemicInterventions: AiEpistemicIntervention[] = Object.entries(modules)
  .map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;
    const card = module.frontmatter;
    return {
      slug,
      caseSlug: card.case_slug,
      targetRepository: card.target_repository,
      targetUrl: card.target_url,
      issueOrPrUrl: card.issue_or_pr_url,
      interventionKind: card.intervention_kind,
      status: card.status,
      hypothesis: card.hypothesis,
      disclosure: card.disclosure,
      followupAllowed: card.followup_allowed,
      followupGate: card.followup_gate,
      relatedCaseSlugs: card.related_case_slugs,
      baselineSnapshot: card.baseline_snapshot,
      lastTouchAt: asDate(card.last_touch_at),
      responseSignal: card.response_signal,
      nextTouchReason: card.next_touch_reason,
      result: card.result,
      notes: card.notes,
      created: asDate(card.created) ?? "",
      updated: asDate(card.updated) ?? "",
    };
  })
  .sort((a, b) => b.updated.localeCompare(a.updated));
