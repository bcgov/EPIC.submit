import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import UndoIcon from "@mui/icons-material/Undo";
import { BCDesignTokens } from "epic.theme";
import { useState, useRef } from "react";

export type VerifyMode = "verify" | "acknowledge";

type ActionSplitButtonProps = Readonly<{
  mode: VerifyMode;
  onVerify: () => void;
  onVerifyAndAcknowledge: () => void;
  onAcknowledge: () => void;
  onUndoVerification: () => void;
}>;

export default function ActionSplitButton({
  mode,
  onVerify,
  onVerifyAndAcknowledge,
  onAcknowledge,
  onUndoVerification,
}: ActionSplitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleClose = () => setMenuOpen(false);

  const isVerifyMode = mode === "verify";

  const primaryLabel = isVerifyMode ? "Verify" : "Acknowledge";
  const primaryAction = isVerifyMode ? onVerify : onAcknowledge;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <ButtonGroup
        ref={anchorRef}
        variant="outlined"
        size="small"
        sx={{
          height: 34,
          borderColor: BCDesignTokens.themeBlue80,
          "& .MuiButtonGroup-grouped": {
            borderColor: `${BCDesignTokens.themeBlue80} !important`,
          },
        }}
      >
        {/* Primary action button */}
        <Button
          onClick={primaryAction}
          startIcon={<CheckIcon sx={{ width: 13, height: 13 }} />}
          sx={{
            fontSize: BCDesignTokens.typographyFontSizeSmallBody,
            fontWeight: 400,
            color: BCDesignTokens.themeBlue80,
            backgroundColor: "transparent",
            textTransform: "none",
            px: 1.5,
            "&:hover": {
              backgroundColor: "rgba(0, 51, 102, 0.06)",
            },
          }}
        >
          {primaryLabel}
        </Button>

        {/* Dropdown toggle */}
        <Button
          size="small"
          onClick={handleToggle}
          sx={{
            minWidth: "28px !important",
            px: 0,
            color: BCDesignTokens.themeBlue80,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 51, 102, 0.06)",
            },
          }}
          aria-label="split button dropdown"
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
        >
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorRef.current}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              mt: 0.5,
              minWidth: 200,
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              overflow: "visible",
            },
          },
        }}
      >
        {isVerifyMode ? (
          <MenuItem
            onClick={() => {
              handleClose();
              onVerifyAndAcknowledge();
            }}
            dense
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <DoneAllIcon
                fontSize="small"
                sx={{ color: BCDesignTokens.themeGray70 }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Verify & Acknowledge"
              primaryTypographyProps={{
                fontSize: BCDesignTokens.typographyFontSizeSmallBody,
              }}
            />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleClose();
              onUndoVerification();
            }}
            dense
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <UndoIcon
                fontSize="small"
                sx={{ color: BCDesignTokens.themeGray70 }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Undo Verification"
              primaryTypographyProps={{
                fontSize: BCDesignTokens.typographyFontSizeSmallBody,
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
