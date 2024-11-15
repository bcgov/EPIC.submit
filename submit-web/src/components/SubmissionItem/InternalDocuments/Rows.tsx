import { Link as MuiLink, Typography } from "@mui/material";
import {
  SubmissionItemTableCell,
  PackageTableRow,
} from "../../Submission/SubmissionItemTableRow";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import PendingRow from "./PendingRow";

type InternalDocumentsProps = {
  internalStaffDocuments: Array<InternalStaffDocument>;
  submissionItemId?: number;
};
export default function Rows({
  internalStaffDocuments,
}: InternalDocumentsProps) {
  const { documents: pendingDocuments } = useDocumentUploadStore();

  return (
    <>
      <PackageTableRow>
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
              EAO Internal Documents
            </Typography>
          </MuiLink>
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="right" colSpan={3} />
      </PackageTableRow>
      {internalStaffDocuments.map((document) => (
        <Row key={`doc-row-${document.id}`} internalStaffDocument={document} />
      ))}
      {pendingDocuments.map((pendingDocument) => (
        <PendingRow
          key={`pending-doc-row-${pendingDocument.id}`}
          pendingDocument={pendingDocument}
        />
      ))}
      <EmptyRow colSpan={5} />
    </>
  );
}
