import React, { useState, useRef } from "react";
import {
  Button,
  ButtonGroup,
  MenuItem,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuList,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export interface SplitButtonOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface SplitButtonProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  options: SplitButtonOption[];
  size?: "small" | "medium" | "large";
  variant?: "text" | "outlined" | "contained";
  disabled?: boolean;
  color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  primaryLabel,
  onPrimaryClick,
  options,
  size = "small",
  variant = "contained",
  disabled = false,
  color = "primary",
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handlePrimaryClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onPrimaryClick();
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleOptionClick = (option: SplitButtonOption) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!option.disabled) {
      option.onClick();
      setOpen(false);
    }
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant={variant}
        size={size}
        disabled={disabled}
        color={color}
        ref={anchorRef}
        aria-label="split button"
        sx={{
          height: size === "small" ? "32px" : undefined,
          boxShadow: "none",
          "& .MuiButton-root": {
            borderColor: "transparent",
          },
        }}
      >
        <Button
          onClick={handlePrimaryClick}
          sx={{
            textTransform: "none",
            fontSize: size === "small" ? "14px" : "16px",
            px: 2,
            fontWeight: 400,
            borderRight: "1px solid rgba(255, 255, 255, 0.3) !important",
          }}
        >
          {primaryLabel}
        </Button>
        <Button
          size={size}
          aria-controls={open ? "split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="menu"
          onClick={handleToggle}
          sx={{
            px: 0.5,
            minWidth: size === "small" ? "32px" : "40px",
            borderLeft: "none !important",
          }}
        >
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1300,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 0.5,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={index}
                      disabled={option.disabled}
                      onClick={handleOptionClick(option)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};
