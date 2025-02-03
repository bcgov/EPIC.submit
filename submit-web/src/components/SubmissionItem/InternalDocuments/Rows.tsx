import { Link as MuiLink, Typography } from "@mui/material";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import { useObjectUploadStore } from "@/store/documentUploadStore";
import PendingRow from "./PendingRow";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useEffect, useMemo, useState } from "react";

type InternalDocumentsProps = Readonly<{
  internalStaffDocuments: Array<InternalStaffDocument>;
  numColumns?: number;
  hideAction?: boolean;
}>;
export default function Rows({
  internalStaffDocuments,
  numColumns = 4,
  hideAction = false,
}: InternalDocumentsProps) {
  const [documents, setDocuments] = useState<Array<InternalStaffDocument>>(
    internalStaffDocuments,
  );
  const { uploadObjects: pendingDocuments } = useObjectUploadStore();

  const internalStaffDocumentsIds = useMemo(() => {
    return new Set(documents.map((doc) => doc.id));
  }, [documents]);

  useEffect(() => {
    setDocuments(internalStaffDocuments);
  }, [internalStaffDocuments]);

  const filteredPendingDocuments = pendingDocuments.filter(
    (doc) =>
      !doc.submissionId || !internalStaffDocumentsIds.has(doc.submissionId),
  );

  return (
    <>
      <SubmitTablePrimaryRow>
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
              EAO Internal Documents
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="right" colSpan={numColumns - 1} />
      </SubmitTablePrimaryRow>
      {internalStaffDocuments.map((document) => (
        <Row
          key={`doc-row-${document.id}`}
          internalStaffDocument={document}
          numColumns={5}
          setDocuments={setDocuments}
          hideAction={hideAction}
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
