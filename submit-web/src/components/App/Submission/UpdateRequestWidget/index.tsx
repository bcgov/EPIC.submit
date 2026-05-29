import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Collapse,
  Divider,
  Typography,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useMemo, useState, Fragment } from "react";
import { SubmissionPackage, PACKAGE_STATUS } from "@/models/Package";
import RequestSection from "./RequestSection";
import { useCreatePackageUpdateRequest } from "@/hooks/api/usePackages";
import AddRequestSection from "./AddRequestSection";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

type UpdateRequestWidgetProps = Readonly<{
  submissionPackage: SubmissionPackage;
  summaryBackgroundColor?: string;
}>;
export default function UpdateRequestWidget({
  submissionPackage,
  summaryBackgroundColor,
}: UpdateRequestWidgetProps) {
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateRequests = useMemo(() => {
    if (!submissionPackage?.update_requests) return [];

    const updateRequests = submissionPackage.update_requests;
    return updateRequests.sort((a, b) => {
      return (
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    });
  }, [submissionPackage?.update_requests]);

  const activeRequests = useMemo(() => {
    if (!updateRequests) return [];
    return updateRequests.filter((request) => request.active);
  }, [updateRequests]);

  const { mutate: createUpdateRequest, isPending: isCreatingUpdateRequest } =
    useCreatePackageUpdateRequest({
      accountProjectId: submissionPackage.account_project_id,
      packageId: submissionPackage.id,
      options: {
        onSuccess: () => {
          notify.success("Update request created successfully");
          handleCancelReason();
        },
        onError: (error) => {
          const defaultMessage = "Failed to create update request";
          notify.error(
            isAxiosError(error)
              ? (error.response?.data.message ?? defaultMessage)
              : defaultMessage,
          );
        },
      },
    });

  const handleIsCreateRequestOpen = () => {
    setExpanded(true);
    setIsCreateRequestOpen(!isCreateRequestOpen);
  };

  const handleCreateUpdateRequest = async (requestData: {
    reason: string;
    submissionItems: unknown[];
  }) => {
    const { reason, submissionItems } = requestData;
    createUpdateRequest({
      packageId: Number(submissionPackage.id),
      data: {
        reason: reason,
        submission_item_types: submissionItems,
      },
    });
  };

  const handleCancelReason = () => {
    setIsCreateRequestOpen(false);
  };

  const isApprovedOrRejected = useMemo(() => {
    if (!submissionPackage?.status) return false;
    return submissionPackage.status.includes(PACKAGE_STATUS.APPROVED.value) ||
           submissionPackage.status.includes(PACKAGE_STATUS.REJECTED.value) ||
           submissionPackage.status.includes(PACKAGE_STATUS.NOT_APPROVED.value);
  }, [submissionPackage?.status]);

  if (!updateRequests) return null;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: "4px",
        mb: BCDesignTokens.layoutMarginLarge,
        p: 0,
        width: "100%",
        "& MuiPaper-root": {
          color: "white",
        },
      }}
      expanded={expanded}
      data-testid="update-request-accordion"
    >
      <AccordionSummary
        expandIcon={null}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={[
          {
            py: 0,
            borderRadius: "4px",
            backgroundColor: summaryBackgroundColor,
            border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
            background: BCDesignTokens.themeGold10,
          },
          expanded && {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        ]}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "space-between",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
            width={"80%"}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#38598A",
                mr: BCDesignTokens.layoutMarginSmall,
                fontWeight: BCDesignTokens.typographyBoldBody,
              }}
            >
              Update & Revision Requests
            </Typography>
            <When condition={activeRequests.length > 0}>
              <Chip
                sx={{
                  backgroundColor: "#F18A15",
                  borderRadius: "100%",
                  ml: BCDesignTokens.layoutMarginXsmall,
                  width: "20px",
                  height: "20px",
                  "& .MuiChip-label": {
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
                label={`${activeRequests.length}`}
              />
            </When>
            <KeyboardArrowRightIcon
              fontSize="medium"
              sx={{ color: "#38598A", p: 0 }}
            />
          </Box>
          {!isApprovedOrRejected && (
            <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_create]}>
              <Box
                onClick={handleIsCreateRequestOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="body2"
                  color={BCDesignTokens.typographyColorLink}
                  sx={{
                    cursor: "pointer",
                    width: "100%",
                  }}
                  data-testid="request-update-button"
                >
                  + Request an Update
                </Typography>
              </Box>
            </PermissionsGate>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={[
          {
            pb: 0,
            border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
            borderTop: `${0}px solid ${BCDesignTokens.supportBorderColorWarning}`,
            borderRadius: "4px",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },
        ]}
      >
        <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_create]}>
          <Collapse in={isCreateRequestOpen} unmountOnExit>
            <AddRequestSection
              submissionPackage={submissionPackage}
              handleCreateUpdateRequest={handleCreateUpdateRequest}
              isCreatingUpdateRequest={isCreatingUpdateRequest}
              handleCancelReason={handleCancelReason}
            />
          </Collapse>
        </PermissionsGate>
        {updateRequests.length > 0 ? (
          updateRequests.map((updateRequest, index) => (
            <Fragment key={updateRequest.id}>
              <RequestSection
                updateRequest={updateRequest}
                submissionPackage={submissionPackage}
              />
              {index !== updateRequests.length - 1 && <Divider />}
            </Fragment>
          ))
        ) : (
          <Typography variant="body1" sx={{ mb: 1 }}>
            No requests have been made yet.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
