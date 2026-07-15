import { useMemo } from "react";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";
import { UpdateRequest, UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

interface UseIsNewVersionOptions {
  submission: Submission;
  itemTypeId?: number;
  updateRequests?: UpdateRequest[];
}

/**
 * Determines if a submission should display the "New Version" indicator.
 * Returns true when minor_version > 1, status is PENDING/SUBMITTED/VERIFIED/ACKNOWLEDGED,
 * and at least one OPEN update request exists on the package.
 *
 * If the item's own type has an OPEN update request, that's a direct match.
 * If not, we still show "New Version" as long as any other OPEN request exists,
 * since the proponent may have submitted based on that request.
 */
export function useIsNewVersion({
  submission,
  itemTypeId,
  updateRequests,
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

    if (updateRequests) {
      const isOpenOrPendingReview = (ur: UpdateRequest) =>
        ur.active &&
        (ur.status === UPDATE_REQUEST_STATUS.OPEN.value ||
          ur.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value);

      // If the item has its own OPEN/PENDING_REVIEW update request, always show new version
      if (itemTypeId !== undefined) {
        const hasOwnOpenRequest = updateRequests.some(
          (ur) => isOpenOrPendingReview(ur) && ur.submission_item_types.includes(itemTypeId),
        );
        if (hasOwnOpenRequest) return true;
      }

      // Otherwise, show new version if any OPEN/PENDING_REVIEW update request exists on the package
      const hasAnyOpenRequest = updateRequests.some(isOpenOrPendingReview);
      if (!hasAnyOpenRequest) return false;
    }

    return true;
  }, [submission.minor_version, submission.status, submission.is_updated, itemTypeId, updateRequests]);
}
