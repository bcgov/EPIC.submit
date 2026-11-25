import { TableHead, TableRow } from "@mui/material";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { REPORTS_COLUMNS } from "./reportsColumns";

/**
 * Column header row for the reports table. Column widths come from the shared
 * <colgroup> (not per-cell widths) so the header lines up with every body row.
 */
export const ReportsTableHead = () => {
  return (
    <TableHead>
      <TableRow>
        {REPORTS_COLUMNS.map((column) => (
          <SubmitTableHeadCell
            key={column.key}
            sx={{ whiteSpace: "nowrap" }}
            align={column.key === "status" ? "right" : "left"}
          >
            {column.label}
          </SubmitTableHeadCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default ReportsTableHead;
