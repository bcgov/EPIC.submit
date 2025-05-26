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
import { BCDesignTokens } from "epic.theme";
import CloseIcon from "@mui/icons-material/Close";
import { modalStyle } from "@/components/Shared/Modals/constants";

type UserManagementModalProps = {
  title: string;
  description: string;
  instructions: string[];
  onClose: () => void;
};

const UserManagementModal = ({
  title,
  description,
  instructions,
  onClose,
}: UserManagementModalProps) => {
  return (
    <Box sx={modalStyle}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <DialogTitle
          sx={{
            color: BCDesignTokens.themeBlue100,
            fontWeight: 700,
            fontSize: "1.5rem",
            p: 3,
          }}
        >
          {title}
        </DialogTitle>
        <IconButton onClick={onClose} sx={{ mr: 2 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: BCDesignTokens.typographyColorPrimary,
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
        <Box
          sx={{
            bgcolor: BCDesignTokens.surfaceColorBackgroundLightGray,
            p: 2,
            borderRadius: 1,
            border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
          }}
        >
          {instructions.map((instruction, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: BCDesignTokens.typographyColorSecondary,
                mb: index === instructions.length - 1 ? 0 : 1,
                pl: 2,
                position: "relative",
                "&::before": {
                  content: '"•"',
                  position: "absolute",
                  left: 0,
                  color: BCDesignTokens.themeBlue100,
                },
              }}
            >
              {instruction}
            </Typography>
          ))}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{
            minWidth: 100,
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Box>
  );
};

export default UserManagementModal;
