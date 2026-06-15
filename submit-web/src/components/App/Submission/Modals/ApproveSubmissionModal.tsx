import { Box, Typography } from "@mui/material";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import OpenUpdateRequestsAlertModal from "./OpenUpdateRequestsAlertModal";

type ApproveSubmissionModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
  hasOpenUpdateRequests: boolean;
  openRequestSectionNames: string[];
};

const ApproveSubmissionModal = ({
  onConfirm,
  onCancel,
  hasOpenUpdateRequests,
  openRequestSectionNames,
}: ApproveSubmissionModalProps) => {
  // Show alert modal when there are open update requests
  if (hasOpenUpdateRequests) {
    return (
      <OpenUpdateRequestsAlertModal
        onClose={onCancel}
        openRequestSectionNames={openRequestSectionNames}
      />
    );
  }

  // Show confirmation modal when no blocking requests
  return (
    <ConfirmationModal
      title="Accept Submission"
      onConfirm={onConfirm}
      onSecondaryAction={onCancel}
      confirmText="Confirm Acceptance"
      secondaryActionText="Cancel"
      description={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "520px",
          }}
        >
          <Typography variant="body1">
            You are confirming that all documents in this submission have been
            verified and acknowledged, and the submission is accepted.
          </Typography>
          <Typography variant="body1">
            The entity will be notified that their submission has been accepted.
            No further changes can be made to this package after acceptance.
          </Typography>
        </Box>
      }
    />
  );
};

export default ApproveSubmissionModal;
