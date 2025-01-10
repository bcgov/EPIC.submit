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
        },
      }}
    >
      <TableRow>
        <SubmitTableHeadCell
          sx={{
            minWidth: "250px",
            flexGrow: 1,
          }}
        >
          Submission Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          Type
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          Submitted On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="right"
          sx={{
            maxWidth: "80px",
            lineHeight: 1.2,
            wordWrap: "break-word",
            textAlign: "right",
          }}
        >
          Days since submission
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          CC Completed On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          MP Review
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="center">Status</SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
