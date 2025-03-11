import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function StaffTableHead() {
  return (
    <TableHead
      sx={{
        border: 0,
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
          lineHeight: 1.2,
        },
      }}
    >
      <TableRow>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "40%",
          }}
        >
          Submission Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "8%",
          }}
        >
          Type
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "9%",
          }}
        >
          Submitted On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "9%",
            lineHeight: 1.2,
            wordWrap: "break-word",
          }}
        >
          Days since submission
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "10%",
          }}
        >
          CC Completed On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "9%",
          }}
        >
          MP Review
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
