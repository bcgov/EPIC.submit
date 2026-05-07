import { Box, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { BCDesignTokens } from "epic.theme";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";

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
          {hasOpenUpdateRequests && (
            <WarningBox sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <WarningAmberOutlinedIcon
                  sx={{ color: BCDesignTokens.supportBorderColorWarning }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Open Update Requests
                  </Typography>
                  <Typography variant="body2">
                    The following sections have open update requests:{" "}
                    <b>{openRequestSectionNames.join(", ")}</b>
                  </Typography>
                </Box>
              </Box>
            </WarningBox>
          )}
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
