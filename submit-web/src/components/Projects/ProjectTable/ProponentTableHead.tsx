import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

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
        <SubmitTableHeadCell>Submission Name</SubmitTableHeadCell>
        <SubmitTableHeadCell align="right">Date Submitted</SubmitTableHeadCell>
        <SubmitTableHeadCell align="right">Submitted By</SubmitTableHeadCell>
        <SubmitTableHeadCell align="center">Status</SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
