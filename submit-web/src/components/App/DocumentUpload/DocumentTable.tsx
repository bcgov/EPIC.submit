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
}>;

export default function DocumentTable({
  header,
  documents = [],
  pendingDocuments = [],
  formFieldName,
  folder: s3Folder,
  isGeoSpatial,
  onDocumentClick,
}: DocumentTableProps) {
  if (documents.length === 0 && pendingDocuments.length === 0) {
    return null;
  }
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
            {isGeoSpatial && (
              <SubmitTableHeadCell align="center">Status</SubmitTableHeadCell>
            )}
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <DocumentHeadTableRow>
            <StyledHeadTableCell colSpan={isGeoSpatial ? 6 : 5}>
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
              isGeoSpatial={isGeoSpatial}
              onDocumentClick={onDocumentClick}
            />
          ))}
          {pendingDocuments?.map((document) => (
            <PendingDocumentRow
              key={`pending-row-${document.file.name}`}
              documentItem={document}
              folder={s3Folder}
              isGeoSpatial={isGeoSpatial}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
