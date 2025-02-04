import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentRow from "../DocumentRow";
import { When } from "react-if";
import { SubmissionItemTableRowProps } from ".";
import { useNavigate, useParams } from "@tanstack/react-router";
import { SubmissionStatusChipStack } from "../../SubmissionStatusChip";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";

import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import { useMemo } from "react";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useSuspenseQuery } from "@tanstack/react-query";
import { filterOpenUpdateRequests } from "@/utils";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import dayjs from "dayjs";
import { SUBMISSION_TYPE } from "@/models/Submission";
import SubmissionItemReviewConfirmation from "../SubmissionItemReviewConfirmation";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });

  const navigate = useNavigate();

  const { data: submissionPackage, isPending: isPackagePending } =
    useSuspenseQuery(
      getStaffSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
      }),
    );

  const { submissions, id, status, review, review_start_date } = item;

  const name = item.type.name;
  const hasDocument =
    item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD;

  const isUpdated = useMemo(() => {
    const last_update_request = submissionPackage.update_requests
      .filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.UPDATE.value &&
          updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      )
      .sort((a, b) => dayjs(b.created_date).diff(dayjs(a.created_date)))[0];

    if (!last_update_request) return false;
    return Boolean(
      item.submissions.find((submission) =>
        dayjs(submission.created_date).isAfter(
          last_update_request.created_date,
        ),
      ),
    );
  }, [item, submissionPackage.update_requests]);

  const isUpdateRequest = useMemo(() => {
    if (!submissionPackage) return false;
    return filterOpenUpdateRequests(submissionPackage.update_requests)
      .flatMap((updateRequest) => updateRequest.submission_item_ids)
      .includes(id);
  }, [submissionPackage, id]);

  const isRevisionRequired = useMemo(() => {
    if (!submissionPackage) return false;
    return submissionPackage.update_requests
      .filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value,
      )
      .some((updateRequest) => updateRequest.submission_item_ids.includes(id));
  }, [submissionPackage, id]);

  const actionLabel = hasDocument ? "Review" : "View";

  const handleClick = () => {
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  if (isPackagePending) {
    return null;
  }

  return (
    <>
      <SubmitTablePrimaryRow key={`row-${name}`} error={error}>
        <SubmitPrimaryRowTableCell>
          <MuiLink
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              color="inherit"
              fontWeight={900}
              sx={{ mx: 0.5 }}
            >
              {name}
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="right" colSpan={2} />
        <SubmitPrimaryRowTableCell align="right">
          <SubmissionStatusChipStack
            status={status}
            reviewStatus={review?.status}
            isUpdateRequested={isUpdateRequest}
            isRevisionRequired={isRevisionRequired}
            isUpdated={isUpdated}
          />
        </SubmitPrimaryRowTableCell>

        <SubmitPrimaryRowTableCell align="center">
          <SubmissionItemReviewConfirmation
            onClick={handleClick}
            itemType={name}
            packageId={Number(submissionPackageId)}
            bypass={!hasDocument || Boolean(review_start_date)}
          >
            <Typography
              variant="body2"
              sx={{
                color: BCDesignTokens.typographyColorLink,
                "&:hover": {
                  cursor: "pointer",
                  textDecoration: "underline",
                },
              }}
            >
              {actionLabel}
            </Typography>
          </SubmissionItemReviewConfirmation>
        </SubmitPrimaryRowTableCell>
      </SubmitTablePrimaryRow>
      {submissions
        .filter((submission) => submission.type === SUBMISSION_TYPE.DOCUMENT)
        .map((submission) => (
          <DocumentRow
            submissionItem={item}
            key={`doc-row-${submission.id}`}
            documentSubmission={submission}
            staff
          />
        ))}
      <When condition={error}>
        <TableRow key={`row-${name}-divider`}>
          <TableCell
            colSpan={5}
            sx={{
              py: BCDesignTokens.layoutPaddingXsmall,
              px: 0,
              border: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: BCDesignTokens.typographyColorDanger,
              }}
            >
              Please complete the {name} section.
            </Typography>
          </TableCell>
        </TableRow>
      </When>
      <TableRow key={`row-${name}-divider`}>
        <TableCell
          colSpan={5}
          sx={{
            py: BCDesignTokens.layoutPaddingXsmall,
            border: 0,
          }}
        />
      </TableRow>
    </>
  );
}
