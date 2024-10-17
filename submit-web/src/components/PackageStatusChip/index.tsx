import { PackageStatus } from "@/models/Package";
import { Chip } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};
const statusStyles: Record<PackageStatus, StyleProps> = {
  APPROVED: {
    sx: {
      borderRadius: 1,
      border: `2px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
    },
    label: "Approved",
  },
  IN_REVIEW: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.themeBlue100}`,
      background: BCDesignTokens.themeBlue20,
    },
    label: "In Review",
  },
  REJECTED: {
    label: "Rejected",
    sx: {
      //TODO - Add styles for rejected status
    },
  },
  SUBMITTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
      background: BCDesignTokens.themeBlue20,
    },
    label: "Submitted",
  },
  COMPLETED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
    },
    label: "Completed",
  },
  PARTIALLY_COMPLETED: {
    label: "Partially Completed",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
      background: BCDesignTokens.supportSurfaceColorWarning,
      height: "24px",
    },
  },
  NEW_SUBMISSION: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${EAOColors.DecisionDark}`,
      background: EAOColors.DecisionLight,
      height: "24px",
    },
    label: "New Submission",
  },
};

export default function PackageStatusChip({
  status,
}: {
  status: PackageStatus;
}) {
  const style = statusStyles[status];

  if (!style) {
    return null;
  }

  return (
    <Chip
      sx={{
        ...style.sx,
      }}
      label={style.label}
    />
  );
}
