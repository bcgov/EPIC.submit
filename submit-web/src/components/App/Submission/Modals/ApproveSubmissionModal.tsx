import { Box, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { BCDesignTokens } from "epic.theme";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import AlertModal from "@/components/Shared/Modals/AlertModal";

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
      <AlertModal
        title="Cannot Approve Package"
        onClose={onCancel}
        closeText="Close"
        description={
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "520px",
            }}
          >
            <WarningBox sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <WarningAmberOutlinedIcon
                  sx={{ color: BCDesignTokens.supportBorderColorWarning }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Package will be Locked
                  </Typography>
                  <Typography variant="body2">
                    Package cannot be approved while there are open update requests.
                    The following sections have open update requests:{" "}
                    <b>{openRequestSectionNames.join(", ")}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please accept or withdraw all update requests before approving this package.
                  </Typography>
                </Box>
              </Box>
            </WarningBox>
          </Box>
        }
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
