import { orderDocumentsBySortOrder } from "@/utils/submissionDocuments";
import { SubmissionPackage } from "@/models/Package";
import {
  Submission,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
} from "@/models/Submission";
import { StatusChipTheme } from "@/components/Shared/StatusChip";

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
  return orderDocumentsBySortOrder(documents, "desc");
};

// Label and grey theme for a document EAO staff uploaded on behalf of the
// Regulated Party. Takes precedence over the verify/acknowledge status.
export const UPLOADED_BY_EAO_LABEL = "Uploaded by EAO";
const UPLOADED_BY_EAO_THEME: StatusChipTheme = "neutral";

// Document status set shown on the report/notification page. A document starts
// as "Submitted" and, once an EAO staff member verifies it, shows "Verified".
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

/**
 * Label for a document row badge. An EAO-uploaded document always reads
 * "Uploaded by EAO" regardless of its verify/acknowledge status; otherwise the
 * status maps to Submitted/Verified/Acknowledged (defaulting to "Submitted").
 */
export const getDocumentStatusLabel = (submission?: Submission): string => {
  if (submission && isEaoUploaded(submission)) {
    return UPLOADED_BY_EAO_LABEL;
  }
  const status = submission?.status;
  return (status && STATUS_LABELS[status]) || "Submitted";
};

/**
 * Theme for a document row badge. An EAO-uploaded document is grey (neutral);
 * otherwise the status maps to its theme (defaulting to the "info"/blue
 * "Submitted" theme).
 */
export const getDocumentStatusTheme = (
  submission?: Submission,
): StatusChipTheme => {
  if (submission && isEaoUploaded(submission)) {
    return UPLOADED_BY_EAO_THEME;
  }
  const status = submission?.status;
  return (status && STATUS_THEMES[status]) || "info";
};

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
