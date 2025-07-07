import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/ContentBox";
import { Box, Grid, Typography } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import { InfoBox } from "@/components/Submission/InfoBox";
import {
  useGetPackageVersionsByOriginalPackageId,
  useGetStaffSubmissionPackage,
} from "@/hooks/api/usePackages";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { PackageStatusChipStack } from "@/components/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/Submission/packageTableStore";
import { useQueryClient } from "@tanstack/react-query";
import ItemsTable from "@/components/Submission/ItemsTable";
import { useMounted } from "@/hooks/common";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import UpdateRequestWidget from "@/components/Submission/UpdateRequestWidget";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { SuccessBox } from "@/components/Shared/SuccessBox";
import { When } from "react-if";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import WarningBox from "@/components/Shared/WarningBox";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { reset } = usePackageTableStore();
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData(
    getAccountProjectForStaffQueryOptions(Number(accountProjectIdParam))
      .queryKey,
  );

  const { submissionPackageId: submissionPackageIdParam } = useParams({
    strict: false,
  });
  const submissionPackageId = Number(submissionPackageIdParam);

  const { data: submissionPackage } = useGetStaffSubmissionPackage({
    packageId: submissionPackageId,
    enabled: Boolean(accountProject?.id),
  });

  const { data: packageVersions } = useGetPackageVersionsByOriginalPackageId({
    originalPackageId: submissionPackage?.version?.original_package_id,
    enabled: Boolean(submissionPackage?.version?.original_package_id),
  });

  const isLatestApprovedPackageVersion = packageVersions?.find(
    (packageVersion) =>
      packageVersion.is_approved &&
      packageVersion.package_id === submissionPackageId,
  );

  const latestApprovedVersion = Math.max(
    ...(packageVersions
      ?.filter((pv) => pv.is_approved)
      .map((pv) => pv.version) || [0]),
  );

  const isNewerThanLastApprovedButNotApproved = Boolean(
    (latestApprovedVersion > 0 &&
      !submissionPackage?.version?.is_approved &&
      submissionPackage?.version?.version) ??
      0 > latestApprovedVersion,
  );

  const navigate = useNavigate();

  useMounted(() => {
    return () => {
      reset();
    };
  });

  const managementPlanName = useManagementPlanName(submissionPackage);

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox
          mainLabel={accountProject?.project?.name}
          topLabel={accountProject?.project?.proponent_name}
          bottomLabel={
            accountProject?.project?.ea_certificate
              ? `EAC # ${accountProject?.project?.ea_certificate}`
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
                Management Plans & Related Documents
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
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb:
                    isLatestApprovedPackageVersion ||
                    isNewerThanLastApprovedButNotApproved
                      ? 0
                      : BCDesignTokens.layoutMarginXlarge,
                }}
              >
                <BarTitle title={managementPlanName} />
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
              <When condition={Boolean(isLatestApprovedPackageVersion)}>
                <SuccessBox
                  sx={{
                    mb: BCDesignTokens.layoutMarginMedium,
                    py: BCDesignTokens.layoutPaddingXsmall,
                    px: BCDesignTokens.layoutPaddingSmall,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    width: "fit-content",
                  }}
                >
                  <GppGoodOutlinedIcon fontSize="large" />
                  <Typography
                    variant="body2"
                    color={BCDesignTokens.typographyColorPrimary}
                  >
                    This submission is the version the EAO has finalized for
                    implementation.
                  </Typography>
                </SuccessBox>
              </When>
              <When condition={isNewerThanLastApprovedButNotApproved}>
                <WarningBox
                  sx={{
                    mb: BCDesignTokens.layoutMarginMedium,
                    py: BCDesignTokens.layoutPaddingSmall,
                  }}
                >
                  <Typography
                    variant="body2"
                    color={BCDesignTokens.typographyColorPrimary}
                  >
                    Please Note: This submission is still pending EAO review.
                    Until finalized, it is not considered enforceable.
                  </Typography>
                </WarningBox>
              </When>
              <InfoBox submissionPackage={submissionPackage} />
              <Box
                sx={{
                  pt: BCDesignTokens.layoutMarginXlarge,
                  mb: BCDesignTokens.layoutMarginLarge,
                  width: "100%",
                }}
              >
                <UpdateRequestWidget submissionPackage={submissionPackage} />
              </Box>
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingXsmall,
                }}
              >
                <ItemsTable submissionPackage={submissionPackage} />
              </Box>

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
