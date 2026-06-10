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
import { BCDesignTokens } from "epic.theme";
import { useState, useRef, ReactNode } from "react";

export type SplitButtonAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
};

type ActionSplitButtonProps = Readonly<{
  primaryAction: SplitButtonAction;
  secondaryActions: SplitButtonAction[];
}>;

export default function ActionSplitButton({
  primaryAction,
  secondaryActions,
}: ActionSplitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleClose = () => setMenuOpen(false);

  if (secondaryActions.length === 0) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={primaryAction.onClick}
        startIcon={primaryAction.icon}
        sx={{
          height: 25,
          fontSize: "12px",
          fontWeight: 400,
          color: "#036",
          borderColor: "#036",
          textTransform: "none",
          px: 1.5,
          borderRadius: "3px",
          "&:hover": {
            backgroundColor: "rgba(0, 51, 102, 0.06)",
            borderColor: "#036",
          },
        }}
      >
        {primaryAction.label}
      </Button>
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <ButtonGroup
        ref={anchorRef}
        variant="outlined"
        size="small"
        sx={{
          height: 25,
          borderColor: "#036",
          "& .MuiButtonGroup-grouped": {
            borderColor: "#036 !important",
          },
        }}
      >
        {/* Primary action button */}
        <Button
          onClick={primaryAction.onClick}
          startIcon={primaryAction.icon}
          sx={{
            fontSize: "12px",
            fontWeight: 400,
            color: "#036",
            textTransform: "none",
            px: 1.5,
            "&:hover": {
              backgroundColor: "rgba(0, 51, 102, 0.06)",
            },
          }}
        >
          {primaryAction.label}
        </Button>

        {/* Dropdown toggle */}
        <Button
          size="small"
          onClick={handleToggle}
          sx={{
            minWidth: "28px !important",
            px: 0,
            color: "#036",
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
        {secondaryActions.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => {
              handleClose();
              action.onClick();
            }}
            dense
            sx={{ py: 1, px: 2 }}
          >
            {action.icon && (
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Box
                  sx={{
                    display: "flex",
                    fontSize: "small",
                    color: BCDesignTokens.themeGray70,
                  }}
                >
                  {action.icon}
                </Box>
              </ListItemIcon>
            )}
            <ListItemText
              primary={action.label}
              primaryTypographyProps={{
                fontSize: BCDesignTokens.typographyFontSizeSmallBody,
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
