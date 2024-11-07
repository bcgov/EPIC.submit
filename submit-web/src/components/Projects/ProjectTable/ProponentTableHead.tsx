import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { StyledTableHeadCell } from "@/components/Shared/Table/common";

export default function ProponentTableHead() {
  return (
    <TableHead
      sx={{
        border: 0,
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
        },
      }}
    >
      <TableRow>
        <StyledTableHeadCell>Submission Name</StyledTableHeadCell>
        <StyledTableHeadCell align="right">Date Submitted</StyledTableHeadCell>
        <StyledTableHeadCell align="right">Submitted By</StyledTableHeadCell>
        <StyledTableHeadCell align="center">Status</StyledTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
