import { Submission, SUBMISSION_SORT_ORDER } from "@/models/Submission";

const uploadTime = (submission: Submission) =>
  Date.parse(submission.created_date) || 0;

// Priority always comes first. Reports show newest uploads first; package tables show oldest first.
export const orderDocumentsBySortOrder = (
  submissions: Submission[],
  dateOrder: "asc" | "desc" = "asc",
): Submission[] =>
  [...submissions].sort(
    (a, b) =>
      (a.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT) -
        (b.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT) ||
      (dateOrder === "asc" ? 1 : -1) * (uploadTime(a) - uploadTime(b)),
  );
