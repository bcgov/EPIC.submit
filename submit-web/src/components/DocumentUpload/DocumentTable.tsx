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

type DocumentTableProps = {
  header: string;
  documents?: Array<Submission>;
  pendingDocuments: Array<UploadObject>;
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
