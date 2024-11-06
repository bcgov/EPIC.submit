import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { StyledTableHeadCell } from "@/components/Shared/Table/common";

export default function StaffTableHead() {
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
        <StyledTableHeadCell align="right">Type</StyledTableHeadCell>
        <StyledTableHeadCell align="right">Submitted On</StyledTableHeadCell>
        <StyledTableHeadCell align="right">
          Days since submission
        </StyledTableHeadCell>
        <StyledTableHeadCell align="right">CC Completed On</StyledTableHeadCell>
        <StyledTableHeadCell align="right">MP Review</StyledTableHeadCell>
        <StyledTableHeadCell align="center">Status</StyledTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
