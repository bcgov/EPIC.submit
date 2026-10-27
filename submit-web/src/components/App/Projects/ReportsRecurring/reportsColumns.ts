// Fixed column widths shared by the reports table head and rows so that rows
// line up across every phase group. Badge/short-value columns are fixed px
// sized to their content; Timing takes a share of the remainder and
// Submission Name ("auto") absorbs the rest.
export const REPORTS_COLUMNS = [
  { key: "condition", label: "Cond #", width: "80px" },
  { key: "name", label: "Submission Name", width: "auto" },
  { key: "frequency", label: "Frequency", width: "136px" },
  { key: "timing", label: "Timing", width: "34%" },
  { key: "lastSubmitted", label: "Last Submitted", width: "136px" },
  { key: "status", label: "Status", width: "168px" },
] as const;

// Minimum table width so columns keep their proportions and the table scrolls
// horizontally inside a narrow card instead of squashing.
export const REPORTS_TABLE_MIN_WIDTH_PX = 1000;