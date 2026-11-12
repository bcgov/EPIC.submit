import { Submission, SUBMISSION_SORT_ORDER } from "@/models/Submission";
import dateUtils from "@/utils/dateUtils";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const uploadTime = (submission: Submission) =>
  Date.parse(submission.created_date) || 0;

/**
 * The date a document counts as submitted, as YYYY-MM-DD.
 *
 * Documents EAO staff added carry the date the EAO received them, a plain date
 * shown as-is (no timezone shift). Every other document uses its upload date in
 * local time. Returns "" when no usable date exists.
 */
export const getSubmissionDate = (submission: Submission): string => {
  if (submission.received_date) {
    return submission.received_date;
  }
  const formatted = dateUtils.formatDate(submission.created_date);
  return DATE_ONLY.test(formatted) ? formatted : "";
};

// Priority always comes first. Reports show newest uploads first; package tables show oldest first.
// Within a priority, documents order by the date they count as submitted, then by upload time.
export const orderDocumentsBySortOrder = (
  submissions: Submission[],
  dateOrder: "asc" | "desc" = "asc",
): Submission[] => {
  const direction = dateOrder === "asc" ? 1 : -1;
  return [...submissions].sort(
    (a, b) =>
      (a.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT) -
        (b.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT) ||
      direction *
        getSubmissionDate(a).localeCompare(getSubmissionDate(b)) ||
      direction * (uploadTime(a) - uploadTime(b)),
  );
};
