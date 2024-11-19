import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import SubmissionStatusChip from "../SubmissionStatusChip";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "../DocumentRow";
import { Unless, When } from "react-if";
import { SubmissionItemTableCell, SubmissionItemTableRowProps } from ".";
import { PackageTableRow } from ".";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";

export default function ProponentSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { name, id, submissions, has_document, status } = item;

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
          <When condition={SUBMISSION_STATUS.NEW_SUBMISSION.value !== status}>
            <SubmissionStatusChip status={status} />
          </When>
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="right">
          <Unless condition={status === SUBMISSION_STATUS.SUBMITTED.value}>
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
