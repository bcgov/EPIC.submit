import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

type ProponentTableHeadProps = {
  isManagementPlan?: boolean;
};

export default function ProponentTableHead({ isManagementPlan }: ProponentTableHeadProps) {
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
        {isManagementPlan && (
          <SubmitTableHeadCell align="left" sx={{ width: "5%" }}>
            Cond #
          </SubmitTableHeadCell>
        )}
        <SubmitTableHeadCell sx={{ width: isManagementPlan ? "50%" : "55%" }}>
          Submission Name
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }}>
          Date Submitted
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }}>
          Submitted By
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }}>
          Status
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
