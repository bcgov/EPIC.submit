import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { checkIfManager } from "@/components/Shared/PermissionGate/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useUndoStaffRecommendation } from "@/hooks/api/useItems";
import { useAccount } from "@/store/accountStore";
import { Button, Box } from "@mui/material";
import { When } from "react-if";
import { isAxiosError } from "axios";
import { openModal } from "@/components/Shared/Modals/modalStore";
import { useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SUBMISSION_REVIEW_STATUS } from "@/models/SubmissionReview";

export default function UndoTMRecommendationButton({
  submissionItem
}: {
  submissionItem?: SubmissionItem;
}) {
  const {
    projectId,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const submissionReview = submissionItem?.review;


  const { roles } = useAccount();
  const isManager = checkIfManager(roles);

  const { mutateAsync: undoRecommendation, isPending: isUndoing } =
    useUndoStaffRecommendation({
      itemId: Number(submissionItemId),
      packageId: Number(submissionPackageId),
      accountProjectId: Number(projectId),
    });

  const isUndoEnabled = useMemo(() => {
    return (
      isManager &&
      submissionReview?.status === SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW
    );
  }, [isManager, submissionReview]);

  const handleUndoRecommendation = () => {
    openModal(
      <ConfirmationModal
        title="Undo Team Member Recommendation"
        description="This action will remove the Team Member recommendation and allow them to continue working on the review. Once the review is complete, the recommendation must be resubmitted for manager's approval."
        confirmText="Confirm Undo"
        onConfirm={async () => {
          try {
            await undoRecommendation();
            notify.success("Team Member recommendation has been undone.");
          } catch (error) {
            if (isAxiosError(error)) {
              notify.error("Failed to undo Team Member recommendation.");
            }
          }
        }}
      />,
    );
  };

  return (
    <When condition={isManager}>
      <Box sx={{ justifyContent: "flex-end", display: "flex", mb: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          disabled={!isUndoEnabled || isUndoing}
          onClick={handleUndoRecommendation}
        >
          Undo Team Member Recommendation
        </Button>
      </Box>
    </When>
  );
}

