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
import CloseIcon from "@mui/icons-material/Close";

type AlertModalProps = {
  title: string;
  description: string | React.ReactNode;
  onClose?: () => void;
  closeText?: string;
};

const AlertModal: React.FC<AlertModalProps> = ({
  title,
  description,
  onClose,
  closeText = "Close",
}) => {
  const { setClose } = useModal();

  const handleClose = () => {
    onClose?.();
    setClose();
  };

  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle>{title}</DialogTitle>
        <IconButton onClick={handleClose}>
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
        <Button
          variant="contained"
          onClick={handleClose}
          color="primary"
        >
          {closeText}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default AlertModal;
