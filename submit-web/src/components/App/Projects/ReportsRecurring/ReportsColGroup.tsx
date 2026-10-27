import { REPORTS_COLUMNS } from "./reportsColumns";

/**
 * Shared <colgroup> for the reports table. Rendering the same column widths in
 * every group (both the headed "All Phases" table and the headless collapsed
 * groups) guarantees the header row and every body row resolve to identical
 * column widths, so cells line up across groups and the header sits above the
 * correct column.
 */
export const ReportsColGroup = () => (
  <colgroup>
    {REPORTS_COLUMNS.map((column) => (
      <col key={column.key} style={{ width: column.width }} />
    ))}
  </colgroup>
);

export default ReportsColGroup;