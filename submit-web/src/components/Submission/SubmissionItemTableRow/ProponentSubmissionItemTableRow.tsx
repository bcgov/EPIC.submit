import {
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
import { filterOpenUpdateRequests } from "@/utils";

export default function ProponentSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { id, submissions, status } = item;
  const name = item.type.name;
  const has_document =
    item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD;

  const queryClient = useQueryClient();

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const isUpdateRequest = useMemo(() => {
    if (!submissionPackage) return false;
    return filterOpenUpdateRequests(submissionPackage.update_requests)
      .flatMap((updateRequest) => updateRequest.submission_item_ids)
      .includes(id);
  }, [submissionPackage, id]);

  const actionLabel = has_document ? "Add/Edit Files" : "Fill/Edit Form";

  const onActionClick = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

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
            isUpdateRequested={isUpdateRequest}
          />
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="right">
          <Unless
            condition={
              submissionPackage?.submitted_on &&
              submissionPackage.update_requests.length === 0
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
      {submissions.map((submission) => (
        <DocumentRow
          key={`doc-row-${submission.id}`}
          documentSubmission={submission}
          submissionItem={item}
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
      <EmptyRow colSpan={5} />
    </>
  );
}
