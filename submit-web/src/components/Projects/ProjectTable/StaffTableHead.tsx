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
        {/* Submission Name - Wider */}
        <StyledTableHeadCell
          sx={{
            minWidth: "250px", // Match the body width
            flexGrow: 1, // Align with the table body
          }}
        >
          Submission Name
        </StyledTableHeadCell>

        {/* Type - Narrow */}
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px", // Match the body width
          }}
        >
          Type
        </StyledTableHeadCell>

        {/* Submitted On - Narrow */}
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          Submitted On
        </StyledTableHeadCell>

        {/* Days Since Submission - Wrap on Two Lines */}
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "80px", // Match the body logic
            lineHeight: 1.2,
            wordWrap: "break-word",
            textAlign: "right",
          }}
        >
          Days since submission
        </StyledTableHeadCell>

        {/* CC Completed On - Narrow */}
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          CC Completed On
        </StyledTableHeadCell>

        {/* MP Review - Narrow */}
        <StyledTableHeadCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          MP Review
        </StyledTableHeadCell>

        {/* Status - Match Badge Width */}
        <StyledTableHeadCell
          align="center"
          sx={{
            maxWidth: "120px", // Match longest badge width
          }}
        >
          Status
        </StyledTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
