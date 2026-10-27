import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
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
          <TableCell
            key={column.key}
            sx={{ border: "none", py: 0.5 }}
            align={column.key === "status" ? "right" : "left"}
          >
            <Typography
              variant="body2"
              color={BCDesignTokens.typographyColorPlaceholder}
              sx={{ whiteSpace: "nowrap" }}
            >
              {column.label}
            </Typography>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default ReportsTableHead;