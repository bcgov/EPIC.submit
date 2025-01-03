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
  const { setClose, isLoading } = useModal();

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
        <Typography variant="body1">{description}</Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button onClick={setClose} color="secondary" sx={{ border: 0 }}>
          {cancelText ?? "Cancel"}
        </Button>
        <LoadingButton
          loading={isLoading}
          variant="contained"
          onClick={onConfirm}
          color="primary"
        >
          {confirmText ?? "Confirm"}
        </LoadingButton>
      </DialogActions>
    </Box>
  );
};

export default ConfirmationModal;
