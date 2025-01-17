import {
  NON_CANONICAL_SUBMISSION_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { Box, Chip, Stack } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";

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
    label: "Failed Consultaion Check",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
      // width: "125px",
    },
  },
};

export function SubmissionStatusChip({ status }: { status: string }) {
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
  status: SubmissionItemStatus;
  reviewStatus?: string;
  isUpdateRequested?: boolean;
  isRevisionRequired?: boolean;
  isUpdated?: boolean;
};
export const SubmissionStatusChipStack = ({
  status,
  reviewStatus,
  isUpdateRequested = false,
  isRevisionRequired = false,
  isUpdated = false,
}: SubmissionStatusChipStackProps) => {
  return (
    <Box sx={{ display: "inline-block" }}>
      <Stack
        direction="column"
        spacing={1}
        width={"fit-content"}
        alignItems={"flex-end"}
      >
        {status && <SubmissionStatusChip status={status} />}
        {reviewStatus ===
          NON_CANONICAL_SUBMISSION_STATUS.PENDING_MANAGER_REVIEW && (
          <SubmissionStatusChip status={reviewStatus} />
        )}

        {isUpdateRequested && (
          <SubmissionStatusChip
            status={NON_CANONICAL_SUBMISSION_STATUS.UPDATE_REQUESTED}
          />
        )}
        {isRevisionRequired && (
          <SubmissionStatusChip
            status={NON_CANONICAL_SUBMISSION_STATUS.REVISION_REQUIRED}
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
