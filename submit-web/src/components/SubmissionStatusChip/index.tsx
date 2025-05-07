import { PACKAGE_STATUS, PackageStatus } from "@/models/Package";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  SUBMISSION_ITEM_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box, Chip, Stack } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useMemo } from "react";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};

const statusStyles: Record<string, StyleProps> = {
  NEW_SUBMISSION: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${EAOColors.DecisionDark}`,
      background: EAOColors.DecisionLight,
      height: "24px",
    },
    label: "New Submission",
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
  SUBMITTED: {
    label: "Submitted",
    sx: {
      width: "90px",
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.themeBlue100}`,
      background: BCDesignTokens.themeBlue20,
      height: "24px",
    },
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
  UPDATED: {
    sx: {
      borderRadius: 1,
      border: `1px solid #9B6BDA`,
      background: "#F6E4FF",
      height: "24px",
      width: "79px",
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
  FAILED: {
    label: "Failed",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
    },
  },
  APPROVED: {
    label: "Approved",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "86px",
    },
  },
  REVIEWED: {
    label: "Reviewed",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
    },
  },
  ACCEPTED: {
    label: "Accepted",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "83px",
    },
  },
  SATISFIED: {
    label: "Satisfied",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "78px",
    },
  },
  NO_REVISION_REQUIRED: {
    label: "No Revision Required",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "157px",
    },
  },
  PREVIOUSLY_FAILED: {
    label: "Previously Failed",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
      width: "128px",
    },
  },
};

type SubmissionStatusChipProps = Readonly<{
  status?: string;
}>;
export function SubmissionStatusChip({
  status = "",
}: SubmissionStatusChipProps) {
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

type SubmissionStatusChipStackProps = {
  status?: SubmissionItemStatus;
  isUpdateRequested?: boolean;
  isUpdated?: boolean;
  packageStatus?: PackageStatus[];
};
export const SubmissionStatusChipStack = ({
  status,
  isUpdateRequested = false,
  isUpdated = false,
  packageStatus,
}: SubmissionStatusChipStackProps) => {
  const { userType } = useAccount();
  const hideStatus = useMemo(() => {
    if (userType === USER_TYPE.STAFF) {
      return status === SUBMISSION_ITEM_STATUS.SUBMITTED.value;
    } else if (userType === USER_TYPE.PROPONENT) {
      return (
        status === SUBMISSION_ITEM_STATUS.SUBMITTED.value &&
        !packageStatus?.includes(PACKAGE_STATUS.SUBMITTED.value)
      );
    }
    return false;
  }, [status, packageStatus, userType]);
  return (
    <Box sx={{ display: "inline-block" }}>
      <Stack
        direction="column"
        spacing={1}
        width={"fit-content"}
        alignItems={"flex-end"}
        sx={{
          margin: 0,
        }}
      >
        {!hideStatus && status && <SubmissionStatusChip status={status} />}
        {isUpdateRequested && !isUpdated && (
          <SubmissionStatusChip
            status={NON_CANONICAL_SUBMISSION_STATUS.UPDATE_REQUESTED}
          />
        )}
        {isUpdated && (
          <SubmissionStatusChip
            status={NON_CANONICAL_SUBMISSION_STATUS.UPDATED}
          />
        )}
      </Stack>
    </Box>
  );
};
