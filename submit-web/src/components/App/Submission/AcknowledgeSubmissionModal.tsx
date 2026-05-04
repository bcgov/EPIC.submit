import { Box, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { BCDesignTokens } from "epic.theme";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";

type AcknowledgeSubmissionModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
  hasOpenUpdateRequests: boolean;
  openRequestSectionNames: string[];
};

const AcknowledgeSubmissionModal = ({
  onConfirm,
  onCancel,
  hasOpenUpdateRequests,
  openRequestSectionNames,
}: AcknowledgeSubmissionModalProps) => {
  return (
    <ConfirmationModal
      title="Acknowledge Submission"
      onConfirm={onConfirm}
      onSecondaryAction={onCancel}
      confirmText="Confirm Acknowledgement"
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
            The proponent will receive an automated email confirming the EAO has
            acknowledged receipt of the submission. Once acknowledged, the
            proponent will no longer be able to submit additional documents.
          </Typography>
          <Typography variant="body1">
            If you need to allow the proponent to resubmit some documents, you
            can send an Update Request before or after acknowledging the
            submission. When an Update Request is open, the submission package
            will remain open for the proponent to resubmit documents.
          </Typography>
        </Box>
      }
    />
  );
};

export default AcknowledgeSubmissionModal;
