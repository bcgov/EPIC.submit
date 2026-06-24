import { TableHead, TableRow } from "@mui/material";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

type StaffTableHeadProps = {
  isManagementPlan?: boolean;
};

export default function StaffTableHead({ isManagementPlan }: StaffTableHeadProps) {
  if (!isManagementPlan) {
    return (
      <TableHead
        sx={{
          border: 0,
          ".MuiTableCell-root": { lineHeight: 1.2 },
        }}
      >
        <TableRow>
          <SubmitTableHeadCell align="left" sx={{ width: "40%" }}>
            Submission Name
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="left" sx={{ width: "15%" }}>
            Submitted On
          </SubmitTableHeadCell>
          <SubmitTableHeadCell
            align="left"
            sx={{ width: "15%", lineHeight: 1.2, wordWrap: "break-word" }}
          >
            Days since submission
          </SubmitTableHeadCell>
          <SubmitTableHeadCell align="right" sx={{ width: "30%" }}>
            Status
          </SubmitTableHeadCell>
        </TableRow>
      </TableHead>
    );
  }

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
        <SubmitTableHeadCell align="left" sx={{ width: "9%" }}>
          Submitted On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{ width: "9%", lineHeight: 1.2, wordWrap: "break-word" }}
        >
          Days since submission
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="left" sx={{ width: "10%" }}>
          CC Completed On
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="left" sx={{ width: "9%" }}>
          MP Review
        </SubmitTableHeadCell>
        <SubmitTableHeadCell align="right" sx={{ width: "15%" }}>
          Status
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
