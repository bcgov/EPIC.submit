import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useModal } from "./modalStore";
import { modalStyle } from "./constants";
import CloseIcon from "@mui/icons-material/Close";

interface UpdateModalProps {
  title: string;
  description: string;
}

const UpdateModal = ({ title, description }: UpdateModalProps) => {
  const { setClose } = useModal();

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
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {description}
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button onClick={setClose} color="primary" sx={{ mr: 1 }}>
          Close
        </Button>
      </DialogActions>
    </Box>
  );
};

export default UpdateModal;
