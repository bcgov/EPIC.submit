import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Collapse,
  Typography,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useState } from "react";
import { SubmissionPackage } from "@/models/Package";
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

  const updateRequests = submissionPackage?.update_requests || [];

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
              : defaultMessage
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
        submission_item_ids: submissionItems,
      },
    });
  };

  const handleCancelReason = () => {
    setIsCreateRequestOpen(false);
    setExpanded(false);
  };

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
      }}
      expanded={expanded}
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
              Update Requests
            </Typography>
            <When condition={updateRequests && updateRequests.length > 0}>
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
                label={`${updateRequests.length}`}
              />
            </When>
            <KeyboardArrowRightIcon
              fontSize="medium"
              sx={{ color: "#38598A", p: 0 }}
            />
          </Box>
          <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_create]}>
            <Box onClick={handleIsCreateRequestOpen}>
              <Typography
                variant="body2"
                color={BCDesignTokens.typographyColorLink}
                sx={{
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Request an Update
              </Typography>
            </Box>
          </PermissionsGate>
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          pb: 0,
          border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
          borderTop: "none",
          borderRadius: "4px",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
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
        <When condition={Boolean(updateRequests)}>
          {updateRequests.length > 0 ? (
            updateRequests.map((updateRequest) => (
              <RequestSection
                key={updateRequest.id}
                updateRequest={updateRequest}
                submissionPackage={submissionPackage}
              />
            ))
          ) : (
            <Typography variant="body1" sx={{ mb: 1 }}>
              No requests have been made yet.
            </Typography>
          )}
        </When>
      </AccordionDetails>
    </Accordion>
  );
}
