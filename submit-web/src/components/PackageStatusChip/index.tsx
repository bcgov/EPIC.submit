import { NonCanonicalPackageStatus, PackageStatus } from "@/models/Package";
import { Chip } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};
const statusStyles: Record<
  PackageStatus | NonCanonicalPackageStatus,
  StyleProps
> = {
  APPROVED: {
    sx: {
      borderRadius: 1,
      border: `2px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
    },
    label: "Approved",
  },
  IN_REVIEW: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.themeBlue100}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
    },
    label: "In Review",
  },
  REVIEW_REJECTED: {
    label: "Review Rejected",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
      width: "125px",
    },
  },
  SUBMITTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
    },
    label: "Submitted",
  },
  COMPLETED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
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
    label: "New",
  },
  UPDATED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${EAOColors.DecisionDark}`,
      background: EAOColors.DecisionLight,
      height: "24px",
    },
    label: "Updated",
  },
  PENDING_MANAGER_REVIEW: {
    sx: {
      borderRadius: 1,
      border: `1px solid #F18A15`,
      background: "#FFDEB8",
      height: "24px",
      width: "188px",
    },
    label: "Awaiting Manager Review",
  },
  PASSED_CONSULTATION_CHECK: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "191px",
    },
    label: "Passed Consultation Check",
  },
  UPDATE_REQUESTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid #F18A15`,
      background: "#FFDEB8",
      height: "24px",
      width: "140px",
    },
    label: "Update Requested",
  },
  REVISION_REQUIRED: {
    sx: {
      borderRadius: 1,
      border: `1px solid #F18A15`,
      background: "#FFDEB8",
      height: "24px",
      width: "140px",
    },
    label: "Revision Required",
  },
  CREATED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.surfaceColorBorderMedium}`,
      background: BCDesignTokens.surfaceColorSecondaryButtonDisabled,
      height: "24px",
    },
    label: "Created",
  },
  UNDER_REVIEW: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.themeBlue100}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
    },
    label: "Under Review",
  },
  UNDER_CONSULTATION_CHECK: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.themeBlue100}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
    },
    label: "Under Consultation Check",
  },
};

export default function PackageStatusChip({
  status,
}: {
  status: PackageStatus | NonCanonicalPackageStatus;
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
