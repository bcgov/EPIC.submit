import { useUpdateSubmissionStatus } from "./api/useSubmissions";
import { SUBMISSION_STATUS } from "@/models/Submission";

interface UseReportDocumentVerifyOptions {
  packageId?: number;
}

/**
 * Orchestrates verifying a single report/notification document for EAO staff.
 *
 * Wraps the submission-status mutation to move a document from SUBMITTED to
 * VERIFIED. There is no undo on the report page, so only a verify action is
 * exposed. The caller (the Verify modal) owns open/close and error display:
 * `verify` resolves on success and rejects on failure so the modal can stay
 * open and show an inline error without the status changing.
 */
export function useReportDocumentVerify({
  packageId,
}: UseReportDocumentVerifyOptions) {
  const { mutateAsync, isPending } = useUpdateSubmissionStatus({ packageId });

  const verify = (submissionId: number) =>
    mutateAsync({ submissionId, status: SUBMISSION_STATUS.VERIFIED });

  return { verify, isVerifying: isPending };
}
