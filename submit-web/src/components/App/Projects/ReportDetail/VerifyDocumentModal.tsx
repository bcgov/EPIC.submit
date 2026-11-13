import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useId } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { modalStyle } from "@/components/Shared/Modals/constants";

type VerifyDocumentModalProps = {
  fileName: string;
  // Verifies the document. Resolves on success (the modal closes); rejects on
  // failure (the modal stays open and shows an inline error).
  onVerify: () => Promise<unknown>;
};

/**
 * Confirmation modal for verifying a single report/notification document. There
 * is no undo. Closing it (Cancel, the close icon, Escape or an outside click)
 * changes nothing. On a save failure the modal stays open and shows the error.
 */
export const VerifyDocumentModal = ({
  fileName,
  onVerify,
}: VerifyDocumentModalProps) => {
  const { setClose } = useModal();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const handleConfirm = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      await onVerify();
      setClose();
    } catch {
      setError("Failed to verify the document. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Box
      sx={modalStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle id={titleId}>Verify Document</DialogTitle>
        <IconButton onClick={setClose} aria-label="Close verify document">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent id={descriptionId}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "min(90vw, 520px)",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {fileName}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button onClick={setClose} color="secondary" sx={{ border: 0 }}>
          Cancel
        </Button>
        <LoadingButton
          loading={isVerifying}
          variant="contained"
          color="primary"
          onClick={handleConfirm}
        >
          Confirm Verification
        </LoadingButton>
      </DialogActions>
    </Box>
  );
};

export default VerifyDocumentModal;
