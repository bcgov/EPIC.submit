import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionStatusChipStack } from "../../SubmissionStatusChip";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "../DocumentRow";
import { Unless, When } from "react-if";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import {
  PackageTableRow,
  SubmissionItemTableCell,
  SubmissionItemTableRowProps,
} from ".";
import { useQueryClient } from "@tanstack/react-query";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";

export default function ProponentSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { name, id, submissions, has_document, status, isUpdateRequest } = item;
  const queryClient = useQueryClient();

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const actionLabel = has_document ? "Add/Edit Files" : "Fill/Edit Form";

  const onActionClick = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  return (
    <>
      <PackageTableRow key={`row-${item.name}`} error={error}>
        <SubmissionItemTableCell>
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
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="right" colSpan={2} />
        <SubmissionItemTableCell align="right">
          <SubmissionStatusChipStack
            status={status}
            isUpdateRequested={isUpdateRequest}
          />
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="right">
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
        </SubmissionItemTableCell>
      </PackageTableRow>
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
              Please complete the {item.name} section.
            </Typography>
          </TableCell>
        </TableRow>
      </When>
      <EmptyRow colSpan={5} />
    </>
  );
}
