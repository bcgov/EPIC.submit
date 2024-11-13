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
import { StyledTableHeadCell } from "../Shared/Table/common";
import { Submission } from "@/models/Submission";
import DocumentTableRow, {
  StyledHeadTableCell,
  DocumentHeadTableRow,
} from "./DocumentTableRow";
import { Document } from "@/store/documentUploadStore";
import PendingDocumentRow from "./PendingDocumentRow";

type DocumentTableProps = {
  header: string;
  documents?: Array<Submission>;
  pendingDocuments: Array<Document>;
  folder?: string;
};
export default function DocumentTable({
  header,
  documents = [],
  pendingDocuments,
  folder: s3Folder,
}: DocumentTableProps) {
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
            <StyledTableHeadCell colSpan={2}>
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
            </StyledTableHeadCell>
            <StyledTableHeadCell align="right">Uploaded by</StyledTableHeadCell>
            <StyledTableHeadCell align="right">Version</StyledTableHeadCell>
            <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>
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
            />
          ))}
          {pendingDocuments?.map((document) => (
            <PendingDocumentRow
              key={`pending-row-${document.file.name}`}
              documentItem={document}
              folder={s3Folder}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
