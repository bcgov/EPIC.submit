import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SUBMISSION_STATUS } from "@/models/Submission";
import DocumentRow from "../DocumentRow";
import { Unless, When } from "react-if";
import { SubmissionItemTableCell, SubmissionItemTableRowProps } from ".";
import { PackageTableRow } from "@/components/DocumentUpload/DocumentTableRow";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { name, submissions, has_document, status } = item;

  const actionLabel = has_document ? "Review" : "View";

  const onActionClick = () => {};

  return (
    <>
      <PackageTableRow key={`row-${item.name}`} error={error}>
        <SubmissionItemTableCell colSpan={2}>
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
        <SubmissionItemTableCell align="right"></SubmissionItemTableCell>
        <SubmissionItemTableCell align="right"></SubmissionItemTableCell>
        <SubmissionItemTableCell align="center">
          {/* TODO Add Staff Status' */}
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="center">
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
