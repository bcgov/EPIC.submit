import {
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { InternalStaffDocument } from "@/models/SubmissionItem";

import { StyledTableHeadCell } from "@/components/Shared/Table/common";
import Rows from "./Rows";

export default function Table({
  internalStaffDocuments,
}: {
  internalStaffDocuments: Array<InternalStaffDocument>;
}) {
  return (
    <TableContainer sx={{ height: "100%", cursor: "pointer" }}>
      <MuiTable>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
            },
          }}
        >
          <TableRow>
            <StyledTableHeadCell>
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
          <Rows
            internalStaffDocuments={internalStaffDocuments}
            numColumns={4}
          />
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
