import { SubmissionPackage } from "@/models/Package";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { StatusChipTheme } from "@/components/Shared/StatusChip";

/**
 * Returns every document submission across all items of a report package,
 * sorted by submission date, newest first.
 */
export const getReportDocumentSubmissions = (
  reportPackage?: SubmissionPackage,
): Submission[] => {
  if (!reportPackage?.items?.length) {
    return [];
  }
  const documents = reportPackage.items.flatMap((item) =>
    item.submissions.filter((s) => s.type === SUBMISSION_TYPE.DOCUMENT),
  );
  return [...documents].sort(
    (a, b) =>
      new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
  );
};

// The real status set is to be defined; until then a document is shown as
// "Submitted" (matching the wireframe placeholder).
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  VERIFIED: "Verified",
  ACKNOWLEDGED: "Acknowledged",
  PENDING: "Submitted",
};

const STATUS_THEMES: Record<string, StatusChipTheme> = {
  SUBMITTED: "info",
  APPROVED: "success",
  REJECTED: "danger",
  VERIFIED: "success",
  ACKNOWLEDGED: "success",
  PENDING: "info",
};

export const getDocumentStatusLabel = (status?: string): string =>
  (status && STATUS_LABELS[status]) || "Submitted";

export const getDocumentStatusTheme = (status?: string): StatusChipTheme =>
  (status && STATUS_THEMES[status]) || "info";
