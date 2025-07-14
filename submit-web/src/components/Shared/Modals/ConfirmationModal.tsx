import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import { useModal } from "./modalStore";
import { modalStyle } from "./constants";
import { LoadingButton } from "../LoadingButton";
import CloseIcon from "@mui/icons-material/Close";

type ConfirmationModalProps = {
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  // Either show cancel or secondary action, but not both
  cancelText?: string;
  onCancel?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
  onCancel,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const { setClose, isLoading } = useModal();

  const handleCancel = () => {
    onCancel?.();
    setClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleSecondaryAction = () => {
    onSecondaryAction?.();
    setClose();
  };

  // Only show cancel button if secondary action is not provided
  const showCancel = !secondaryActionText;

  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle>{title}</DialogTitle>
        <IconButton onClick={setClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent>
        {typeof description === "string" ? (
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {description}
          </Typography>
        ) : (
          description
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        {showCancel ? (
          <Button onClick={handleCancel} color="secondary" sx={{ border: 0 }}>
            {cancelText ?? "Cancel"}
          </Button>
        ) : (
          <Button
            onClick={handleSecondaryAction}
            color="secondary"
            sx={{ border: 0 }}
          >
            {secondaryActionText}
          </Button>
        )}
        <LoadingButton
          loading={isLoading}
          variant="contained"
          onClick={handleConfirm}
          color="primary"
        >
          {confirmText ?? "Confirm"}
        </LoadingButton>
      </DialogActions>
    </Box>
  );
};

export default ConfirmationModal;
