import { PACKAGE_STATUS, PackageStatus } from "@/models/Package";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  SUBMISSION_ITEM_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box, Stack } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { StatusChip, StatusChipTheme } from "@/components/Shared/StatusChip";
import { BCDesignTokens } from "epic.theme";
import { ReactNode, useMemo } from "react";

// Map statuses to labels and themes
type StyleProps = {
  label: string;
  theme: StatusChipTheme;
  icon?: ReactNode;
};

const statusMap: Record<string, StyleProps> = {
  COMPLETED: { label: "Completed", theme: "success" },
  PASSED_CONSULTATION_CHECK: {
    label: "Passed Consultation Check",
    theme: "success",
  },
  APPROVED: { label: "Approved", theme: "success" },
  REVIEWED: { label: "Reviewed", theme: "success" },
  ACCEPTED: { label: "Accepted", theme: "success" },
  SATISFIED: { label: "Satisfied", theme: "success" },
  NO_REVISION_REQUIRED: {
    label: "No Revision Required",
    theme: "success",
  },
  VERIFIED: {
    label: "Verified",
    theme: "success",
    icon: (
      <CheckIcon
        sx={{
          fontSize: "16px !important",
          color: BCDesignTokens.supportBorderColorSuccess,
        }}
      />
    ),
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    theme: "success",
    icon: (
      <CheckIcon
        sx={{
          fontSize: "16px !important",
          color: BCDesignTokens.supportBorderColorSuccess,
        }}
      />
    ),
  },

  UNDER_REVIEW: { label: "Under Review", theme: "info" },
  UNDER_CONSULTATION_CHECK: {
    label: "Under Consultation Check",
    theme: "info",
  },
  SUBMITTED: { label: "Submitted", theme: "info" },
  NEW_VERSION: {
    label: "New Version",
    theme: "info",
    icon: (
      <RefreshIcon
        sx={{ fontSize: "16px", color: BCDesignTokens.themeBlue100 }}
      />
    ),
  },
  REQUESTED_BY_EAO: {
    label: "Requested by EAO",
    theme: "info",
  },

  REVIEW_REJECTED: {
    label: "Review Rejected",
    theme: "danger",
  },
  FAILED_CONSULTATION_CHECK: {
    label: "Failed Consultation Check",
    theme: "danger",
  },
  FAILED: { label: "Failed", theme: "danger" },
  PREVIOUSLY_FAILED: {
    label: "Previously Failed",
    theme: "danger",
  },

  REVIEW_NOT_COMPLETED: {
    label: "Review Not Completed",
    theme: "warning",
  },
  PARTIALLY_COMPLETED: { label: "Partially Completed", theme: "warning" },
  FLAGGED_FOR_UPDATE: {
    label: "Flagged for Update",
    theme: "warning",
  },

  NEW_SUBMISSION: { label: "New Submission", theme: "decision" },
  NEW: { label: "New", theme: "decision" },

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
  NOT_APPLICABLE: { label: "Not Applicable", theme: "neutral" },
  NOT_APPROVED: { label: "Not Approved", theme: "danger" },
};

type SubmissionStatusChipProps = Readonly<{
  status?: string;
}>;
export function SubmissionStatusChip({
  status = "",
}: SubmissionStatusChipProps) {
  const config = statusMap[status];

  if (!config || !config.label) {
    return null;
  }

  return (
    <StatusChip label={config.label} theme={config.theme} icon={config.icon} />
  );
}

type SubmissionStatusChipStackProps = {
  status?: SubmissionItemStatus;
  isUpdateRequested?: boolean;
  isUpdated?: boolean;
  packageStatus?: PackageStatus[];
  showOnlyUpdateChips?: boolean;
  isFlaggedForUpdate?: boolean;
};
export const SubmissionStatusChipStack = ({
  status,
  isUpdateRequested = false,
  isUpdated = false,
  packageStatus,
  showOnlyUpdateChips = false,
  isFlaggedForUpdate = false,
}: SubmissionStatusChipStackProps) => {
  const { userType } = useAccount();
  const hideStatus = useMemo(() => {
    if (showOnlyUpdateChips) {
      return true;
    }
    if (userType === USER_TYPE.STAFF) {
      return status === SUBMISSION_ITEM_STATUS.SUBMITTED.value;
    } else if (userType === USER_TYPE.PROPONENT) {
      return (
        status === SUBMISSION_ITEM_STATUS.SUBMITTED.value &&
        !packageStatus?.includes(PACKAGE_STATUS.SUBMITTED.value)
      );
    }
    return false;
  }, [status, packageStatus, userType, showOnlyUpdateChips]);
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
        {isFlaggedForUpdate && (
          <SubmissionStatusChip
            status={NON_CANONICAL_SUBMISSION_STATUS.FLAGGED_FOR_UPDATE}
          />
        )}
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
