import {
  Submission,
  SUBMISSION_STATUS,
  NON_CANONICAL_SUBMISSION_STATUS,
} from "@/models/Submission";

// Shared by document rows and the warning before staff send an update request.
export function getDocumentChangeStatus(submission: Submission) {
  const allowedStatuses: string[] = [
    SUBMISSION_STATUS.PENDING,
    SUBMISSION_STATUS.SUBMITTED,
    SUBMISSION_STATUS.VERIFIED,
    SUBMISSION_STATUS.ACKNOWLEDGED,
  ];
  if (!submission.is_updated || !allowedStatuses.includes(submission.status))
    return undefined;
  if (submission.minor_version > 1)
    return NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION;
  if (submission.minor_version === 1)
    return NON_CANONICAL_SUBMISSION_STATUS.NEW_DOCUMENT;
  return undefined;
}
