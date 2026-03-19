import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { Box, styled, SxProps, Typography } from "@mui/material";
import { ProjectStatus } from "@/components/App/registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";
import { useGetAccountProject } from "@/hooks/api/useProjects";
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
  padding: "0 12px",
});

export const SubmissionTitle = ({
  sx,
  submissionPackage,
  customTitle,
  customStatus,
}: SubmissionTitleProps) => {
  const { data: accountProject } = useGetAccountProject({
    accountProjectId: submissionPackage?.account_project_id || 0,
  });

  const proponentName = accountProject?.project?.proponent?.name || "";

  const title = useMemo(() => {
    return (
      customTitle ||
      (submissionPackage?.type.name === SubmissionPackageType.IPD
        ? `${proponentName} - Assessment`
        : `Management Plans & Related Documents`)
    );
  }, [submissionPackage, proponentName, customTitle]);

  const status = useMemo(() => {
    return (
      customStatus ||
      (submissionPackage?.type.name === SubmissionPackageType.IPD
        ? PROJECT_STATUS.EARLY_ENGAGEMENT
        : PROJECT_STATUS.POST_DECISION)
    );
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
