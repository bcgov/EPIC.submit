import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/ContentBox";
import { YellowBar } from "@/components/Shared/YellowBar";
import { Box, Grid, Stack, Typography } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import { InfoBox } from "@/components/Submission/InfoBox";
import { useGetStaffSubmissionPackage } from "@/hooks/api/usePackages";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { PackageStatusChipStack } from "@/components/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/Submission/packageTableStore";
import { useQueryClient } from "@tanstack/react-query";
import ItemsTable from "@/components/Submission/ItemsTable";
import { useMounted } from "@/hooks/common";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import UpdateRequestWidget from "@/components/Submission/UpdateRequestWidget";
import { useEffect, useState } from "react";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/"
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { reset } = usePackageTableStore();
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData(
    getAccountProjectForStaffQueryOptions(Number(accountProjectIdParam))
      .queryKey
  );
  const { submissionPackageId: submissionPackageIdParam } = useParams({
    strict: false,
  });
  const submissionPackageId = Number(submissionPackageIdParam);
  const [packageId, setPackageId] = useState<number>(submissionPackageId);
  const { data: submissionPackage, isLoading: isPackageUpdating } =
    useGetStaffSubmissionPackage({
      packageId: packageId,
      enabled: Boolean(accountProject?.id),
    });

  const navigate = useNavigate();

  useMounted(() => {
    return () => {
      reset();
    };
  });

  useEffect(() => {}, [submissionPackage]);

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox
          mainLabel={accountProject?.project?.name}
          label={
            accountProject?.project?.ea_certificate
              ? `EAC #${accountProject?.project?.ea_certificate}`
              : ""
          }
        >
          <Box
            sx={{
              padding: BCDesignTokens.layoutPaddingMedium,
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            <Box sx={{ pb: BCDesignTokens.layoutPaddingSmall }}>
              <Typography variant="h4" fontWeight={400}>
                Management Plans
              </Typography>
              <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
            </Box>
            <Box
              sx={{
                pt: BCDesignTokens.layoutPaddingSmall,
                pb: BCDesignTokens.layoutPaddingMedium,
                px: BCDesignTokens.layoutPaddingMedium,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              }}
            >
              <YellowBar />
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: BCDesignTokens.layoutMarginXlarge,
                }}
              >
                <Stack>
                  <Typography variant="h5">
                    {submissionPackage?.name}
                  </Typography>
                </Stack>
                <Box flexDirection={"row"} sx={{ display: "flex" }}>
                  <Typography
                    color={BCDesignTokens.themeGray70}
                    fontWeight={900}
                    sx={{ mr: BCDesignTokens.layoutMarginMedium }}
                  >
                    Submission Status:
                  </Typography>
                  <PackageStatusChipStack
                    submissionPackage={submissionPackage}
                  />
                </Box>
              </Box>
              <InfoBox
                isPackageUpdating={isPackageUpdating}
                setPackageId={setPackageId}
                submissionPackage={submissionPackage}
              />
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingSmall,
                }}
              >
                <ItemsTable submissionPackage={submissionPackage} />
              </Box>
              <UpdateRequestWidget submissionPackage={submissionPackage} />
              <Box
                sx={{
                  pt: BCDesignTokens.layoutPaddingXlarge,
                }}
              >
                <Button
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() =>
                    navigate({ to: `/staff/projects/${accountProject.id}` })
                  }
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
