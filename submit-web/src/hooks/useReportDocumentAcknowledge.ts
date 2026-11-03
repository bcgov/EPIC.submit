import { useAcknowledgeReportDocument } from "./api/useSubmissions";

interface UseReportDocumentAcknowledgeOptions {
  packageId?: number;
}

/**
 * Orchestrates acknowledging a single Compliance Self-Report main report for EAO
 * staff.
 *
 * Wraps the acknowledge mutation to move a verified main report from VERIFIED to
 * ACKNOWLEDGED. This is the second staff step after Verify and has no undo. The
 * caller (the Acknowledge modal) owns open/close and error display: `acknowledge`
 * resolves on success and rejects on failure so the modal can stay open and show
 * an inline error without the status changing.
 */
export function useReportDocumentAcknowledge({
  packageId,
}: UseReportDocumentAcknowledgeOptions) {
  const { mutateAsync, isPending } = useAcknowledgeReportDocument({ packageId });

  const acknowledge = (submissionId: number) =>
    mutateAsync({ submissionId });

  return { acknowledge, isAcknowledging: isPending };
}
