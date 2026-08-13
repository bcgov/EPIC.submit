import { useMemo } from "react";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";

interface UseIsNewVersionOptions {
  submission: Submission;
}

/**
 * Determines if a submission should display the "New Version" indicator.
 * Returns true when minor_version > 1, is_updated is true, and status is
 * one of PENDING/SUBMITTED/VERIFIED/ACKNOWLEDGED.
 *
 * The badge relies solely on the backend's is_updated flag to know whether
 * the new version has already been reviewed. The backend clears is_updated
 * once a staff member verifies/acknowledges the submission, which hides
 * the badge automatically.
 */
export function useIsNewVersion({
  submission,
}: UseIsNewVersionOptions): boolean {
  return useMemo(() => {
    const allowedStatuses: string[] = [
      SUBMISSION_STATUS.SUBMITTED,
      SUBMISSION_STATUS.PENDING,
      SUBMISSION_STATUS.VERIFIED,
      SUBMISSION_STATUS.ACKNOWLEDGED,
    ];
    if (!allowedStatuses.includes(submission.status))
      return false;

    if (submission.minor_version <= 1) return false;

    // If the backend has cleared is_updated, do not show New Version
    if (!submission.is_updated) return false;

    return true;
  }, [submission.minor_version, submission.status, submission.is_updated]);
}
