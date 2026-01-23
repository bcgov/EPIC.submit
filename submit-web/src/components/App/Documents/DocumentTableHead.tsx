import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function DocumentTableHead() {
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
            width: "20%",
          }}
        >
          Project
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "45%",
          }}
        >
          Document Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "5%",
          }}
        >
          Version
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "10%",
          }}
        >
          Submission Date
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="center"
          sx={{
            width: "15%",
          }}
        >
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "5%",
          }}
        >
          Actions
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
