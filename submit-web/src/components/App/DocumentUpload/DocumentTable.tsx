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
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { Submission } from "@/models/Submission";
import DocumentTableRow, {
  StyledHeadTableCell,
  DocumentHeadTableRow,
} from "./DocumentTableRow";
import PendingDocumentRow from "./PendingDocumentRow";

type DocumentTableProps = Readonly<{
  header: string;
  documents?: Array<Submission>;
  pendingDocuments: Array<any>;
  folder?: string;
  isGeoSpatial?: boolean;
  formFieldName?: string;
  onDocumentClick?: (documentItem: Submission) => void;
  onUploadComplete?: (submission: Submission) => void;
}>;

export default function DocumentTable({
  header,
  documents = [],
  pendingDocuments = [],
  formFieldName,
  folder: s3Folder,
  isGeoSpatial,
  onDocumentClick,
  onUploadComplete,
}: DocumentTableProps) {
  if (documents.length === 0 && pendingDocuments.length === 0) {
    return null;
  }
  return (
    <TableContainer component={Box} sx={{ height: "100%", overflow: "visible" }}>
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
            <SubmitTableHeadCell align="left">Uploaded by</SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Version</SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Actions</SubmitTableHeadCell>
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
              formFieldName={formFieldName}
              folder={s3Folder}
              onDocumentClick={onDocumentClick}
            />
          ))}
          {pendingDocuments?.map((document) => (
            <PendingDocumentRow
              key={`pending-row-${document.file.name}`}
              documentItem={document}
              folder={s3Folder}
              isGeoSpatial={isGeoSpatial}
              onUploadComplete={onUploadComplete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
