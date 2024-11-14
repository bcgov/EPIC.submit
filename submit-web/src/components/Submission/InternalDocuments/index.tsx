import { Link as MuiLink, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import {
  SubmissionItemTableCell,
  PackageTableRow,
} from "../SubmissionItemTableRow";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";

type InternalDocumentsProps = {
  internalStaffDocuments: Array<InternalStaffDocument>;
  submissionItemId?: number;
};
export default function InternalDocuments({
  internalStaffDocuments,
  submissionItemId,
}: InternalDocumentsProps) {
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
          <When condition={Boolean(submissionItemId)}>
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
          </When>
        </SubmissionItemTableCell>
      </PackageTableRow>
      {internalStaffDocuments.map((document) => (
        <Row key={`doc-row-${document.id}`} internalStaffDocument={document} />
      ))}
      <EmptyRow colSpan={5} />
    </>
  );
}
