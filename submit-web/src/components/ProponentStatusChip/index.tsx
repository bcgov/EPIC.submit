import { ProponentStatus } from "@/models/Proponent";
import { Box, Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};

const statusStyles: Record<ProponentStatus, StyleProps> = {
  ELIGIBLE: {
    sx: {
      borderRadius: "2px",
      border: "1px solid #9B6BDA",
      background: "#F6E4FF",
      height: "24px",
    },
    label: "Eligible",
  },
  PENDING_ONBOARDING: {
    sx: {
      borderRadius: "2px",
      border: "1px solid #1E5189",
      background: "#D8EAFD",
      height: "24px",
    },
    label: "Pending Onboarding",
  },
  INELIGIBLE: {
    sx: {
      borderRadius: "2px",
      border: "1px solid #F18A15",
      background: "#FFDEB8",
      height: "24px",
    },
    label: "Ineligible",
  },
  ONBOARDED: {
    sx: {
      borderRadius: "2px",
      border: "1px solid #42814A",
      background: "#F6FFF8",
      height: "24px",
    },
    label: "Onboarded",
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
          ...style.sx,
          fontSize: BCDesignTokens.typographyFontSizeSmallBody,
          fontWeight: BCDesignTokens.typographyFontWeightMedium,
          color: BCDesignTokens.typographyColorPrimary,
        }}
      />
    </Box>
  );
}

