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
