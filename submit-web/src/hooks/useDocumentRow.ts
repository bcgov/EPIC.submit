import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import {
  PACKAGE_STATUS,
  PackageType,
  SubmissionPackage,
  SubmissionPackageType,
} from "@/models/Package";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { isAxiosError } from "axios";
import { useUpdateSubmissionStatus } from "./api/useSubmissions";
import { useState } from "react";
import { useIsNewVersion } from "./useIsNewVersion";

interface UseDocumentRowOptions {
  documentSubmission: Submission;
  submissionItem?: SubmissionItem;
  submissionPackage?: SubmissionPackage;
  packageType?: PackageType;
}

export function useDocumentRow({
  documentSubmission,
  submissionItem,
  submissionPackage,
  packageType,
}: UseDocumentRowOptions) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ─── Derived State ────────────────────────────────────────────────────────

  const name = documentSubmission.submitted_document?.name || "";
  const url = documentSubmission.submitted_document?.url || "";

  const isPackageReadyForAcknowledgement = !!submissionPackage?.status.includes(
    PACKAGE_STATUS.READY_FOR_ACKNOWLEDGEMENT.value,
  );

  const isPackageAcknowledged = !!submissionPackage?.status.includes(
    PACKAGE_STATUS.ACKNOWLEDGED.value,
  );

  const isAdditionalInfo =
    packageType?.name === SubmissionPackageType.ADDITIONAL_INFORMATION;

  const showUndoVerificationButton =
    isAdditionalInfo &&
    !isPackageAcknowledged &&
    documentSubmission.status === SUBMISSION_STATUS.VERIFIED;

  const showUndoAcknowledgementButton =
    !isAdditionalInfo &&
    documentSubmission.status === SUBMISSION_STATUS.ACKNOWLEDGED &&
    !submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value);

  const showDefaultActionButton =
    !submissionPackage?.completed_on &&
    !submissionPackage?.account_project_work;

  const isNewVersion = useIsNewVersion({
    submission: documentSubmission,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const { mutateAsync: updateSubmissionStatus } = useUpdateSubmissionStatus({
    packageId: submissionPackage?.id,
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.VERIFIED,
      });
      notify.success("Document verified");
    } catch (e) {
      notify.error("Failed to verify document");
    }
  };

  const handleAcknowledge = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.ACKNOWLEDGED,
      });
      notify.success("Document acknowledged");
    } catch (e) {
      notify.error("Failed to acknowledge document");
    }
  };

  const handleUndoVerification = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.SUBMITTED,
      });
      notify.success("Verification undone");
    } catch (e) {
      notify.error("Failed to undo verification");
    }
  };

  const handleUndoAcknowledge = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.VERIFIED,
      });
      notify.success("Acknowledgement undone");
    } catch (e) {
      notify.error("Failed to undo acknowledgement");
    }
  };

  const openDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response?.data?.message ?? "Failed to download document")
        : "Failed to download document";
      notify.error(errorMessage);
    } finally {
      setPendingGetObject(false);
    }
  };

  return {
    pendingGetObject,
    expanded,
    setExpanded,
    isPackageReadyForAcknowledgement,
    isAdditionalInfo,
    showUndoVerificationButton,
    showUndoAcknowledgementButton,
    showDefaultActionButton,
    isNewVersion,
    handleVerify,
    handleAcknowledge,
    handleUndoVerification,
    handleUndoAcknowledge,
    openDocument,
  };
}
