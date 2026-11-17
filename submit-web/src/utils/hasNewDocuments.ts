import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/models/Submission";

/**
 * True when the package has at least one document that has not been submitted
 * yet (status PENDING). Already-submitted documents are ignored.
 */
export const hasNewDocuments = (
  submissionPackage: SubmissionPackage,
): boolean =>
  submissionPackage.items.some((item) =>
    item.submissions.some(
      (submission) =>
        submission.type === SUBMISSION_TYPE.DOCUMENT &&
        submission.status === SUBMISSION_STATUS.PENDING &&
        submission.submitted_document_id !== undefined &&
        submission.submitted_document_id !== null,
    ),
  );
