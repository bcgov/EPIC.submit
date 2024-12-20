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

type ConfirmationModalProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
}) => {
  const { setClose } = useModal();
  return (
    <Box sx={modalStyle}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: "1rem" }}>
        <Button variant="contained" onClick={onConfirm} color="primary">
          {confirmText || "Confirm"}
        </Button>
        <Button onClick={setClose} color="secondary">
          {cancelText || "Cancel"}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ConfirmationModal;
