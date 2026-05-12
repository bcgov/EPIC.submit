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
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { PackageStatusChipStack } from "@/components/App/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/App/Submission/packageTableStore";
import { useQueryClient } from "@tanstack/react-query";
import ItemsTable from "@/components/App/Submission/ItemsTable";
import { useMounted } from "@/hooks/common";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import { When } from "react-if";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { useManagementPlanName } from "@/hooks/useManagementPlanName";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { SectionUpdateRequestPanel } from "@/components/App/SubmissionItem/SectionUpdateRequestPanel";
import UpdateRequestWidget from "@/components/App/Submission/UpdateRequestWidget";
import { SubmissionPackageType, PACKAGE_STATUS } from "@/models/Package";
import AcknowledgeSubmissionModal from "@/components/App/Submission/Modals/AcknowledgeSubmissionModal";
import { useUpdateRequests } from "@/hooks/useUpdateRequests";
import { useStaffSubmissionPage } from "@/hooks/useStaffSubmissionPage";
import ApproveSubmissionModal from "@/components/App/Submission/Modals/ApproveSubmissionModal";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { reset } = usePackageTableStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    projectId: accountProjectIdParam,
    submissionPackageId: submissionPackageIdParam,
  } = useParams({
    from: Route.id,
  });

  const submissionPackageId = Number(submissionPackageIdParam);
  const accountProjectId = Number(accountProjectIdParam);

  const {
    accountProject,
    submissionPackage,
    isFetching,
    updatePackageState,
    updatingPackageState,
    isLatestApprovedPackageVersion,
    isNewerThanLastApprovedButNotApproved,
    canAcknowledge,
    showAcknowledgeButton,
    showApproveButtons,
    setOpenModal,
    setCloseModal,
  } = useStaffSubmissionPage({
    submissionPackageId,
    accountProjectId,
    queryClient,
  });

  const {
    pendingRequests,
    previousUpdateRequests,
    sentUpdateRequests,
    openRequestSectionNames,
    handleRequestUpdate,
    handleRemoveRequest,
    handleUpdateNote,
    handleSendRequests,
    handleAcceptUpdate,
    handleWithdrawUpdate,
  } = useUpdateRequests({
    submissionPackageId,
    submissionPackage,
    accountProjectId,
    queryClient,
  });

  const managementPlanName = useManagementPlanName(submissionPackage);

  useMounted(() => {
    return () => {
      reset();
    };
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

  const handleApproveSubmissionClick = () => {
    setOpenModal(
      <ApproveSubmissionModal
        onConfirm={() => {
          updatePackageState({
            packageId: submissionPackageId,
            data: {
              status: PACKAGE_STATUS.APPROVED.value,
            },
          });
        }}
        onCancel={() => setCloseModal()}
        hasOpenUpdateRequests={sentUpdateRequests.length > 0}
        openRequestSectionNames={openRequestSectionNames}
      />,
    );
  };

  const handleNotApprovedClick = () => {
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
              <InfoBox submissionPackage={submissionPackage} />
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
                  width: "100%",
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
                  sx={{ ml: "auto" }}
                >
                  Save & Exit
                </Button>
                {showAcknowledgeButton && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleAcknowledgeClick}
                    disabled={!canAcknowledge || updatingPackageState}
                    loading={updatingPackageState}
                  >
                    {submissionPackage?.type.name ===
                    SubmissionPackageType.ADDITIONAL_INFORMATION ? (
                      <>
                        Acknowledge Submission <i>(optional)</i>
                      </>
                    ) : (
                      "Acknowledge Submission"
                    )}
                  </Button>
                )}
                {showApproveButtons && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleNotApprovedClick}
                      disabled={updatingPackageState}
                      loading={updatingPackageState}
                    >
                      Not Approved
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleApproveSubmissionClick}
                      disabled={updatingPackageState}
                      loading={updatingPackageState}
                    >
                      Approve Submission
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
