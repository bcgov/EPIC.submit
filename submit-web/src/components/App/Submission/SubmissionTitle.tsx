import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { Box, styled, SxProps, Typography } from "@mui/material";
import { ProjectStatus } from "@/components/Shared/ProjectStatus";
import {
  PROJECT_STATUS,
  getSubmissionPhaseStatus,
} from "@/components/Shared/ProjectStatus/constants";
import { useMemo } from "react";

type SubmissionTitleProps = {
  sx?: SxProps;
  submissionPackage?: SubmissionPackage;
  customTitle?: string;
  customStatus?: (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
};

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
});

export const SubmissionTitle = ({
  sx,
  submissionPackage,
  customTitle,
  customStatus,
}: SubmissionTitleProps) => {
  const title = useMemo(() => {
    if (customTitle) {
      return customTitle;
    }

    if (submissionPackage?.type.name === SubmissionPackageType.MANAGEMENT_PLAN || 
        submissionPackage?.type.name === SubmissionPackageType.IEM) {
      return `Management Plans & Related Documents`;
    }

    // Final fallback
    return submissionPackage?.account_project_work?.work?.title || "";
  }, [submissionPackage, customTitle]);

  const status = useMemo(() => {
    if (customStatus) {
      return customStatus;
    }

    // If package is associated with a work, show the submission phase label,
    // falling back to the current phase name
    const work = submissionPackage?.account_project_work?.work;
    if (work?.current_phase?.name) {
      return getSubmissionPhaseStatus(
        submissionPackage?.type?.phase_label ?? work.phase_label,
        work.current_phase.name,
      );
    }

    // Fallback to POST_DECISION for packages without work association
    return PROJECT_STATUS.POST_DECISION;
  }, [submissionPackage, customStatus]);

  return (
    <CardInnerBox sx={{ ...(sx || {}) }}>
      <Typography variant="h4" sx={{
        fontWeight: 400
      }}>
        {title}
      </Typography>
      <ProjectStatus status={status} />
    </CardInnerBox>
  );
};
