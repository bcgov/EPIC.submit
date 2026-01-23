import { TableHead, TableRow } from "@mui/material";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function StaffLayoutHead() {
  return (
    <TableHead>
      <TableRow>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "40%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "8%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "12%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "5%",
            lineHeight: 1.2,
            wordWrap: "break-word",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "10%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "10%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "15%",
          }}
        ></SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
