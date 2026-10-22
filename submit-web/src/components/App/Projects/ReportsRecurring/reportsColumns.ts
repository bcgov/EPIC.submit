// Fixed column widths shared by the reports table head and rows so that rows
// line up across every phase group. Values are percentages that sum to 100.
export const REPORTS_COLUMNS = [
  { key: "condition", label: "Cond #", width: "8%" },
  { key: "name", label: "Submission Name", width: "27%" },
  { key: "frequency", label: "Frequency", width: "13%" },
  { key: "timing", label: "Timing", width: "30%" },
  { key: "lastSubmitted", label: "Last Submitted", width: "12%" },
  { key: "status", label: "Status", width: "10%" },
] as const;

// Minimum table width so columns keep their proportions and the table scrolls
// horizontally inside a narrow card instead of squashing.
export const REPORTS_TABLE_MIN_WIDTH_PX = 720;
