import { StatusChip } from "@/components/Shared/StatusChip";
import RefreshIcon from "@mui/icons-material/Refresh";
import React from "react";

export type BadgeVariant = "update-requested" | "updated" | "new-version";

type BadgeConfig = {
  label: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  icon?: React.ReactElement;
};

const badgeConfigs: Record<BadgeVariant, BadgeConfig> = {
  "update-requested": {
    label: "Update Requested",
    backgroundColor: "#ffdeb8",
    borderColor: "#f18a15",
    textColor: "#2d2d2d",
  },
  updated: {
    label: "Updated",
    backgroundColor: "#f6e4ff",
    borderColor: "#9b6bda",
    textColor: "#2d2d2d",
  },
  "new-version": {
    label: "New Version",
    backgroundColor: "#d8eafd",
    borderColor: "#255a90",
    textColor: "#2d2d2d",
    icon: <RefreshIcon sx={{ fontSize: "14px", mr: 0.5 }} />,
  },
};

type SubmissionBadgeProps = Readonly<{
  variant: BadgeVariant;
  className?: string;
}>;

export function SubmissionBadge({ variant, className }: SubmissionBadgeProps) {
  const config = badgeConfigs[variant];

  return (
    <StatusChip
      icon={config.icon}
      label={config.label}
      className={className}
      customColors={{
        background: config.backgroundColor,
        border: config.borderColor,
      }}
      sx={{
        color: config.textColor,
        fontSize: "12px",
        fontWeight: 400,
        lineHeight: "18px",
        "& .MuiChip-label": {
          px: 1,
          py: 0.25,
        },
        "& .MuiChip-icon": {
          color: config.textColor,
          ml: 0.5,
        },
      }}
    />
  );
}
