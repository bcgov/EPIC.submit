import { ProjectReport, SubmissionPackage } from "@/models/Package";
import {
  Submission,
  SUBMISSION_STATUS,
  SUBMISSION_SORT_ORDER,
  SUBMISSION_TYPE,
} from "@/models/Submission";
import { StatusChipTheme } from "@/components/Shared/StatusChip";

// The report_type string that identifies a Compliance Self-Report obligation.
// Drives the extra acknowledge hint in the Verify modal and the EAO-only
// "Pending Acknowledgement" card status.
export const COMPLIANCE_SELF_REPORT_TYPE = "Compliance Self-Report";

/**
 * Returns every document submission across all items of a report package,
 * sorted by document priority first, then newest upload first within each priority.
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
      (a.sort_order ?? SUBMISSION_SORT_ORDER.MAIN_DOCUMENT) -
        (b.sort_order ?? SUBMISSION_SORT_ORDER.MAIN_DOCUMENT) ||
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
 * a supporting attachment. The upload priority is stored on the submission.
 */
export const isMainReportDocument = (submission: Submission): boolean =>
  submission.sort_order === SUBMISSION_SORT_ORDER.MAIN_DOCUMENT;

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

/**
 * Whether an Acknowledge action should be offered for a document on the EAO
 * report page: the second staff step after Verify, for Compliance Self-Reports
 * only. It must be the Regulated-Party-sent main report of a Compliance
 * Self-Report obligation and currently VERIFIED. Supporting documents,
 * EAO-uploaded documents, other report types, and non-verified documents never
 * show it.
 */
export const isDocumentAcknowledgeable = (
  submission: Submission,
  report?: ProjectReport | null,
): boolean =>
  isComplianceSelfReport(report) &&
  isMainReportDocument(submission) &&
  !isEaoUploaded(submission) &&
  submission.status === SUBMISSION_STATUS.VERIFIED;
