import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { SubmissionPackage } from "@/models/Package";
import { ReportsTableHead } from "./ReportsTableHead";
import { ReportsTableRow } from "./ReportsTableRow";
import { REPORTS_TABLE_MIN_WIDTH_PX } from "./reportsColumns";
import { ReportsAudience } from "./reportStatus";

type ReportsTableProps = {
  reportPackages: SubmissionPackage[];
  headless?: boolean;
  audience?: ReportsAudience;
};

/**
 * Renders the six-column reports table for a single phase group. Column widths
 * are fixed so rows line up across groups, and the table scrolls horizontally
 * inside a narrow card (under ~760px) without scrolling the page sideways.
 */
export const ReportsTable = ({
  reportPackages,
  headless,
  audience = "proponent",
}: ReportsTableProps) => {
  return (
    <TableContainer component={Box} sx={{ height: "100%", overflowX: "auto" }}>
      <Table
        sx={{
          borderCollapse: "separate",
          borderSpacing: "0 8px",
          tableLayout: "fixed",
          minWidth: `${REPORTS_TABLE_MIN_WIDTH_PX}px`,
        }}
      >
        {!headless && <ReportsTableHead />}
        <TableBody>
          {reportPackages.map((reportPackage) => (
            <ReportsTableRow
              key={reportPackage.id}
              reportPackage={reportPackage}
              audience={audience}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportsTable;
