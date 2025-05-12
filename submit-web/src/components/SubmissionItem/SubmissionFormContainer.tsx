import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { ContentBox } from "@/components/Shared/ContentBox";
import { BCDesignTokens } from "epic.theme";
import { CardInnerBox } from "@/components/Projects/Project";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { SubmissionPackage } from "@/models/Package";

type SubmissionFormContainerProps = {
  children: React.ReactNode;
};
export const SubmissionFormContainer = ({
  children,
}: SubmissionFormContainerProps) => {
  const { projectId: accountProjectIdParam, submissionPackageId } = useParams({
    strict: false,
  });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject, isPending } = useGetAccountProject({
    accountProjectId,
  });

  const queryClient = useQueryClient();

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>([
    QUERY_KEY.SUBMISSION_PACKAGE,
    Number(submissionPackageId),
  ]);

  if (isPending || !submissionPackage)
    return <Skeleton variant="rectangular" height={400} />;
  if (!accountProject) return <Navigate to="/error" />;

  return (
    <Grid item xs={12}>
      <ContentBox
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent_name}
        bottomLabel={
          accountProject?.project.ea_certificate &&
          `EAC # ${accountProject?.project.ea_certificate}`
        }
      >
        <Box
          sx={{
            borderRadius: "4px",
            p: BCDesignTokens.layoutPaddingMedium,
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          }}
        >
          <CardInnerBox sx={{ pl: 0, pb: BCDesignTokens.layoutPaddingMedium }}>
            <Typography variant="h4" fontWeight={400}>
              Management Plans and Related Documents
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
          </CardInnerBox>
          <Box
            sx={{
              p: BCDesignTokens.layoutPaddingMedium,
              pt: BCDesignTokens.layoutPaddingSmall,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingLarge,
            }}
          >
            <BarTitle title={submissionPackage?.name || ""} />
            <Grid
              container
              spacing={BCDesignTokens.layoutMarginMedium}
              padding="16px"
            >
              {children}
            </Grid>
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
};
