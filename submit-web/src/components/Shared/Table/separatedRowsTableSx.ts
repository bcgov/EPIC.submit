const ROW_GAP = "8px";

/**
 * Table with card-style rows separated by a gap. border-spacing also puts the
 * gap under the header row, so the header is shifted down into it to sit as
 * close to the first row as on plain tables.
 */
export const separatedRowsTableSx = {
  borderCollapse: "separate",
  borderSpacing: `0 ${ROW_GAP}`,
  "& > thead > tr > th": { position: "relative", top: ROW_GAP },
} as const;
