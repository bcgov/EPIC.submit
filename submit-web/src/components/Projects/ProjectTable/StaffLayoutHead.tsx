import { TableHead, TableRow } from "@mui/material";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function StaffLayoutHead() {
  return (
    <TableHead>
      <TableRow>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "39%",
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
            width: "8%",
            lineHeight: 1.2,
            wordWrap: "break-word",
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
            width: "8%",
          }}
        ></SubmitTableHeadCell>
        <SubmitTableHeadCell
          align="left"
          sx={{
            width: "20%",
          }}
        ></SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
