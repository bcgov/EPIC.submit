import { Link as MuiLink, Typography } from "@mui/material";
import {
  SubmissionItemTableCell,
  PackageTableRow,
} from "../../Submission/SubmissionItemTableRow";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import { useObjectUploadStore } from "@/store/documentUploadStore";
import PendingRow from "./PendingRow";

type InternalDocumentsProps = {
  internalStaffDocuments: Array<InternalStaffDocument>;
  numColumns?: number;
};
export default function Rows({
  internalStaffDocuments,
  numColumns = 4,
}: InternalDocumentsProps) {
  const { uploadObjects: pendingDocuments } = useObjectUploadStore();

  const internalStaffDocumentsIds = new Set(
    internalStaffDocuments.map((doc) => doc.id),
  );

  const filteredPendingDocuments = pendingDocuments.filter(
    (doc) => !internalStaffDocumentsIds.has(doc.submissionId ?? 0),
  );

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
        <SubmissionItemTableCell
          align="right"
          colSpan={numColumns - 1}
        ></SubmissionItemTableCell>
      </PackageTableRow>
      {internalStaffDocuments.map((document) => (
        <Row
          key={`doc-row-${document.id}`}
          internalStaffDocument={document}
          numColumns={5}
        />
      ))}
      {filteredPendingDocuments.map((pendingDocument) => (
        <PendingRow
          key={`pending-doc-row-${pendingDocument.id}`}
          pendingDocument={pendingDocument}
        />
      ))}
      <EmptyRow colSpan={5} />
    </>
  );
}
