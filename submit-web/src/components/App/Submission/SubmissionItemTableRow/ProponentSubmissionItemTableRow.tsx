import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionStatusChipStack } from "@/components/App/SubmissionStatusChip";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "@/components/App/Submission/DocumentRow";
import { When } from "react-if";
import EmptyRow from "@/components/App/Projects/ProjectTable/EmptyRow";
import { SubmissionItemTableRowProps } from "@/components/App/Submission/SubmissionItemTableRow";
import { useQueryClient } from "@tanstack/react-query";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage, SubmissionPackageType, PACKAGE_STATUS } from "@/models/Package";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { SubmissionItemMethod } from "@/models/SubmissionItem";
import { useMemo } from "react";
import { getSubmissionItemLabel } from "@/utils";
import {
  UPDATE_REQUEST_STATUS,
} from "@/models/UpdateRequest";
import { SUBMISSION_TYPE } from "@/models/Submission";

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
        updateRequest.submission_item_types.includes(type_id),
    );
  }, [submissionPackage, type_id]);

  const isPackageAcknowledged = useMemo(() => {
    return submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value) || false;
  }, [submissionPackage]);

  const isPackagedReachedEnd = useMemo(() => {
    return submissionPackage?.status.includes(PACKAGE_STATUS.APPROVED.value) ||
      submissionPackage?.status.includes(PACKAGE_STATUS.REJECTED.value) ||
      submissionPackage?.status.includes(PACKAGE_STATUS.NOT_APPROVED.value) ||
      submissionPackage?.status.includes(PACKAGE_STATUS.ACCEPTED.value);
  }, [submissionPackage]);

  const hasAccountProjectWork = Boolean(
    submissionPackage?.account_project_work?.id,
  );

  const isUpdated = useMemo(() => {
    // Check if any submission in this section has is_updated flag set to true
    return Boolean(
      item.submissions?.find((submission) => submission.is_updated)
    );
  }, [item.submissions]);
  const showActionLabels = useMemo(() => {
    return !isPackagedReachedEnd && (isFormSubmission ||
      !submissionPackage?.submitted_on ||
      (isPackageAcknowledged && hasOpenUpdateRequest) ||
      !isPackageAcknowledged)
  }, [hasOpenUpdateRequest, isPackageAcknowledged, isFormSubmission, submissionPackage, isPackagedReachedEnd]);
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
          <Box ml={1} display={"flex"} justifyContent={"flex-start"}>
            <SubmissionStatusChipStack
              status={status}
              isUpdateRequested={hasOpenUpdateRequest}
              isUpdated={isUpdated}
              packageStatus={submissionPackage?.status}
              showOnlyUpdateChips={hasAccountProjectWork}
            />
          </Box>
        </SubmitPrimaryRowTableCell>

        <SubmitPrimaryRowTableCell
          align="right"
          width={isIPD ? "30%" : "10%"}
          sx={{
            paddingRight: "2% !important",
          }}
        >
          <When condition={showActionLabels}>
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
