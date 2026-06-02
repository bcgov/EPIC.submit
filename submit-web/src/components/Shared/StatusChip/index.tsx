import { Chip, SxProps, Theme } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import React, { ReactNode } from "react";

// Base styles that apply to all status chips
const baseChipStyles: SxProps<Theme> = {
  borderRadius: "4px",
  height: "24px",
  px: 1,
  "& .MuiChip-label": {
    overflow: "visible",
  },
};

// Predefined color themes
export type StatusChipTheme =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "orange"
  | "purple"
  | "neutral"
  | "decision";

type ThemeColors = {
  border: string;
  background: string;
};

const themeColors: Record<StatusChipTheme, ThemeColors> = {
  success: {
    border: BCDesignTokens.supportBorderColorSuccess,
    background: BCDesignTokens.supportSurfaceColorSuccess,
  },
  info: {
    border: BCDesignTokens.themeBlue100,
    background: BCDesignTokens.themeBlue20,
  },
  warning: {
    border: BCDesignTokens.supportBorderColorWarning,
    background: BCDesignTokens.supportSurfaceColorWarning,
  },
  danger: {
    border: BCDesignTokens.supportBorderColorDanger,
    background: BCDesignTokens.supportSurfaceColorDanger,
  },
  orange: {
    border: "#F18A15",
    background: "#FFDEB8",
  },
  purple: {
    border: "#9B6BDA",
    background: "#F6E4FF",
  },
  neutral: {
    border: BCDesignTokens.surfaceColorBorderMedium,
    background: BCDesignTokens.surfaceColorSecondaryButtonDisabled,
  },
  decision: {
    border: EAOColors.DecisionDark,
    background: EAOColors.DecisionLight,
  },
};

export type StatusChipProps = Readonly<{
  label: string;
  theme?: StatusChipTheme;
  customColors?: {
    border?: string;
    background?: string;
  };
  icon?: ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
}>;

/**
 * Shared StatusChip component for displaying status badges across the application.
 * 
 * Features:
 * - Consistent base styles (4px border radius, 24px height, 1px border)
 * - Predefined color themes (success, info, warning, danger, orange, purple, neutral, decision)
 * - Custom color override support
 * - Icon support
 * - Style override via sx prop
 * 
 * @example
 * // Using predefined theme
 * <StatusChip label="Approved" theme="success" />
 * 
 * @example
 * // Using custom colors
 * <StatusChip 
 *   label="Custom Status" 
 *   customColors={{ border: "#123456", background: "#ABCDEF" }}
 * />
 * 
 * @example
 * // With icon and style overrides
 * <StatusChip 
 *   label="Verified" 
 *   theme="success" 
 *   icon={<CheckIcon />}
 *   sx={{ width: "100px" }}
 * />
 */
export function StatusChip({
  label,
  theme,
  customColors,
  icon,
  sx,
  className,
}: StatusChipProps) {
  // Determine colors: custom colors take precedence over theme
  const colors = customColors || (theme ? themeColors[theme] : undefined);

  if (!colors) {
    return null;
  }

  return (
    <Chip
      label={label}
      icon={icon as React.ReactElement}
      sx={
        [
          baseChipStyles,
          {
            border: `1px solid ${colors.border}`,
            background: colors.background,
          },
          sx,
        ] as SxProps<Theme>
      }
      className={className}
    />
  );
}
