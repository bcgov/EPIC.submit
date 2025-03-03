import {
  getSubmissionItemForStaffQueryOptions,
  useSaveSubmissionReview,
} from "@/hooks/api/useItems";
import { Grid } from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useFormContext } from "react-hook-form";
import { useMemo, useState } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
} from "@/models/SubmissionReview";
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { consultationSchema, RadioOptions } from "./constants";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { When } from "react-if";
import { useAccount } from "@/store/accountStore";
import {
  checkIfManager,
  checkIfStaff,
} from "@/components/Shared/PermissionGate/utils";

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

  const { roles } = useAccount();
  const isStaff = checkIfStaff(roles);
  const isManager = checkIfManager(roles);

  const { mutateAsync: saveSubmissionReview } = useSaveSubmissionReview({
    itemId: Number(submissionItemId),
    packageId: Number(submissionPackageId),
    accountProjectId: Number(projectId),
  });
  const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
  const [isSendingToManager, setIsSendingToManager] = useState(false);
  const [isCompletingConsultationCheck, setIsCompletingConsultationCheck] =
    useState(false);

  const isLoading =
    isSavingAndClosing || isSendingToManager || isCompletingConsultationCheck;

  const {
    getValues,
    trigger,
    formState: { dirtyFields },
  } = useFormContext();
  const isDirty = Object.keys(dirtyFields).length > 0;

  const navigate = useNavigate();

  const handleSaveAndClose = async () => {
    if (!isDirty || isSaveDisabled) {
      navigate({
        to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}`,
      });
      return;
    }
    const validateAtKey = isStaff ? "staff" : "manager";
    const data = getValues();
    try {
      const decisionData = consultationSchema.validateSyncAt(
        validateAtKey,
        data,
      );

      const passed =
        decisionData.passedConsultationCheck === RadioOptions.YES.value;
      const updateRequestData = passed
        ? {}
        : consultationSchema.validateSyncAt("update_request", data);
      const requestBody = {
        form_answers: {
          ...decisionData,
          ...updateRequestData,
        },
        type: isStaff
          ? SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION
          : SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
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
      const staffDecision = consultationSchema.validateSyncAt(
        "staff",
        getValues(),
      );

      const passed =
        staffDecision.passedConsultationCheck === RadioOptions.YES.value;
      const updateRequestData = passed
        ? {}
        : consultationSchema.validateSyncAt("update_request", getValues());

      const requestBody = {
        status: SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW,
        form_answers: {
          ...staffDecision,
          ...updateRequestData,
        },
        type: SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION,
      };
      await saveSubmissionReview(requestBody);
      setIsSendingToManager(false);
      notify.success("Recommendation sent to manager");
    } catch (error) {
      setIsSendingToManager(false);
      trigger();
      if (isAxiosError(error)) {
        notify.error("Failed to send recommendations to manager");
      }
    }
  };
  const handleCompletingConsultationCheck = async () => {
    try {
      setIsCompletingConsultationCheck(true);

      const managerDecision = consultationSchema.validateSyncAt(
        "manager",
        getValues(),
      );
      const noDecision =
        managerDecision.passedConsultationCheck === RadioOptions.NO.value;
      const updateRequestData = noDecision
        ? consultationSchema.validateSyncAt("update_request", getValues())
        : {};

      const passed =
        managerDecision.passedConsultationCheck === RadioOptions.YES.value;
      const requestBody = {
        status: passed
          ? SUBMISSION_REVIEW_STATUS.APPROVED
          : SUBMISSION_REVIEW_STATUS.REJECTED,
        form_answers: {
          ...managerDecision,
          ...updateRequestData,
        },
        type: SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
      };

      await saveSubmissionReview(requestBody);
      setIsCompletingConsultationCheck(false);
      notify.success("Consultation Check was completed");
    } catch (error) {
      setIsCompletingConsultationCheck(false);
      trigger();
      if (isAxiosError(error)) {
        notify.error("Failed to complete consultation check");
      }
    }
  };

  const isSaveDisabled = useMemo(() => {
    if (!submissionReview) {
      return false;
    }
    if (
      [
        SUBMISSION_REVIEW_STATUS.REJECTED,
        SUBMISSION_REVIEW_STATUS.APPROVED,
      ].includes(submissionReview.status)
    ) {
      return true;
    }

    if (isStaff) {
      return (
        submissionReview.status ===
        SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW
      );
    }
    return false;
  }, [isStaff, submissionReview]);

  return (
    <Grid item xs={12} container spacing={2} mt="20px">
      <When condition={isStaff || isManager}>
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
      </When>
      <When condition={isStaff}>
        <Grid item xs={12} sm="auto">
          <LoadingButton
            disabled={isLoading || isSaveDisabled}
            loading={isSendingToManager}
            onClick={handleSendToManager}
          >
            Send Recommendations to Manager
          </LoadingButton>
        </Grid>
      </When>
      <When condition={isManager}>
        <Grid item xs={12} sm="auto">
          <LoadingButton
            disabled={isLoading || isSaveDisabled}
            loading={isCompletingConsultationCheck}
            onClick={handleCompletingConsultationCheck}
          >
            Complete Consultation Check
          </LoadingButton>
        </Grid>
      </When>
    </Grid>
  );
}
