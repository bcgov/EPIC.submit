import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionStatusChipStack } from "@/components/App/SubmissionStatusChip";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "@/components/App/Submission/DocumentRow";
import { If, When } from "react-if";
import EmptyRow from "@/components/App/Projects/ProjectTable/EmptyRow";
import { SubmissionItemTableRowProps } from "@/components/App/Submission/SubmissionItemTableRow";
import { useQueryClient } from "@tanstack/react-query";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { SubmissionItemMethod } from "@/models/SubmissionItem";
import { useMemo } from "react";
import { getSubmissionItemLabel } from "@/utils";
import { UPDATE_REQUEST_STATUS, UPDATE_REQUEST_TYPE } from "@/models/UpdateRequest";
import { SUBMISSION_TYPE } from "@/models/Submission";
import dayjs from "dayjs";

export default function ProponentSubmissionItemTableRow({
  item,
  packageType,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
  });

  const { id, submissions, status, type_id } = item;

  const isIPD = packageType.name === SubmissionPackageType.IPD;

  const isFormSubmission =
    item.type.submission_method === SubmissionItemMethod.FORM_SUBMISSION;

  const name = useMemo(() => {
    return getSubmissionItemLabel(item.type.name);
  }, [item.type.name]);

  const has_document =
    item.type.submission_method === SubmissionItemMethod.DOCUMENT_UPLOAD;

  const queryClient = useQueryClient();

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({ packageId: Number(submissionPackageId) })
      .queryKey,
  );

  const hasOpenUpdateRequest = useMemo(() => {
    if (!submissionPackage) return false;
    return submissionPackage.update_requests.some(
      (updateRequest) =>
        updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
        updateRequest.active &&
        updateRequest.submission_item_types.includes(type_id)
    );
  }, [submissionPackage, type_id]);

  const hasAccountProjectWork = Boolean(submissionPackage?.account_project_work?.id);

  const isUpdated = useMemo(() => {
    if (!submissionPackage) return false;
    
    const last_update_request = submissionPackage.update_requests
      .filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.UPDATE.value &&
          updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
          updateRequest.active,
      )
      .sort((a, b) => dayjs(b.created_date).diff(dayjs(a.created_date)))[0];

    if (!last_update_request) return false;
    
    return Boolean(
      item.submissions?.find((submission) =>
        dayjs(submission.created_date).isAfter(
          last_update_request.created_date,
        ),
      ),
    );
  }, [item, submissionPackage]);
  const actionLabel = has_document ? "Add/Edit Files" : "Fill/Edit Form";

  const onActionClick = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  return (
    <>
      <SubmitTablePrimaryRow key={`row-${name}`} error={error}>
        <SubmitPrimaryRowTableCell width={"50%"}>
          <MuiLink
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              color="inherit"
              fontWeight={900}
              sx={{ mx: 0.5, fontSize: "1rem", lineHeight: "1.688rem" }}
            >
              {name}
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="left" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"20%"}>
          <When condition={!hasAccountProjectWork}>
            <Box mr={2}>
              <SubmissionStatusChipStack
                status={status}
                isUpdateRequested={hasOpenUpdateRequest}
                isUpdated={false}
                packageStatus={submissionPackage?.status}
              />
            </Box>
          </When>
          <When condition={hasAccountProjectWork}>
            <If condition={hasOpenUpdateRequest}>
              <Chip
                label="Update Requested"
                size="small"
                sx={{
                  backgroundColor: "#ffdeb8",
                  border: "1px solid #f18a15",
                  color: BCDesignTokens.typographyColorPrimary,
                  fontSize: "12px",
                  height: "24px",
                  fontWeight: 400,
                }}
              />
            </If>
            <If condition={isUpdated}>
              <Chip
                label="Updated"
                size="small"
                sx={{
                  backgroundColor: "#F6E4FF",
                  border: "1px solid #9B6BDA",
                  color: BCDesignTokens.typographyColorPrimary,
                  fontSize: "12px",
                  height: "24px",
                  fontWeight: 400,
                }}
              />
            </If>
          </When>
        </SubmitPrimaryRowTableCell>
      
        <SubmitPrimaryRowTableCell
          align="right"
          width={isIPD ? "30%" : "10%"}
          sx={{
            paddingRight: "2% !important",
          }}
        >
          <When
            condition={
              isFormSubmission ||
              !submissionPackage?.submitted_on ||
              packageType.name !== SubmissionPackageType.MANAGEMENT_PLAN ||
              submissionPackage.update_requests.filter(
                (updateRequest) =>
                  updateRequest.status !== UPDATE_REQUEST_STATUS.ACCEPTED.value,
              ).length > 0
            }
          >
            <Typography
              variant="body2"
              data-testid={`submission-item-action-${name}`}
              sx={{
                color: BCDesignTokens.typographyColorLink,
                "&:hover": { cursor: "pointer", textDecoration: "underline" },
              }}
              onClick={onActionClick}
            >
              {actionLabel}
            </Typography>
          </When>
        </SubmitPrimaryRowTableCell>
      </SubmitTablePrimaryRow>
      {submissions
        .filter((submission) => submission.type === SUBMISSION_TYPE.DOCUMENT)
        .map((submission) => (
          <DocumentRow
            key={`doc-row-${submission.id}`}
            documentSubmission={submission}
            submissionItem={item}
            submissionPackage={submissionPackage}
            packageType={packageType}
          />
        ))}
      <When
        condition={
          error &&
          packageType.name !== SubmissionPackageType.ADDITIONAL_INFORMATION
        }
      >
        <TableRow key={`row-${name}-divider`}>
          <TableCell
            width={"100%"}
            sx={{ py: BCDesignTokens.layoutPaddingXsmall, px: 0, border: 0 }}
          >
            <Typography
              variant="body2"
              sx={{ color: BCDesignTokens.typographyColorDanger }}
            >
              Please complete the {name} section.
            </Typography>
          </TableCell>
        </TableRow>
      </When>
      <EmptyRow colSpan={5} />
    </>
  );
}
