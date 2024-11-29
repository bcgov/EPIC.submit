import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentRow from "../DocumentRow";
import { When } from "react-if";
import { SubmissionItemTableCell, SubmissionItemTableRowProps } from ".";
import { PackageTableRow } from ".";
import { useNavigate, useParams } from "@tanstack/react-router";
import { SubmissionStatusChipStack } from "../../SubmissionStatusChip";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { name, submissions, has_document, id, status, reviewStatus } = item;

  const actionLabel = has_document ? "Review" : "View";

  const onActionClick = () => {
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  return (
    <>
      <PackageTableRow
        key={`row-${item.name}`}
        error={error}
        onClick={onActionClick}
      >
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
          <When condition={status}>
            <SubmissionStatusChipStack
              status={status}
              reviewStatus={reviewStatus}
            />
          </When>
        </SubmissionItemTableCell>

        <SubmissionItemTableCell align="center">
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
