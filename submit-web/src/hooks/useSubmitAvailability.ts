import { useMemo } from "react";
import { PACKAGE_STATUS, SubmissionPackage } from "@/models/Package";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { SUBMISSION_STATUS } from "@/models/Submission";

interface SubmitAvailability {
  isSubmitDisabled: boolean;
  isPackageWithdrawn: boolean;
  isPackageSubmitted: boolean;
  isPackageAcknowledged: boolean;
  hasUpdatedItems: boolean;
  pendingRequests: SubmissionPackage["update_requests"];
  openRequests: SubmissionPackage["update_requests"];
}

export function useSubmitAvailability(
  submissionPackage: SubmissionPackage | undefined,
): SubmitAvailability {
  const isPackageSubmitted = Boolean(submissionPackage?.submitted_on);

  const isPackageAcknowledged = Boolean(
    submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value),
  );

  const isPackageWithdrawn = Boolean(
    submissionPackage?.status.includes(PACKAGE_STATUS.WITHDRAWN.value),
  );

  const pendingRequests = useMemo(
    () =>
      submissionPackage?.update_requests.filter(
        (req) =>
          req.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
          req.active,
      ) || [],
    [submissionPackage?.update_requests],
  );

  const openRequests = useMemo(
    () =>
      submissionPackage?.update_requests.filter(
        (req) =>
          req.status === UPDATE_REQUEST_STATUS.OPEN.value && req.active,
      ) || [],
    [submissionPackage?.update_requests],
  );

  const hasUpdatedItems = Boolean(
    submissionPackage?.items.some((item) =>
      item.submissions.some(
        (submission) =>
          submission.is_updated &&
          submission.status === SUBMISSION_STATUS.PENDING,
      ),
    ),
  );

  const isSubmitDisabled = useMemo(() => {
    if (hasUpdatedItems) return false;

    // Disable if package is submitted with no pending/open requests
    return (
      (isPackageSubmitted &&
        pendingRequests.length === 0 &&
        openRequests.length === 0) ||
      // Disable if package is acknowledged with no open requests
      (isPackageAcknowledged && openRequests.length === 0)
    );
  }, [
    isPackageSubmitted,
    pendingRequests.length,
    openRequests.length,
    isPackageAcknowledged,
    hasUpdatedItems,
  ]);

  return {
    isSubmitDisabled,
    isPackageWithdrawn,
    isPackageSubmitted,
    isPackageAcknowledged,
    hasUpdatedItems,
    pendingRequests,
    openRequests,
  };
}
