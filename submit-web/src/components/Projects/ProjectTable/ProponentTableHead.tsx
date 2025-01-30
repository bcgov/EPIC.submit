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
        <SubmitTableHeadCell
          sx={{
            width: "50%",
          }}
        >
          Submission Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "15%",
          }}
        >
          Date Submitted
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "15%",
          }}
        >
          Submitted By
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "15%",
          }}
        >
          Status
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
