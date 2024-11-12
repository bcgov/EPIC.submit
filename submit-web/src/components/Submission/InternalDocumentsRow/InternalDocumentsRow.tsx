import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { Unless } from "react-if";
import {
  SubmissionItemTableCell,
  PackageTableRow,
} from "../SubmissionItemTableRow";

export default function InternalDocumentsRow() {
  const actionLabel = "Add Documents";

  const onActionClick = () => {};

  return (
    <>
      <PackageTableRow>
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
              EAO Internal Documents
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
      {/* {submissions.map((submission) => (
        <DocumentRow
          key={`doc-row-${submission.id}`}
          documentSubmission={submission}
        />
      ))} */}
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
