import { ProponentStatusFilterOptions } from "@/models/Proponent";
import { Box } from "@mui/material";
import { StatusChip, StatusChipTheme } from "@/components/Shared/StatusChip";
import { BCDesignTokens } from "epic.theme";

const STATUS_LABELS = {
  ELIGIBLE: "Eligible",
  INVITE_GENERATED: "Invite Generated",
  PENDING_ONBOARDING: "Pending Onboarding",
  INVITE_EXPIRED: "Invite Expired",
  INELIGIBLE: "Ineligible",
  ONBOARDED: "Onboarded",
} as const;

type StatusStyle = {
  label: string;
  theme?: StatusChipTheme;
  customColors?: {
    background: string;
    border: string;
  };
};

const statusStyles: Record<ProponentStatusFilterOptions, StatusStyle> = {
  ELIGIBLE: {
    label: STATUS_LABELS.ELIGIBLE,
    theme: "purple",
  },
  INVITE_GENERATED: {
    label: STATUS_LABELS.INVITE_GENERATED,
    theme: "info",
  },
  PENDING_ONBOARDING: {
    label: STATUS_LABELS.PENDING_ONBOARDING,
    theme: "info",
  },
  INVITE_EXPIRED: {
    label: STATUS_LABELS.INVITE_EXPIRED,
    theme: "danger",
  },
  INELIGIBLE: {
    label: STATUS_LABELS.INELIGIBLE,
    theme: "orange",
  },
  ONBOARDED: {
    label: STATUS_LABELS.ONBOARDED,
    theme: "success",
  },
};

type ProponentStatusChipProps = Readonly<{
  status: ProponentStatusFilterOptions | null | undefined;
}>;

export function ProponentStatusChip({ status }: ProponentStatusChipProps) {
  if (!status || !statusStyles[status]) {
    return null;
  }

  const style = statusStyles[status];

  return (
    <Box>
      <StatusChip
        label={style.label}
        theme={style.theme}
        customColors={style.customColors}
        sx={{
          fontSize: BCDesignTokens.typographyFontSizeSmallBody,
          fontWeight: BCDesignTokens.typographyFontWeightMedium,
          color: BCDesignTokens.typographyColorPrimary,
        }}
      />
    </Box>
  );
}

