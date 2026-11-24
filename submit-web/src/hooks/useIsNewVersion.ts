import { NON_CANONICAL_SUBMISSION_STATUS, Submission } from "@/models/Submission";
import { getDocumentChangeStatus } from "@/utils/documentChanges";

export function useIsNewVersion({ submission }: { submission: Submission }): boolean {
  return getDocumentChangeStatus(submission) === NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION;
}
