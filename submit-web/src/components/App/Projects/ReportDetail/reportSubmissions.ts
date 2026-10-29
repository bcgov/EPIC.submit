import { ProjectReport, SubmissionPackage } from "@/models/Package";
import {
  Submission,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
} from "@/models/Submission";
import { StatusChipTheme } from "@/components/Shared/StatusChip";

// The primary ("reports") folder holds the required report/notification
// document; supporting attachments live in a separate folder. Mirrors the
// backend REPORTS_FOLDER constant.
export const REPORTS_FOLDER = "reports";

// The report_type string that identifies a Compliance Self-Report obligation.
// Drives the extra acknowledge hint in the Verify modal and the EAO-only
// "Pending Acknowledgement" card status.
export const COMPLIANCE_SELF_REPORT_TYPE = "Compliance Self-Report";

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

// Document status set shown on the report/notification page. A document starts
// as "Submitted" and, once an EAO staff member verifies it, shows "Verified".
// "Acknowledged" is the terminal state for Compliance Self-Reports.
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  PENDING: "Submitted",
  VERIFIED: "Verified",
  ACKNOWLEDGED: "Acknowledged",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_THEMES: Record<string, StatusChipTheme> = {
  SUBMITTED: "info",
  PENDING: "info",
  VERIFIED: "success",
  ACKNOWLEDGED: "success",
  APPROVED: "success",
  REJECTED: "danger",
};

export const getDocumentStatusLabel = (status?: string): string =>
  (status && STATUS_LABELS[status]) || "Submitted";

export const getDocumentStatusTheme = (status?: string): StatusChipTheme =>
  (status && STATUS_THEMES[status]) || "info";

/**
 * Whether the obligation is a Compliance Self-Report, identified by its
 * report_type. Used to surface the acknowledge hint in the Verify modal.
 */
export const isComplianceSelfReport = (report?: ProjectReport | null): boolean =>
  report?.report_type === COMPLIANCE_SELF_REPORT_TYPE;

/**
 * Whether a document is the obligation's primary ("main") report, as opposed to
 * a supporting attachment. The main report lives in the REPORTS_FOLDER.
 */
export const isMainReportDocument = (submission: Submission): boolean =>
  submission.submitted_document?.folder === REPORTS_FOLDER;

/**
 * Whether a document was uploaded by EAO staff rather than sent by the
 * Regulated Party. EAO-uploaded documents do not get a Verify action.
 *
 * The distinguishing signal is delivered by SUBMIT-1041. Until that field is
 * populated the helper treats every document as Regulated-Party-sent (returns
 * false), so no document is wrongly hidden from verification.
 */
export const isEaoUploaded = (submission: Submission): boolean =>
  submission.is_eao_uploaded === true;

/**
 * Whether a Verify action should be offered for a document on the EAO report
 * page: it must be sent by the Regulated Party and still in the SUBMITTED
 * state (not yet verified/acknowledged).
 */
export const isDocumentVerifiable = (submission: Submission): boolean =>
  !isEaoUploaded(submission) &&
  submission.status === SUBMISSION_STATUS.SUBMITTED;
