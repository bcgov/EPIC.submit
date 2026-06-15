import {
  Box,
  Typography,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { BCDesignTokens } from "epic.theme";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { modalStyle } from "@/components/Shared/Modals/constants";

type OpenUpdateRequestsAlertModalProps = {
  onClose: () => void;
  openRequestSectionNames: string[];
};

const OpenUpdateRequestsAlertModal = ({
  onClose,
  openRequestSectionNames,
}: OpenUpdateRequestsAlertModalProps) => {
  const { setClose } = useModal();

  const handleClose = () => {
    onClose?.();
    setClose();
  };

  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle>Resolve Update Requests to Proceed</DialogTitle>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "520px",
          }}
        >
          <WarningBox sx={{ p: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <WarningAmberOutlinedIcon
                sx={{ color: BCDesignTokens.supportBorderColorWarning }}
              />
              <Box sx={{ width: "100%" }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Open Update Requests
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  A package decision cannot be made while update requests are pending.
                  The following sections have open requests:
                </Typography>
                <Box
                  component="ul"
                  sx={{
                    mt: 1,
                    mb: 1,
                    pl: 2,
                    "& li": {
                      mb: 0.5,
                    },
                  }}
                >
                  {openRequestSectionNames.map((sectionName, index) => (
                    <li key={index}>
                      <Typography variant="body2">{sectionName}</Typography>
                    </li>
                  ))}
                </Box>
                <Typography variant="body2">
                  Accept or withdraw all open update requests to continue.
                </Typography>
              </Box>
            </Box>
          </WarningBox>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button variant="contained" onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Box>
  );
};

export default OpenUpdateRequestsAlertModal;
