import { useSaveSubmissionReview } from "@/hooks/api/useItems";
import { Grid } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";
import { consultationSchema } from "./ReviewSection";
import { useState } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { SUBMISSION_REVIEW_STATUS } from "@/models/SubmissionReview";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export default function ActionButtons() {
  const {
    projectId,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { mutateAsync: saveSubmissionReview } = useSaveSubmissionReview({
    itemId: Number(submissionItemId),
    packageId: Number(submissionPackageId),
    accountProjectId: Number(projectId),
  });
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [isSendingToManager, setIsSendingToManager] = useState(false);

  const isLoading = isSavingAndClosing || isSendingToManager;

  const { getValues, trigger } = useFormContext();

  const handleSaveAndClose = async () => {
    // Add save logic here
    const role = "staff";
    const validateAtKey = role === "staff" ? "staff" : "manager";
    const data = getValues();
    try {
      const validData = consultationSchema.validateSyncAt(validateAtKey, data);
      const requestBody = {
        form_answers: {
          [validateAtKey]: validData,
        },
      };
      setIsSavingAndClosing(true);
      await saveSubmissionReview(requestBody);
      setIsSavingAndClosing(false);
    } catch (error) {
      trigger();
      setIsSavingAndClosing(false);
      if (isAxiosError(error)) {
        notify.error("Failed to save review");
      }
    }
  };
  const handleSendToManager = async () => {
    try {
      setIsSendingToManager(true);
      const validData = consultationSchema.validateSyncAt("staff", getValues());
      const requestBody = {
        status: SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW,
        form_answers: validData,
      };
      await saveSubmissionReview(requestBody);
      setIsSendingToManager(false);
    } catch (error) {
      setIsSendingToManager(false);
      trigger();
      if (isAxiosError(error)) {
        notify.error("Failed to send recommendations to manager");
      }
    }
  };
  return (
    <Grid item xs={12} container spacing={2}>
      <Grid item xs={12} sm="auto">
        <LoadingButton
          color="secondary"
          onClick={handleSaveAndClose}
          disabled={isLoading}
          loading={isSavingAndClosing}
        >
          Save & Exit
        </LoadingButton>
      </Grid>
      <Grid item xs={12} sm="auto">
        <LoadingButton
          disabled={isLoading}
          loading={isSendingToManager}
          onClick={handleSendToManager}
        >
          Send Recommendations to Manager
        </LoadingButton>
      </Grid>
    </Grid>
  );
}
