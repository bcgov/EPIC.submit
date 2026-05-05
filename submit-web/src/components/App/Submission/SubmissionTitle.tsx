import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { Box, styled, SxProps, Typography } from "@mui/material";
import { ProjectStatus } from "@/components/App/registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";
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

    if (submissionPackage?.type.name === SubmissionPackageType.ADDITIONAL_INFORMATION) {
      return submissionPackage.name;
    }

    // Final fallback
    return submissionPackage?.account_project_work?.work?.title || "";
  }, [submissionPackage, customTitle]);

  const status = useMemo(() => {
    if (customStatus) {
      return customStatus;
    }

    // If package is associated with a work, show the current phase name
    if (submissionPackage?.account_project_work?.work?.current_phase?.name) {
      return submissionPackage.account_project_work.work.current_phase.name;
    }

    // Fallback to POST_DECISION for packages without work association
    return PROJECT_STATUS.POST_DECISION;
  }, [submissionPackage, customStatus]);

  return (
    <CardInnerBox sx={{ ...(sx || {}) }}>
      <Typography variant="h4" fontWeight={400}>
        {title}
      </Typography>
      <ProjectStatus status={status} />
    </CardInnerBox>
  );
};
