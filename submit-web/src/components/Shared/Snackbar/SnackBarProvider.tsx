import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useSnackbar } from "./snackbarStore";

const severityStyles = {
  success: {
    backgroundColor: BCDesignTokens.supportSurfaceColorSuccess,
    border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
    color: BCDesignTokens.supportBorderColorSuccess,
  },
  error: {
    backgroundColor: BCDesignTokens.supportSurfaceColorDanger,
    border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
    color: BCDesignTokens.supportBorderColorDanger,
  },
  warning: {
    backgroundColor: BCDesignTokens.supportSurfaceColorWarning,
    border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
    color: BCDesignTokens.supportBorderColorWarning,
  },
  info: {
    backgroundColor: BCDesignTokens.supportSurfaceColorInfo,
    border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
    color: BCDesignTokens.supportBorderColorInfo,
  },
};

const SnackBarProvider: React.FC = () => {
  const { isOpen, setClose, severity, message, autoHideDuration } = useSnackbar();

  return (
    <Snackbar
      open={isOpen}
      onClose={setClose}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={setClose}
        severity={severity}
        variant="outlined"
        sx={{
          width: "100%",
          borderRadius: "4px",
          ...severityStyles[severity],
          "& .MuiAlert-icon": {
            color: "inherit",
          },
          "& .MuiIconButton-root": {
            color: "inherit",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackBarProvider;
