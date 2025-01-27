import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "../Shared/Table/common";
import { Submission } from "@/models/Submission";
import DocumentTableRow, {
  StyledHeadTableCell,
  DocumentHeadTableRow,
} from "./DocumentTableRow";
import { UploadObject } from "@/store/documentUploadStore";
import PendingDocumentRow from "./PendingDocumentRow";

type DocumentTableProps = Readonly<{
  header: string;
  documents?: Array<Submission>;
  pendingDocuments: Array<UploadObject>;
  folder?: string;
  setDocumentSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
}>;

export default function DocumentTable({
  header,
  documents = [],
  pendingDocuments = [],
  folder: s3Folder,
  setDocumentSubmissions,
}: DocumentTableProps) {
  if (documents.length === 0 && pendingDocuments.length === 0) {
    return null;
  }

  const documentIds = documents.map((document) => document.id);
  const filteredPendingDocuments = pendingDocuments.filter(
    (document) => !documentIds.includes(document.id),
  );

  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
            },
          }}
        >
          <TableRow>
            <SubmitTableHeadCell colSpan={2}>
              <Typography
                variant="body2"
                sx={{
                  color: BCDesignTokens.themeGray70,
                  "&:hover": {
                    color: "#EDEBE9",
                  },
                }}
              >
                Form/Document
              </Typography>
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Uploaded by</SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Version</SubmitTableHeadCell>
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <DocumentHeadTableRow>
            <StyledHeadTableCell colSpan={5}>
              <Typography
                variant="h6"
                color="inherit"
                fontWeight={900}
                sx={{ mx: 0.5 }}
              >
                {header}
              </Typography>
            </StyledHeadTableCell>
          </DocumentHeadTableRow>
          {documents?.map((document) => (
            <DocumentTableRow
              key={`custom-row-${document.id}`}
              documentItem={document}
              setDocumentSubmissions={setDocumentSubmissions}
            />
          ))}
          {filteredPendingDocuments?.map((document) => (
            <PendingDocumentRow
              key={`pending-row-${document.file.name}`}
              documentItem={document}
              folder={s3Folder}
              setDocumentSubmissions={setDocumentSubmissions}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
