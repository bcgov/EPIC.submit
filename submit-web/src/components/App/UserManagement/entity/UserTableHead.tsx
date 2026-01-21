import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function UserTableHead() {
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
            width: "10%",
          }}
        >
          Email
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "25%",
          }}
        >
          Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "30%",
          }}
        >
          Access
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "10%",
          }}
        >
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "25%",
          }}
        >
          Actions
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
