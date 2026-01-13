import { ProponentStatus } from "@/models/Proponent";
import { Box, Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

const STATUS_LABELS = {
  ELIGIBLE: "Eligible",
  PENDING_ONBOARDING: "Pending Onboarding",
  INELIGIBLE: "Ineligible",
  ONBOARDED: "Onboarded",
} as const;

type StatusStyle = {
  background: string;
  borderColor: string;
  label: string;
};

const statusStyles: Record<ProponentStatus, StatusStyle> = {
  ELIGIBLE: {
    background: "#F6E4FF",
    borderColor: "#9B6BDA",
    label: STATUS_LABELS.ELIGIBLE,
  },
  PENDING_ONBOARDING: {
    background: "#D8EAFD",
    borderColor: "#1E5189",
    label: STATUS_LABELS.PENDING_ONBOARDING,
  },
  INELIGIBLE: {
    background: "#FFDEB8",
    borderColor: "#F18A15",
    label: STATUS_LABELS.INELIGIBLE,
  },
  ONBOARDED: {
    background: "#F6FFF8",
    borderColor: "#42814A",
    label: STATUS_LABELS.ONBOARDED,
  },
};

type ProponentStatusChipProps = Readonly<{
  status: ProponentStatus | null | undefined;
}>;

export function ProponentStatusChip({ status }: ProponentStatusChipProps) {
  if (!status || !statusStyles[status]) {
    return null;
  }

  const style = statusStyles[status];

  return (
    <Box>
      <Chip
        label={style.label}
        sx={{
          borderRadius: "2px",
          height: "24px",
          border: `1px solid ${style.borderColor}`,
          background: style.background,
          fontSize: BCDesignTokens.typographyFontSizeSmallBody,
          fontWeight: BCDesignTokens.typographyFontWeightMedium,
          color: BCDesignTokens.typographyColorPrimary,
        }}
      />
    </Box>
  );
}

