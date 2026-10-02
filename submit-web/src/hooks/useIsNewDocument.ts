import { useMemo } from "react";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";

interface UseIsNewDocumentOptions {
  submission: Submission;
}

/**
 * Determines if a submission should display the "New Document" indicator.
 * Returns true when the submission is a newly added document (minor_version === 1,
 * i.e. it has no replacement chain), is_updated is true, and status is one of
 * PENDING/SUBMITTED/VERIFIED/ACKNOWLEDGED.
 *
 * This mirrors useIsNewVersion but targets additions rather than replacements:
 * a replaced document has minor_version > 1 (New Version), while an added
 * document stays at minor_version === 1 (New Document). The two are therefore
 * mutually exclusive on a single row.
 *
 * The badge relies solely on the backend's is_updated flag to know whether the
 * addition has already been reviewed. The backend clears is_updated once the
 * related update request is accepted, which hides the badge automatically.
 */
export function useIsNewDocument({
  submission,
}: UseIsNewDocumentOptions): boolean {
  return useMemo(() => {
    const allowedStatuses: string[] = [
      SUBMISSION_STATUS.SUBMITTED,
      SUBMISSION_STATUS.PENDING,
      SUBMISSION_STATUS.VERIFIED,
      SUBMISSION_STATUS.ACKNOWLEDGED,
    ];
    if (!allowedStatuses.includes(submission.status)) return false;

    // Replaced documents (minor_version > 1) are handled by useIsNewVersion.
    if (submission.minor_version !== 1) return false;

    // If the backend has cleared is_updated, do not show New Document
    if (!submission.is_updated) return false;

    return true;
  }, [submission.minor_version, submission.status, submission.is_updated]);
}
