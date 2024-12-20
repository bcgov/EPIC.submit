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
import {
  getStaffSubmissionPackageQueryOptions,
  useCreatePackageUpdateRequest,
} from "@/hooks/api/usePackages";
import AddRequestSection from "./AddRequestSection";
import { useQueryClient } from "@tanstack/react-query";
import { STAFF_QUERY_KEY } from "@/hooks/api/constants";

type UpdateRequestWidgetProps = {
  submissionPackage: SubmissionPackage;
};
export default function UpdateRequestWidget({
  submissionPackage,
}: UpdateRequestWidgetProps) {
  const queryClient = useQueryClient();
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateRequests = submissionPackage?.update_requests || [];

  const { mutate: createUpdateRequest, isPending: isCreatingUpdateRequest } =
    useCreatePackageUpdateRequest({
      accountProjectId: submissionPackage.account_project_id,
      packageId: submissionPackage.id,
    });

  const handleIsCreateRequestOpen = () => {
    setExpanded(true);
    setIsCreateRequestOpen(!isCreateRequestOpen);
  };

  const handleCreateUpdateRequest = async (requestData: {
    note: string;
    submissionItems: unknown[];
  }) => {
    const { note, submissionItems } = requestData;
    createUpdateRequest({
      packageId: Number(submissionPackage.id),
      data: {
        note: note,
        submission_item_ids: submissionItems,
      },
    });
  };

  const handleCancelNote = () => {
    setIsCreateRequestOpen(false);
    setExpanded(false);
  };

  const packageQueryState = queryClient.getQueryState([
    STAFF_QUERY_KEY.SUBMISSION_PACKAGE,
    submissionPackage.id,
  ]);

  console.log(packageQueryState?.fetchStatus);

  if (!updateRequests) return null;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: "4px",
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
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
        sx={{
          py: 0,
          borderRadius: "4px",
          border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        }}
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
              }}
            >
              Submission/Update Request
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
          <Box onClick={handleIsCreateRequestOpen}>
            <Typography
              variant="body1"
              color={BCDesignTokens.typographyColorLink}
              sx={{ cursor: "pointer", width: "100%" }}
            >
              + Request an Update
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pb: 0 }}>
        <Collapse in={isCreateRequestOpen} unmountOnExit>
          <AddRequestSection
            submissionPackage={submissionPackage}
            handleCreateUpdateRequest={handleCreateUpdateRequest}
            isCreatingUpdateRequest={isCreatingUpdateRequest}
            handleCancelNote={handleCancelNote}
          />
        </Collapse>
        <When condition={Boolean(updateRequests)}>
          {updateRequests.length > 0 ? (
            updateRequests.map((updateRequest) => (
              <RequestSection
                key={updateRequest.id}
                updateRequest={updateRequest}
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
