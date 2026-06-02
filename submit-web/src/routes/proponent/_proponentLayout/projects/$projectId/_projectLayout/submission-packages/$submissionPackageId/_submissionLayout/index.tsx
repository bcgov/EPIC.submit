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
import { PACKAGE_STATUS, SubmissionPackageType } from "@/models/Package";
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
import { ProponentUpdateRequestPanel } from "@/components/App/SubmissionItem/ProponentUpdateRequestPanel";
import type {
  SentRequest,
  PreviousRequest,
} from "@/components/App/SubmissionItem/SectionUpdateRequestPanel/types";
import { UnaddressedSectionsModal } from "@/components/App/Submission/Modals/UnaddressedSectionsModal";
import { useDocumentChangeTracking } from "@/hooks/useDocumentChangeTracking";
import { getUnaddressedUpdateRequestSections } from "@/utils/updateRequestHelpers";
import { useSaveProponentNote } from "@/hooks/api/useUpdateRequests";
import { useState, useMemo } from "react";
import { SUBMISSION_TYPE, SUBMISSION_STATUS } from "@/models/Submission";


export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const [showUnaddressedModal, setShowUnaddressedModal] = useState(false);
  const [unaddressedSections, setUnaddressedSections] = useState<
    ReturnType<typeof getUnaddressedUpdateRequestSections>
  >([]);
  const { isValidating, setIsValidating, reset } = usePackageTableStore();

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
    onError: (error: any) => {
      notify.error(
        error?.response?.data?.message ?? "Failed to submit the package.",
      );
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
      },
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
    
    const isResubmission = Boolean(submissionPackage.submitted_on);
    const successMessage = isResubmission
      ? "Your submission package has been resubmitted successfully to the EAO."
      : "Your submission package has been submitted successfully to the EAO.";
    
    notify.success(successMessage, 15000);
  };

  const submitPackage = () => {
    if (!submissionPackage) {
      return;
    }

    const isAdditionalInformation =
      submissionPackage.type.name ===
      SubmissionPackageType.ADDITIONAL_INFORMATION;

    if (isAdditionalInformation) {
      const totalDocuments = submissionPackage.items.reduce((acc, item) => {
        const documentSubmissions = item.submissions.filter(
          (s) => s.type === SUBMISSION_TYPE.DOCUMENT,
        );
        return acc + documentSubmissions.length;
      }, 0);

      if (totalDocuments === 0) {
        setIsValidating(true);
        notify.error(
          "You must have at least one file uploaded to be able to submit your package.",
        );
        return;
      }
    }

    // Check for new files in update-requested sections for acknowledged packages
    if (isPackageAcknowledged && openRequests.length > 0) {
      const requestedItemTypeIds = new Set<number>();
      openRequests.forEach(request => {
        request.submission_item_types.forEach(typeId => {
          requestedItemTypeIds.add(typeId);
        });
      });

      const hasNewFilesInRequestedSections = submissionPackage.items.some(item => {
        if (!requestedItemTypeIds.has(item.type_id)) {
          return false;
        }
        return item.submissions.some(submission => 
          submission.is_updated && 
          submission.type === SUBMISSION_TYPE.DOCUMENT && 
          submission.submitted_document_id !== undefined
        );
      });

      if (!hasNewFilesInRequestedSections) {
        notify.warning(
          "You must have at least one new file added to your package to resubmit your submission package.",
          15000
        );
        return;
      }
    }

    if (
      !isAdditionalInformation &&
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
      documentChanges,
    );

    if (unaddressed.length > 0) {
      setUnaddressedSections(unaddressed);
      setShowUnaddressedModal(true);
      return;
    }

    proceedWithSubmission();
    setIsValidating(false);
    updateStateSubmissionPackage({
      packageId: submissionPackage.id,
      data: {
        status: PACKAGE_STATUS.SUBMITTED.value,
      },
    });

    const isResubmission = Boolean(submissionPackage.submitted_on);
    const successMessage = isResubmission
      ? "Your submission package has been resubmitted successfully to the EAO."
      : "Your submission package has been submitted successfully to the EAO.";

    notify.success(successMessage, 15000);
  };

  const managementPlanName = useManagementPlanName(submissionPackage);

  // Transform update requests for ProponentUpdateRequestPanel
  // PROPONENT VIEW: Open requests from EAO become "sentRequests"
  const sentRequests: SentRequest[] = useMemo(() => {
    if (!submissionPackage) return [];

    const openRequests = submissionPackage.update_requests.filter(
      (updateRequest) =>
        (updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value ||
         updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value) &&
        updateRequest.active,
    );

    return openRequests.map((req) => {
      const item = submissionPackage.items.find((i) =>
        req.submission_item_types.includes(i.type_id),
      );
      return {
        updateRequestId: req.id,
        itemTypeId: req.submission_item_types[0] || 0,
        itemTypeName: item?.type.name || "Unknown Section",
        reason: req.reason,
        createdDate: req.created_date,
        createdBy: req.created_by,
        status: req.status,
        note: req.note,
        noteUpdatedBy: req.note_updated_by,
        noteUpdatedAt: req.note_updated_at,
      };
    });
  }, [submissionPackage]);

  // PROPONENT VIEW: Accepted requests become "previousRequests"
  const previousRequestsData: PreviousRequest[] = useMemo(() => {
    if (!submissionPackage?.all_update_requests) return [];

    return submissionPackage.all_update_requests
      .filter(
        (req) =>
          !req.active &&
          (req.status === UPDATE_REQUEST_STATUS.ACCEPTED.value ||
            req.status === UPDATE_REQUEST_STATUS.CLOSED.value),
      )
      .map((req) => {
        const item = submissionPackage.items.find((i) =>
          req.submission_item_types.includes(i.type_id),
        );
        return {
          updateRequestId: req.id,
          itemTypeId: req.submission_item_types[0] || 0,
          itemTypeName: item?.type.name || "Unknown Section",
          reason: req.reason,
          createdDate: req.created_date,
          createdBy: req.created_by,
          status: req.status,
          note: req.note,
          noteUpdatedBy: req.note_updated_by,
          noteUpdatedAt: req.note_updated_at,
        };
      });
  }, [submissionPackage]);
  const hasDocuments = submissionPackage?.items?.some((item) =>
    item.submissions.some((s) => s.type === SUBMISSION_TYPE.DOCUMENT),
  );

  const isPackageSubmitted = Boolean(submissionPackage?.submitted_on);

  const isFirstSubmission =
    submissionPackage?.status.includes(PACKAGE_STATUS.SUBMITTED.value) ||
    submissionPackage?.status.includes(PACKAGE_STATUS.NEW_SUBMISSION.value);

  const isRevisionRequired = submissionPackage?.update_requests.some(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
      updateRequest.active &&
      updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value,
  );

  const pendingRequests = submissionPackage?.update_requests.filter(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
      updateRequest.active,
  ) || [];

  const openRequests = submissionPackage?.update_requests.filter(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
      updateRequest.active,
  ) || [];

  const isPackageAcknowledged = submissionPackage?.status.includes(
    PACKAGE_STATUS.ACKNOWLEDGED.value
  );

  // Check if there are any updated items that need to be submitted
  const hasUpdatedItems = submissionPackage?.items.some((item) =>
    item.submissions.some((submission) => submission.is_updated && submission.status === SUBMISSION_STATUS.PENDING)
  );
  
  const isSubmitDisabled = useMemo(() => {
    if (hasUpdatedItems) {
      return false;
    }
    // Disable if package is submitted with no pending/open requests
    return (isPackageSubmitted && pendingRequests.length === 0 && openRequests.length === 0) ||
    // Disable if package is acknowledged with no open requests
    (isPackageAcknowledged && openRequests.length === 0);
  }, [isPackageSubmitted, pendingRequests.length, openRequests.length, isPackageAcknowledged, hasUpdatedItems]);

  if (!accountProject || !submissionPackage) {
    return <Navigate to="/error" />;
  }

  
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
              {/* PROPONENT VIEW: Update Requests Panel with Figma design */}
              <ProponentUpdateRequestPanel
                sentRequests={sentRequests}
                previousRequests={previousRequestsData}
                onUpdateNote={handleSaveNote}
                isLoading={isSavingNote}
                packageId={Number(submissionPackageId)}
              />
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingSmall,
                }}
              >
                <ItemsTable
                  submissionPackage={submissionPackage}
                  accountProject={accountProject}
                />
                <When
                  condition={
                    isValidating &&
                    submissionPackage.type.name ===
                      SubmissionPackageType.ADDITIONAL_INFORMATION &&
                    !hasDocuments
                  }
                >
                  <Typography
                    variant="body2"
                    sx={{ color: BCDesignTokens.typographyColorDanger, mt: 1 }}
                  >
                    You must have at least one file uploaded to be able to
                    submit your package.
                  </Typography>
                </When>
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
