import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { Box, Grid, Skeleton } from "@mui/material";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { BCDesignTokens } from "epic.theme";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { SubmissionPackage } from "@/models/Package";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";

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

  const managementPlanName = useManagementPlanName(submissionPackage);

  if (isPending || !submissionPackage)
    return <Skeleton variant="rectangular" height={400} />;
  if (!accountProject) return <Navigate to="/error" />;

  return (
    <Grid item xs={12}>
      <ContentBox
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent?.name || ""}
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
          <SubmissionTitle
            sx={{ pb: BCDesignTokens.layoutPaddingSmall }}
            submissionPackage={submissionPackage}
          />
          <Box
            sx={{
              pl: BCDesignTokens.layoutPaddingMedium,
              pt: BCDesignTokens.layoutPaddingSmall,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingLarge,
            }}
          >
            <BarTitle title={managementPlanName || ""} />
            <Grid
              container
              spacing={BCDesignTokens.layoutMarginMedium}
              padding="16px"
              sx={{
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              {children}
            </Grid>
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
};
