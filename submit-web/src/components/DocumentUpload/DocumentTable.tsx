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
import TableSortLabel from "@mui/material/TableSortLabel";
import { useState } from "react";
import { Order } from "../Shared/Table/utils";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { StyledTableHeadCell } from "../Shared/Table/common";
import { Submission } from "@/models/Submission";
import DocumentTableRow, {
  StyledHeadTableCell,
  DocumentHeadTableRow,
} from "./DocumentTableRow";
import { Document } from "@/store/documentUploadStore";
import PendingDocumentRow from "./PendingDocumentRow";

export default function DocumentTable({
  header,
  documents,
  pendingDocuments,
}: {
  header: string;
  documents: Array<Submission>;
  pendingDocuments: Array<Document>;
}) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof Submission>(
    "document.submitted_document.name"
  );

  const handleRequestSort = (property: keyof Submission) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedSubmissionItems = documents?.map((document) => ({
    id: document.id,
    name: document.submitted_document.name,
    submitted_by: document.account_user.full_name,
    version: document.version,
    url: document.submitted_document.url,
  }));

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
              <TableSortLabel
                active={orderBy === "name"}
                direction={orderBy === "name" ? order : "asc"}
                onClick={() => handleRequestSort("name")}
                IconComponent={SwapVertIcon}
                sx={{
                  ".MuiTableSortLabel-icon": {
                    color: `${BCDesignTokens.themeGray70} !important`,
                    "&:hover": {
                      color: "#EDEBE9 !important",
                    },
                  },
                }}
              >
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
              </TableSortLabel>
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
          {sortedSubmissionItems?.map((document) => (
            <DocumentTableRow
              key={`custom-row-${document.name}`}
              documentItem={document}
            />
          ))}
          {pendingDocuments?.map((document) => (
            <PendingDocumentRow
              key={`pending-row-${document.file.name}`}
              documentItem={document}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
