import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionStatusChipStack } from "../../SubmissionStatusChip";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "../DocumentRow";
import { Unless, When } from "react-if";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import { SubmissionItemTableRowProps } from ".";
import { useQueryClient } from "@tanstack/react-query";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import { useMemo } from "react";
import { filterOpenUpdateRequests, getSubmissionItemLabel } from "@/utils";
import dayjs from "dayjs";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import { SUBMISSION_TYPE } from "@/models/Submission";

export default function ProponentSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { id, submissions, status, type_id } = item;

  const name = useMemo(() => {
    return getSubmissionItemLabel(item.type.name);
  }, [item.type.name]);

  const has_document =
    item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD;

  const queryClient = useQueryClient();

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const isUpdated = useMemo(() => {
    if (!submissionPackage) return false;
    const last_update_request = submissionPackage.update_requests
      .filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.UPDATE.value,
      )
      .sort((a, b) => dayjs(b.created_date).diff(dayjs(a.created_date)))[0];

    if (!last_update_request) return false;
    return Boolean(
      item.submissions.find((submission) =>
        dayjs(submission.created_date).isAfter(
          last_update_request?.created_date,
        ),
      ),
    );
  }, [item, submissionPackage]);

  const isUpdateRequest = useMemo(() => {
    if (!submissionPackage || isUpdated) return false;
    return filterOpenUpdateRequests(submissionPackage.update_requests)
      .flatMap((updateRequest) => updateRequest.submission_item_types)
      .includes(type_id);
  }, [submissionPackage, type_id, isUpdated]);

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
        <SubmitPrimaryRowTableCell align="left" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"20%"}>
          <Box mr={2}>
            <SubmissionStatusChipStack
              status={status}
              isUpdateRequested={isUpdateRequest}
              isUpdated={isUpdated}
              packageStatus={submissionPackage?.status}
            />
          </Box>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="left" width={"10%"}>
          <Unless
            condition={
              submissionPackage?.submitted_on &&
              submissionPackage.update_requests.filter(
                (updateRequest) =>
                  updateRequest.status !== UPDATE_REQUEST_STATUS.ACCEPTED.value,
              ).length === 0
            }
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
              onClick={onActionClick}
            >
              {actionLabel}
            </Typography>
          </Unless>
        </SubmitPrimaryRowTableCell>
      </SubmitTablePrimaryRow>
      {submissions
        .filter((submission) => submission.type === SUBMISSION_TYPE.DOCUMENT)
        .map((submission) => (
          <DocumentRow
            key={`doc-row-${submission.id}`}
            documentSubmission={submission}
            submissionItem={item}
          />
        ))}
      <When condition={error}>
        <TableRow key={`row-${name}-divider`}>
          <TableCell
            width={"100%"}
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
      <EmptyRow colSpan={5} />
    </>
  );
}
