import {
  getSubmissionItemForStaffQueryOptions,
  useSaveSubmissionReview,
} from "@/hooks/api/useItems";
import { Grid } from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { SUBMISSION_REVIEW_STATUS } from "@/models/SubmissionReview";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { consultationSchema } from "./constants";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";

export default function ActionButtons() {
  const {
    projectId,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );
  const submissionReview = submissionItem?.review;
  const isStaff = true;

  const { mutateAsync: saveSubmissionReview } = useSaveSubmissionReview({
    itemId: Number(submissionItemId),
    packageId: Number(submissionPackageId),
    accountProjectId: Number(projectId),
  });
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [isSendingToManager, setIsSendingToManager] = useState(false);

  const isLoading = isSavingAndClosing || isSendingToManager;

  const { getValues, trigger } = useFormContext();

  const navigate = useNavigate();

  const handleSaveAndClose = async () => {
    // Add save logic here
    const validateAtKey = isStaff ? "staff" : "manager";
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
      notify.success("Review saved successfully");
      navigate({
        to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}`,
      });
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
      notify.success("Review saved successfully");
      navigate({
        to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}`,
      });
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
          disabled={
            isLoading ||
            (isStaff &&
              submissionReview?.status ===
                SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW)
          }
          loading={isSavingAndClosing}
        >
          Save & Exit
        </LoadingButton>
      </Grid>
      <Grid item xs={12} sm="auto">
        <LoadingButton
          disabled={
            isLoading ||
            (isStaff &&
              submissionReview?.status ===
                SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW)
          }
          loading={isSendingToManager}
          onClick={handleSendToManager}
        >
          Send Recommendations to Manager
        </LoadingButton>
      </Grid>
    </Grid>
  );
}
