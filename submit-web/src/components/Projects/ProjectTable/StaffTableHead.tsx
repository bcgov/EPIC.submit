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
        <StyledTableHeadCell
          sx={{
            minWidth: "250px",
            flexGrow: 1,
          }}
        >
          Submission Name
        </StyledTableHeadCell>
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          Type
        </StyledTableHeadCell>
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          Submitted On
        </StyledTableHeadCell>
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "80px",
            lineHeight: 1.2,
            wordWrap: "break-word",
            textAlign: "right",
          }}
        >
          Days since submission
        </StyledTableHeadCell>
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          CC Completed On
        </StyledTableHeadCell>
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          MP Review
        </StyledTableHeadCell>
        <StyledTableHeadCell align="center">Status</StyledTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
