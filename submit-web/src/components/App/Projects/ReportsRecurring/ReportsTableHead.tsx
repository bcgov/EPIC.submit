import { TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { REPORTS_COLUMNS } from "./reportsColumns";

/**
 * Column header row for the reports table. Hidden visually in collapsed groups
 * is handled by the caller; widths come from the shared column definition so
 * every group lines up.
 */
export const ReportsTableHead = () => {
  return (
    <TableHead>
      <TableRow>
        {REPORTS_COLUMNS.map((column) => (
          <TableCell
            key={column.key}
            sx={{ width: column.width, border: "none", py: 0.5 }}
            align={column.key === "status" ? "right" : "left"}
          >
            <Typography
              variant="body2"
              color={BCDesignTokens.typographyColorPlaceholder}
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
