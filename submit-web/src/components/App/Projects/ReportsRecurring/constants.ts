export const ALL_PHASES = "All Phases";

// Canonical display order for phase groups. "All Phases" is always first and is
// rendered specially (always expanded, not collapsible).
export const PHASE_ORDER: string[] = [
  ALL_PHASES,
  "Post-Issuance",
  "Pre-Construction",
  "Construction",
  "Operations",
  "Closure",
  "Post-Closure",
];

export const REPORTS_EMPTY_STATE_MESSAGE =
  "No reports or notifications have been identified for this project yet.";

// Card width below which the reports table scrolls horizontally inside the card.
export const REPORTS_TABLE_SCROLL_BREAKPOINT_PX = 760;
