import { NonCanonicalPackageStatus, PackageStatus } from "@/models/Package";
import { Chip, SxProps, Theme } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";

// 1. Define reusable base styles/themes
const baseSx: SxProps<Theme> = {
  borderRadius: 1,
  height: "24px",
  px: 1,
  "& .MuiChip-label": {
    overflow: "visible",
  },
};

const themes = {
  success: {
    border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
    background: BCDesignTokens.supportSurfaceColorSuccess,
  },
  info: {
    border: `1px solid ${BCDesignTokens.themeBlue100}`,
    background: BCDesignTokens.themeBlue20,
  },
  warning: {
    border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
    background: BCDesignTokens.supportSurfaceColorWarning,
  },
  danger: {
    border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
    background: BCDesignTokens.supportSurfaceColorDanger,
  },
  orange: {
    border: `1px solid #F18A15`,
    background: "#FFDEB8",
  },
  purple: {
    border: `1px solid #9B6BDA`,
    background: "#F6E4FF",
  },
  neutral: {
    border: `1px solid ${BCDesignTokens.surfaceColorBorderMedium}`,
    background: BCDesignTokens.surfaceColorSecondaryButtonDisabled,
  },
  decision: {
    border: `1px solid ${EAOColors.DecisionDark}`,
    background: EAOColors.DecisionLight,
  },
};

// 2. Map statuses to labels and themes
type StyleProps = {
  label: string;
  theme: keyof typeof themes;
};

const statusMap: Record<PackageStatus | NonCanonicalPackageStatus, StyleProps> =
  {
    APPROVED: { label: "Approved", theme: "success" },
    ACCEPTED: { label: "Accepted", theme: "success" },
    SATISFIED: { label: "Satisfied", theme: "success" },
    REVIEWED: { label: "Reviewed", theme: "success" },
    COMPLETED: { label: "Completed", theme: "success" },
    PASSED_CONSULTATION_CHECK: {
      label: "Passed Consultation Check",
      theme: "success",
    },
    NO_REVISION_REQUIRED: {
      label: "No Revision Required",
      theme: "success",
    },
    VERIFIED: { label: "Verified", theme: "success" },
    ACKNOWLEDGED: { label: "Acknowledged", theme: "success" },

    IN_PROGRESS: { label: "In Progress", theme: "info" },
    IN_REVIEW: { label: "In Review", theme: "info" },
    UNDER_REVIEW: { label: "Under Review", theme: "info" },
    UNDER_CONSULTATION_CHECK: {
      label: "Under Consultation Check",
      theme: "info",
    },
    SUBMITTED: { label: "Submitted", theme: "info" },
    RESUBMITTED: { label: "Resubmitted", theme: "info" },

    REVIEW_REJECTED: {
      label: "Review Rejected",
      theme: "danger",
    },
    FAILED_CONSULTATION_CHECK: {
      label: "Failed Consultation Check",
      theme: "danger",
    },
    NOT_APPROVED: { label: "Not Approved", theme: "danger" },

    REVIEW_NOT_COMPLETED: {
      label: "Review Not Completed",
      theme: "warning",
    },
    PARTIALLY_COMPLETED: { label: "Partially Completed", theme: "warning" },
    REQUESTED_BY_EAO: {
      label: "Requested by EAO",
      theme: "warning",
    },
    INTERNAL_VERIFICATION: { label: "Internal Verification", theme: "warning" },

    NEW: { label: "New", theme: "decision" },
    NEW_SUBMISSION: { label: "New Submission", theme: "purple" },

    AWAITING_MANAGER_APPROVAL: {
      label: "Awaiting Manager Approval",
      theme: "orange",
    },
    UPDATE_REQUESTED: {
      label: "Update Requested",
      theme: "orange",
    },
    REVISION_REQUIRED: {
      label: "Revision Required",
      theme: "orange",
    },
    REVISION_REQUESTED: {
      label: "Revision Requested",
      theme: "orange",
    },

    UPDATED: { label: "Updated", theme: "purple" },
    PENDING_ACKNOWLEDGEMENT: {
      label: "Pending Acknowledgement",
      theme: "purple",
    },
    READY_FOR_ACKNOWLEDGEMENT: {
      label: "Ready for Acknowledgement",
      theme: "purple",
    },
    READY_FOR_APPROVAL: { label: "Ready for Approval", theme: "purple" },

    CREATED: { label: "Created", theme: "neutral" },
  };

type PackageStatusChipProps = Readonly<{
  status: PackageStatus | NonCanonicalPackageStatus;
}>;

export default function PackageStatusChip({ status }: PackageStatusChipProps) {
  const config = statusMap[status];

  if (!config || !config.label) {
    return null;
  }

  const sx: SxProps<Theme> = {
    ...baseSx,
    ...(config.theme ? themes[config.theme] : {}),
  };

  return <Chip sx={sx} label={config.label} />;
}
