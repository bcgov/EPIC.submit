import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { Box, Grid, Typography } from "@mui/material";
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
  useGetStaffSubmissionPackage,
  useCreatePackageUpdateRequest,
  useAcceptUpdateRequest,
  useWithdrawUpdateRequest,
} from "@/hooks/api/usePackages";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { PackageStatusChipStack } from "@/components/App/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/App/Submission/packageTableStore";
import { useQueryClient } from "@tanstack/react-query";
import ItemsTable from "@/components/App/Submission/ItemsTable";
import { useMounted } from "@/hooks/common";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import { When } from "react-if";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { SectionUpdateRequestPanel } from "@/components/App/SubmissionItem/SectionUpdateRequestPanel";
import {
  PendingRequest,
  SentRequest,
  PreviousRequest,
} from "@/components/App/SubmissionItem/SectionUpdateRequestPanel/types";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useState, useMemo, useCallback } from "react";
import UpdateRequestWidget from "@/components/App/Submission/UpdateRequestWidget";
import { SubmissionPackageType, PACKAGE_STATUS } from "@/models/Package";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import { useModal } from "@/components/Shared/Modals/modalStore";
import AcknowledgeSubmissionModal from "@/components/App/Submission/AcknowledgeSubmissionModal";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { reset } = usePackageTableStore();
  const {
    projectId: accountProjectIdParam,
    submissionPackageId: submissionPackageIdParam,
  } = useParams({
    from: Route.id,
  });
  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData(
    getAccountProjectForStaffQueryOptions(Number(accountProjectIdParam))
      .queryKey,
  );

  const submissionPackageId = Number(submissionPackageIdParam);
  const accountProjectId = Number(accountProjectIdParam);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const createUpdateRequestMutation = useCreatePackageUpdateRequest({
    packageId: submissionPackageId,
    accountProjectId,
  });

  const acceptUpdateRequestMutation = useAcceptUpdateRequest({
    packageId: submissionPackageId,
    options: {
      onSuccess: () => {
        notify.success("Update request accepted successfully");
        queryClient.invalidateQueries({
          queryKey: ["packages", submissionPackageId],
        });
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to accept update request",
        );
      },
    },
  });

  const withdrawUpdateRequestMutation = useWithdrawUpdateRequest({
    packageId: submissionPackageId,
    options: {
      onSuccess: () => {
        notify.success("Update request withdrawn successfully");
        queryClient.invalidateQueries({
          queryKey: ["packages", submissionPackageId],
        });
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to withdraw update request",
        );
      },
    },
  });

  const { data: submissionPackage, isFetching } = useGetStaffSubmissionPackage({
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

  const sentUpdateRequests = useMemo<SentRequest[]>(() => {
    if (!submissionPackage?.update_requests) return [];

    return submissionPackage.update_requests
      .filter(
        (req) =>
          req.status !== UPDATE_REQUEST_STATUS.ACCEPTED.value && req.active,
      )
      .flatMap((req) =>
        req.submission_item_types.map((itemTypeId) => {
          const item = submissionPackage.items.find(
            (i) => i.type_id === itemTypeId,
          );
          return {
            updateRequestId: req.id,
            itemTypeId,
            itemTypeName: item?.type.name || "",
            reason: req.reason || "",
            createdBy: req.created_by || "",
            createdDate: req.created_date || "",
            status: req.status || "",
            note: req.note || undefined,
            noteUpdatedBy: req.note_updated_by || undefined,
            noteUpdatedAt: req.note_updated_at || undefined,
          };
        }),
      );
  }, [submissionPackage]);

  const allDocumentsVerified = useMemo(() => {
    if (
      !submissionPackage ||
      submissionPackage.type.name !==
        SubmissionPackageType.ADDITIONAL_INFORMATION
    ) {
      return false;
    }
    const documentSubmissions = submissionPackage.items
      .filter(
        (item) =>
          item.type.name === SUBMISSION_ITEM_TYPE.UPLOAD_DOCUMENT ||
          item.type.name === SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION,
      )
      .flatMap((item) => item.submissions)
      .filter((sub) => sub.type === SUBMISSION_TYPE.DOCUMENT);

    return (
      documentSubmissions.length > 0 &&
      documentSubmissions.every(
        (sub) => sub.status === SUBMISSION_STATUS.VERIFIED,
      )
    );
  }, [submissionPackage]);

  const isAcknowledged = useMemo(
    () => submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value),
    [submissionPackage],
  );

  const openRequestSectionNames = useMemo(() => {
    return Array.from(
      new Set(sentUpdateRequests.map((req) => req.itemTypeName)),
    );
  }, [sentUpdateRequests]);

  const { setOpen: setOpenModal, setClose: setCloseModal } = useModal();

  const { mutate: updatePackageState, isPending: updatingPackageState } =
    useUpdateStateSubmissionPackage({
      onSuccess: () => {
        setCloseModal();
        notify.success("Submission acknowledged successfully");
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to acknowledge submission",
        );
      },
    });

  const handleAcknowledgeClick = () => {
    setOpenModal(
      <AcknowledgeSubmissionModal
        onConfirm={() => {
          updatePackageState({
            packageId: submissionPackageId,
            data: {
              status: PACKAGE_STATUS.ACKNOWLEDGED.value,
            },
          });
        }}
        onCancel={() => setCloseModal()}
        hasOpenUpdateRequests={sentUpdateRequests.length > 0}
        openRequestSectionNames={openRequestSectionNames}
      />,
    );
  };

  const previousUpdateRequests = useMemo<PreviousRequest[]>(() => {
    if (!submissionPackage?.all_update_requests) return [];

    return submissionPackage.all_update_requests
      .filter(
        (req) =>
          !req.active &&
          (req.status === UPDATE_REQUEST_STATUS.ACCEPTED.value ||
            req.status === UPDATE_REQUEST_STATUS.CLOSED.value),
      )
      .map((req) => {
        // Get the first item type name for display
        const firstItemTypeId = req.submission_item_types[0];
        const item = firstItemTypeId
          ? submissionPackage.items.find((i) => i.type_id === firstItemTypeId)
          : undefined;
        return {
          updateRequestId: req.id,
          itemTypeId: firstItemTypeId || 0,
          itemTypeName: item?.type.name || "Update Request",
          reason: req.reason || "",
          createdBy: req.created_by || "",
          createdDate: req.created_date || "",
          status: req.status || "",
          note: req.note || undefined,
          noteUpdatedBy: req.note_updated_by || undefined,
          noteUpdatedAt: req.note_updated_at || undefined,
        };
      });
  }, [submissionPackage]);
  const handleRequestUpdate = useCallback(
    (itemTypeId: number, itemTypeName: string) => {
      const alreadyPending = pendingRequests.some(
        (req) => req.itemTypeId === itemTypeId,
      );

      const alreadySent = sentUpdateRequests.some(
        (req) => req.itemTypeId === itemTypeId,
      );

      if (alreadyPending) {
        notify.warning("Update request already pending for this section");
        return;
      }

      if (alreadySent) {
        notify.warning("Update request already exists for this section");
        return;
      }

      setPendingRequests((prev) => [
        ...prev,
        {
          itemTypeId,
          itemTypeName,
          reason: "",
        },
      ]);
    },
    [pendingRequests, sentUpdateRequests],
  );

  const handleRemoveRequest = useCallback((itemTypeId: number) => {
    setPendingRequests((prev) =>
      prev.filter((req) => req.itemTypeId !== itemTypeId),
    );
  }, []);

  const handleUpdateNote = useCallback((itemTypeId: number, reason: string) => {
    setPendingRequests((prev) =>
      prev.map((req) =>
        req.itemTypeId === itemTypeId ? { ...req, reason } : req,
      ),
    );
  }, []);

  const handleSendRequests = useCallback(async () => {
    if (pendingRequests.length === 0) return;

    try {
      for (const request of pendingRequests) {
        await createUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          data: {
            submission_item_types: [request.itemTypeId],
            reason: request.reason,
          },
        });
      }

      setPendingRequests([]);
      notify.success("Update request(s) sent successfully");

      queryClient.invalidateQueries({
        queryKey: ["packages", submissionPackageId],
      });
    } catch (error) {
      notify.error("Failed to send update request(s)");
    }
  }, [
    pendingRequests,
    submissionPackageId,
    createUpdateRequestMutation,
    queryClient,
  ]);

  const handleAcceptUpdate = useCallback(
    async (updateRequestId: number) => {
      try {
        await acceptUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          updateRequestId,
        });
      } catch (error) {
        // Error handling is done in the mutation's onError callback
      }
    },
    [submissionPackageId, acceptUpdateRequestMutation],
  );

  const handleWithdrawUpdate = useCallback(
    async (updateRequestId: number) => {
      try {
        await withdrawUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          updateRequestId,
        });
      } catch (error) {
        // Error handling is done in the mutation's onError callback
      }
    },
    [submissionPackageId, withdrawUpdateRequestMutation],
  );

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
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
              <InfoBox
                submissionPackage={submissionPackage}
                accountProject={accountProject}
              />
              <When
                condition={accountProject.account_project_works?.length === 0}
              >
                <Box
                  sx={{
                    pt: BCDesignTokens.layoutMarginXlarge,
                    mb: BCDesignTokens.layoutMarginLarge,
                    width: "100%",
                  }}
                >
                  <UpdateRequestWidget submissionPackage={submissionPackage} />
                </Box>
              </When>
              <Box
                sx={{
                  mt:
                    accountProject.account_project_works?.length === 0
                      ? "36px"
                      : "0px",
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingXsmall,
                }}
              >
                <ItemsTable
                  submissionPackage={submissionPackage}
                  accountProject={accountProject}
                  onRequestUpdate={handleRequestUpdate}
                  pendingRequestItemTypeIds={pendingRequests.map(
                    (r) => r.itemTypeId,
                  )}
                  sentRequestItemTypeIds={sentUpdateRequests.map(
                    (r) => r.itemTypeId,
                  )}
                />
              </Box>
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginLarge,
                  width: "100%",
                }}
              >
                <SectionUpdateRequestPanel
                  pendingRequests={pendingRequests}
                  sentRequests={sentUpdateRequests}
                  previousRequests={previousUpdateRequests}
                  onRemoveFlag={handleRemoveRequest}
                  onUpdateNote={handleUpdateNote}
                  onSendRequests={handleSendRequests}
                  onAcceptUpdate={handleAcceptUpdate}
                  onWithdrawUpdate={handleWithdrawUpdate}
                  packageId={Number(submissionPackageId)}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() =>
                    navigate({ to: `/staff/projects/${accountProject.id}` })
                  }
                  sx={{
                    backgroundColor: BCDesignTokens.themeBlue100,
                    color: BCDesignTokens.typographyColorPrimaryInvert,
                    textTransform: "none",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: BCDesignTokens.themeBlue90,
                    },
                  }}
                >
                  Save & Exit
                </Button>
                {submissionPackage?.type.name ===
                  SubmissionPackageType.ADDITIONAL_INFORMATION &&
                  !isAcknowledged && (
                    <Button
                      variant="outlined"
                      onClick={handleAcknowledgeClick}
                      disabled={!allDocumentsVerified || updatingPackageState}
                      loading={updatingPackageState}
                      sx={{
                        border: `1px solid ${BCDesignTokens.themeBlue100}`,
                        color: BCDesignTokens.themeBlue100,
                        backgroundColor: BCDesignTokens.themeGray10,
                        textTransform: "none",
                        fontWeight: "bold",
                        "&:hover": {
                          backgroundColor: BCDesignTokens.themeGray20,
                          border: `1px solid ${BCDesignTokens.themeBlue100}`,
                        },
                      }}
                    >
                      Acknowledge Submission <i>(optional)</i>
                    </Button>
                  )}
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
