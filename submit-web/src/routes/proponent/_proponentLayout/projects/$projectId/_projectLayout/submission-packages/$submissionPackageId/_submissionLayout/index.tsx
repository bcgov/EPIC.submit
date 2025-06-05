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
  useGetSubmissionPackage,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { PACKAGE_STATUS } from "@/models/Package";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Case, Switch, Unless, When } from "react-if";
import { PackageStatusChipStack } from "@/components/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/Submission/packageTableStore";
import UpdateRequestWidget from "@/components/Submission/UpdateRequestWidget";
import { useMounted } from "@/hooks/common";
import { isSubmissionItemReadyToSubmit } from "@/components/Submission/utils";
import { Box, Grid, Link, Typography } from "@mui/material";
import { ContentBox } from "@/components/Shared/ContentBox";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import ItemsTable from "@/components/Submission/ItemsTable";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import BarTitle from "@/components/Shared/Text/BarTitle";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import { SuccessBox } from "@/components/Shared/SuccessBox";
import { SubmissionSuccessBox } from "@/components/Submission/SuccessBox";
import { GreyBox } from "@/components/Shared/GreyBox";
import { AppConfig } from "@/utils/config";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { setIsValidating, reset } = usePackageTableStore();
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });
  const { submissionPackageId: submissionPackageIdParam } = useParams({
    strict: false,
  });
  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage } = useGetSubmissionPackage({
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
  const {
    mutate: updateStateSubmissionPackage,
    isPending: isSubmittingPackage,
  } = useUpdateStateSubmissionPackage({
    onError: () => {
      notify.error("Failed to submit management plan");
    },
  });

  const navigate = useNavigate();

  useMounted(() => {
    return () => {
      reset();
    };
  });

  const submitPackage = () => {
    if (!submissionPackage) {
      return;
    }

    if (
      submissionPackage.items.some(
        (item) =>
          !isSubmissionItemReadyToSubmit({
            submissionItem: item,
            submissionPackage: submissionPackage,
          }),
      )
    ) {
      setIsValidating(true);
      return;
    }

    updateStateSubmissionPackage({
      packageId: submissionPackage.id,
      data: {
        status: PACKAGE_STATUS.SUBMITTED.value,
      },
    });
    notify.success("Management plan submitted successfully");
  };

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  const isPackageSubmitted = Boolean(submissionPackage.submitted_on);

  const isFirstSubmission = submissionPackage.status.includes(
    PACKAGE_STATUS.SUBMITTED.value,
  );

  const isRevisionRequired = submissionPackage.update_requests.some(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
      updateRequest.active &&
      updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value,
  );

  const pendingRequests = submissionPackage.update_requests.filter(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
      updateRequest.active,
  );

  const openRequests = submissionPackage.update_requests.filter(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
      updateRequest.active,
  );

  const isSubmitDisabled =
    isPackageSubmitted &&
    pendingRequests.length === 0 &&
    openRequests.length === 0;

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
                  alignItems: "center",
                  justifyContent: "space-between",

                  mb: isLatestApprovedPackageVersion
                    ? 0
                    : BCDesignTokens.layoutMarginXlarge,
                }}
              >
                <BarTitle title={submissionPackage.name} />
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
              <InfoBox submissionPackage={submissionPackage} />
              {submissionPackage?.update_requests.length > 0 && (
                <Box mt="1em" width="100%">
                  <UpdateRequestWidget
                    submissionPackage={submissionPackage}
                    summaryBackgroundColor="#FEF8E8"
                  />
                </Box>
              )}
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingSmall,
                }}
              >
                <ItemsTable submissionPackage={submissionPackage} />
              </Box>
              <Switch>
                <Case
                  condition={
                    (isPackageSubmitted &&
                      pendingRequests.length > 0 &&
                      !isRevisionRequired) ||
                    isFirstSubmission
                  }
                >
                  <Box mb={BCDesignTokens.layoutMarginXlarge}>
                    <SubmissionSuccessBox
                      submissionPackageType={submissionPackage.type}
                    />
                  </Box>
                </Case>
                <Case
                  condition={
                    openRequests.length === 0 &&
                    pendingRequests.length === 0 &&
                    isPackageSubmitted
                  }
                >
                  <GreyBox
                    sx={{
                      py: BCDesignTokens.layoutPaddingMedium,
                      px: BCDesignTokens.layoutPaddingSmall,
                    }}
                  >
                    {" "}
                    <Typography variant="body1" color={"black"}>
                      If you have any questions or need to add, replace, or
                      delete documents in your submission, please contact the
                      EAO at{" "}
                      <Link href={`mailto:${AppConfig.supportEmail}`}>
                        {AppConfig.supportEmail}
                      </Link>
                      .
                    </Typography>
                  </GreyBox>
                </Case>
              </Switch>
              <Box
                sx={{
                  pt: BCDesignTokens.layoutPaddingXlarge,
                }}
              >
                <Button
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() =>
                    navigate({ to: `/proponent/projects/${accountProject.id}` })
                  }
                >
                  Save & Close
                </Button>
                <PermissionsGate
                  scopes={[ACCOUNT_USER_PERMISSIONS.SUBMIT_PACKAGE]}
                >
                  <Unless condition={submissionPackage.completed_on}>
                    <Button
                      onClick={submitPackage}
                      loading={isSubmittingPackage}
                      disabled={isSubmitDisabled}
                    >
                      Submit to EAO
                    </Button>
                  </Unless>
                </PermissionsGate>
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
