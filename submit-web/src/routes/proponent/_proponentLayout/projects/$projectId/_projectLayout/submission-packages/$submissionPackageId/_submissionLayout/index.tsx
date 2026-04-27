import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import { InfoBox } from "@/components/App/Submission/InfoBox";
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
import { PackageStatusChipStack } from "@/components/App/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/App/Submission/packageTableStore";
import { useMounted } from "@/hooks/common";
import { isSubmissionItemReadyToSubmit } from "@/components/App/Submission/utils";
import { Box, Grid, Link, Typography } from "@mui/material";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import ItemsTable from "@/components/App/Submission/ItemsTable";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import BarTitle from "@/components/Shared/Text/BarTitle";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import { SubmissionSuccessBox } from "@/components/App/Submission/SuccessBox";
import { GreyBox } from "@/components/Shared/Layouts/GreyBox";
import { AppConfig } from "@/utils/config";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
import { ProponentUpdateRequestPanel } from "@/components/App/Submission/ProponentUpdateRequestPanel";
import { UnaddressedSectionsModal } from "@/components/App/Submission/UnaddressedSectionsModal";
import { useDocumentChangeTracking } from "@/hooks/useDocumentChangeTracking";
import { getUnaddressedUpdateRequestSections } from "@/utils/updateRequestHelpers";
import { useSaveProponentNote } from "@/hooks/api/useUpdateRequests";
import { useState } from "react";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { setIsValidating, reset } = usePackageTableStore();
  const [showUnaddressedModal, setShowUnaddressedModal] = useState(false);
  const [unaddressedSections, setUnaddressedSections] = useState<
    ReturnType<typeof getUnaddressedUpdateRequestSections>
  >([]);

  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });
  const { submissionPackageId: submissionPackageIdParam } = useParams({
    strict: false,
  });
  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage, isFetching } = useGetSubmissionPackage({
    packageId: submissionPackageId,
    enabled: Boolean(accountProject?.id),
  });

  const documentChanges = useDocumentChangeTracking({
    submissionPackage,
    enabled: Boolean(submissionPackage),
  });

  const { mutate: saveProponentNote, isPending: isSavingNote } =
    useSaveProponentNote();

  const { data: packageVersions } = useGetPackageVersionsByOriginalPackageId({
    originalPackageId: submissionPackage?.version?.original_package_id,
    enabled: Boolean(submissionPackage?.version?.original_package_id),
  });

  const { data: geoUploads } = useGetGeoUploads(
    { packageId: submissionPackageId, autoRefetch: false },
    { enabled: Boolean(submissionPackageId) },
  );

  const currentPackageVersion = packageVersions?.find(
    (pv) => pv.package_id === submissionPackageId,
  );

  const hasAnyApprovedPackageVersion = packageVersions?.some(
    (pv) => pv.is_approved,
  );

  const isLatestApprovedPackageVersion =
    currentPackageVersion?.is_latest && currentPackageVersion?.is_approved;

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

  const handleSaveNote = (updateRequestId: number, note: string) => {
    if (!submissionPackage) return;

    saveProponentNote(
      {
        packageId: submissionPackage.id,
        updateRequestId,
        note,
      },
      {
        onSuccess: () => {
          notify.success("Note saved successfully");
        },
        onError: () => {
          notify.error("Failed to save note");
        },
      }
    );
  };

  const proceedWithSubmission = () => {
    if (!submissionPackage) return;

    setIsValidating(false);
    setShowUnaddressedModal(false);
    updateStateSubmissionPackage({
      packageId: submissionPackage.id,
      data: {
        status: PACKAGE_STATUS.SUBMITTED.value,
      },
    });
    notify.success("Management plan submitted successfully");
  };

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

    const hasProcessingGeoFiles = (geoUploads as GeoUpload[] | undefined)?.some(
      (u: GeoUpload) => u.status === "processing",
    );
    if (hasProcessingGeoFiles) {
      setIsValidating(true);
      notify.warning(
        "One or more geospatial files are still processing. Please check the status and try again later.",
      );
      return;
    }

    // Check for unaddressed update request sections
    const unaddressed = getUnaddressedUpdateRequestSections(
      submissionPackage,
      documentChanges
    );

    if (unaddressed.length > 0) {
      setUnaddressedSections(unaddressed);
      setShowUnaddressedModal(true);
      return;
    }

    proceedWithSubmission();
  };

  const managementPlanName = useManagementPlanName(submissionPackage);

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
      <SubmitLoaderBackdrop isOpen={isFetching} />
      <Grid item xs={12}>
        <ContentBox
          mainLabel={accountProject?.project?.name}
          topLabel={accountProject?.project?.proponent?.name || ""}
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
            <SubmissionTitle
              sx={{ pb: BCDesignTokens.layoutPaddingSmall }}
              submissionPackage={submissionPackage}
            />
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

                  mb: hasAnyApprovedPackageVersion
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
              <When
                condition={
                  !isLatestApprovedPackageVersion &&
                  hasAnyApprovedPackageVersion
                }
              >
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
                    Please Note: This submission is not considered enforceable.
                    Please refer to the Submission Package with this icon
                    <GppGoodOutlinedIcon
                      fontSize="small"
                      sx={{ verticalAlign: "middle" }}
                    />
                    for the enforceable version.
                  </Typography>
                </WarningBox>
              </When>
              <InfoBox submissionPackage={submissionPackage} />
              {openRequests.length > 0 && (
                <ProponentUpdateRequestPanel
                  openRequests={openRequests}
                  previousRequests={submissionPackage.update_requests.filter(
                    (req) =>
                      req.status === UPDATE_REQUEST_STATUS.ACCEPTED.value &&
                      !req.active
                  )}
                  onSaveNote={handleSaveNote}
                  isLoading={isSavingNote}
                />
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
                      loading={isSubmittingPackage || isFetching}
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
      <UnaddressedSectionsModal
        open={showUnaddressedModal}
        sections={unaddressedSections}
        onConfirm={proceedWithSubmission}
        onCancel={() => setShowUnaddressedModal(false)}
      />
    </PageGrid>
  );
}
