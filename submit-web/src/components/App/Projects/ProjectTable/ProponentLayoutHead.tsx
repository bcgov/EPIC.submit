import { TableHead, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

type ProponentLayoutHeadProps = {
  isManagementPlan?: boolean;
};

export default function ProponentLayoutHead({ isManagementPlan }: ProponentLayoutHeadProps) {
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
          <SubmitTableHeadCell align="left" sx={{ width: "5%" }} />
        )}
        <SubmitTableHeadCell sx={{ width: isManagementPlan ? "50%" : "55%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }} />
      </TableRow>
    </TableHead>
  );
}
