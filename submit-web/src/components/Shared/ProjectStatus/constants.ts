export const PROJECT_STATUS = {
  EARLY_ENGAGEMENT: "EARLY_ENGAGEMENT",
  POST_DECISION: "POST_DECISION",
};

export type ProjectStatusKey = keyof typeof PROJECT_STATUS;

// Maps API display strings to PROJECT_STATUS keys
const DISPLAY_NAME_TO_STATUS: Record<string, ProjectStatusKey> = {
  "Post Decision": "POST_DECISION",
  "Early Engagement": "EARLY_ENGAGEMENT",
};

export const getProjectStatus = (
  displayName: string,
): ProjectStatusKey | string =>
  DISPLAY_NAME_TO_STATUS[displayName] ?? displayName;

/**
 * Text shown in place of the phase name for work-related submissions, e.g.
 * "Submitting documents for Pre-EA/Early Engagement". Falls back to the
 * given phase name when no label is configured for the phase.
 */
export const getSubmissionPhaseStatus = (
  phaseLabel: string | null | undefined,
  fallback: string,
): string => {
  const label = phaseLabel?.trim();
  return label ? `Submitting documents for ${label}` : fallback;
};

/**
 * Whether a phase display name resolves to the Post-Decision project status.
 * Used to gate Post-Decision-only sections (e.g. Reports & Recurring
 * Submissions, Management Plans) off a work's current phase name.
 */
export const isPostDecisionStatus = (phaseName?: string | null): boolean =>
  !!phaseName && getProjectStatus(phaseName) === PROJECT_STATUS.POST_DECISION;
