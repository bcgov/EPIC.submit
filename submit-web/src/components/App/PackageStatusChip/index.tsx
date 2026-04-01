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
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "86px",
    },
    label: "Approved",
  },
  ACCEPTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "83px",
    },
    label: "Accepted",
  },
  SATISFIED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "78px",
    },
    label: "Satisfied",
  },
  REVIEWED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
    },
    label: "Reviewed",
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
  REVIEW_NOT_COMPLETED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
      background: BCDesignTokens.supportSurfaceColorWarning,
      height: "24px",
      width: "168px",
    },
    label: "Review Not Completed",
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
  NEW: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${EAOColors.DecisionDark}`,
      background: EAOColors.DecisionLight,
      height: "24px",
    },
    label: "New",
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
  AWAITING_MANAGER_APPROVAL: {
    sx: {
      borderRadius: 1,
      border: `1px solid #F18A15`,
      background: "#FFDEB8",
      height: "24px",
      width: "196px",
    },
    label: "Awaiting Manager Approval",
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
  REVISION_REQUESTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid #F18A15`,
      background: "#FFDEB8",
      height: "24px",
      width: "150px",
    },
    label: "Revision Requested",
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
  UPDATED: {
    sx: {
      borderRadius: 1,
      border: `1px solid #9B6BDA`,
      background: "#F6E4FF",
      height: "24px",
    },
    label: "Updated",
  },
  FAILED_CONSULTATION_CHECK: {
    label: "Failed Consultation Check",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
    },
  },
  NO_REVISION_REQUIRED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "157px",
    },
    label: "No Revision Required",
  },
  RESUBMITTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
      width: "104px",
    },
    label: "Resubmitted",
  },
  REQUESTED_BY_EAO: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
      background: BCDesignTokens.supportSurfaceColorWarning,
      height: "24px",
      width: "139px",
    },
    label: "Requested by EAO",
  },
};

type PackageStatusChipProps = Readonly<{
  status: PackageStatus | NonCanonicalPackageStatus;
}>;
export default function PackageStatusChip({ status }: PackageStatusChipProps) {
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
