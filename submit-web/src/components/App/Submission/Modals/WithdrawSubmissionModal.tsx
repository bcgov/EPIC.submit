import { Box, Typography, Modal } from "@mui/material";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";

type WithdrawSubmissionModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

const WithdrawSubmissionModal = ({
  onConfirm,
  onCancel,
}: WithdrawSubmissionModalProps) => {
  return (
    <Modal
      open={true}
      onClose={onCancel}
      aria-labelledby="withdraw-submission-modal"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box>
        <ConfirmationModal
          title="Withdraw Submission"
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmText="Withdraw Submission"
          confirmButtonColor="error"
          cancelText="Cancel"
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
                Withdrawing this submission will cancel the current EAO review. A
                new package will be created automatically, allowing you to make
                changes and resubmit. This action cannot be undone.
              </Typography>
            </Box>
          }
        />
      </Box>
    </Modal>
  );
};

export default WithdrawSubmissionModal;
