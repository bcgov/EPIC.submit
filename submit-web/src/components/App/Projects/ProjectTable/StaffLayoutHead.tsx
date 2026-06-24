import { TableHead, TableRow } from "@mui/material";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

type StaffLayoutHeadProps = {
  isManagementPlan?: boolean;
};

export default function StaffLayoutHead({ isManagementPlan }: StaffLayoutHeadProps) {
  if (isManagementPlan) {
    return (
      <TableHead
        sx={{
          border: 0,
          ".MuiTableCell-root": { lineHeight: 1.2 },
        }}
      >
        <TableRow>
          <SubmitTableHeadCell align="left" sx={{ width: "5%" }}>
            Cond #
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="left" sx={{ width: "35%" }}>
            Submission Name
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="left" sx={{ width: "8%" }}>
            Type
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="left" sx={{ width: "17%" }}>
            Submitted On
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="left" sx={{ width: "20%" }}>
            MP Completed On
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="right" sx={{ width: "15%" }}>
            Status
          </SubmitTableHeadCell>
        </TableRow>
      </TableHead>
    );
  }

  return (
    <TableHead>
      <TableRow>
        <SubmitTableHeadCell align="left" sx={{ width: "40%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "15%" }} />
        <SubmitTableHeadCell align="left" sx={{ width: "30%" }} />
      </TableRow>
    </TableHead>
  );
}
