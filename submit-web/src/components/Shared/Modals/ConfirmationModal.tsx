import {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
} from "@mui/material";
import { useModal } from "./modalStore";
import { modalStyle } from "./constants";
import { LoadingButton } from "../LoadingButton";

type ConfirmationModalProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
  loading = false,
}) => {
  const { setClose } = useModal();
  return (
    <Box sx={modalStyle}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: "1rem" }}>
        <LoadingButton
          loading={loading}
          variant="contained"
          onClick={onConfirm}
          color="primary"
        >
          {confirmText ?? "Confirm"}
        </LoadingButton>
        <Button onClick={setClose} color="secondary">
          {cancelText ?? "Cancel"}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ConfirmationModal;
