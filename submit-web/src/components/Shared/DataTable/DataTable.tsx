import { OutlinedCheckbox } from "@/components/Shared/Icons/OutlinedCheckbox";
import { PlainCheckboxTableCell, PlainTableCell, SubmitCheckboxTableHeadCell, SubmitTableHeadCell } from "@/components/Shared/Table/common";
import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableProps,
  TableRow,
} from "@mui/material";
import TableSortLabel from "@mui/material/TableSortLabel";
import { BCDesignTokens } from "epic.theme";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGE = 0;
const ROW_HEIGHT = 38;

export type Column<T> = {
  id: string;
  label: string;
  width?: string;
  sortable?: boolean;
  renderCell?: (row: T) => ReactNode;
  getValue?: (row: T) => string | number | null | undefined;
};

export type DataTableProps<T> = Readonly<{
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  getRowId: (row: T) => string | number;
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
  onSortChange?: (sortKey: string, sortOrder: "asc" | "desc") => void;
  paginated?: boolean;
  rowsPerPageOptions?: readonly number[];
  tableProps?: TableProps;
  selectable?: boolean;
  selected?: (string | number)[];
  onSelectionChange?: (selected: (string | number)[]) => void;
  successfulRows?: (string | number)[];
}>;

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = "Error loading data",
  emptyMessage = "No data found",
  getRowId,
  sortable = true,
  defaultSortKey,
  defaultSortOrder = "asc",
  onSortChange,
  paginated = true,
  rowsPerPageOptions = [10, 25],
  tableProps,
  selectable = false,
  selected = [],
  onSelectionChange,
  successfulRows = [],
}: DataTableProps<T>) {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortable) return data;

    const column = columns.find((col) => col.id === sortKey);
    if (!column?.getValue) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = column.getValue?.(a) ?? "";
      const bValue = column.getValue?.(b) ?? "";
      return String(aValue).localeCompare(String(bValue), undefined, {
        sensitivity: "base",
      });
    });

    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [data, sortKey, sortOrder, columns, sortable]);

  const handleSort = useCallback(
    (columnId: string) => {
      if (!sortable) return;

      const newSortOrder =
        sortKey === columnId && sortOrder === "asc" ? "desc" : "asc";
      setSortKey(columnId);
      setSortOrder(newSortOrder);
      onSortChange?.(columnId, newSortOrder);
    },
    [sortable, sortKey, sortOrder, onSortChange],
  );

  // Pagination
  const paginatedData = useMemo(() => {
    if (sortedData.length === 0) return [];
    if (!paginated) return sortedData

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, rowsPerPage, paginated]);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      if (!Number.isNaN(value) && value > 0) {
        setRowsPerPage(value);
        setPage(DEFAULT_PAGE);
      }
    },
    [],
  );

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(Math.max(0, Math.floor(newPage)));
  }, []);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [data.length]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
    if (sortedData.length > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [sortedData.length, rowsPerPage, page]);

  // Successful Rows
  const isSuccessful = useCallback(
    (rowId: string | number) => successfulRows.indexOf(rowId) !== -1,
    [successfulRows],
  );

  // Row Selection
  const isSelected = useCallback(
    (rowId: string | number) => selected.indexOf(rowId) !== -1,
    [selected],
  );

  const handleSelectAllClick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        const newSelected = sortedData
          .map((row) => getRowId(row))
          .filter((rowId) => !isSuccessful(rowId));
        onSelectionChange?.(newSelected);
      } else {
        onSelectionChange?.([]);
      }
    },
    [sortedData, getRowId, onSelectionChange, isSuccessful],
  );

  const handleRowClick = useCallback(
    (rowId: string | number) => {
      if (isSuccessful(rowId)) return;

      const selectedIndex = selected.indexOf(rowId);
      let newSelected: (string | number)[] = [];

      if (selectedIndex === -1) {
        newSelected = [...selected, rowId];
      } else {
        newSelected = selected.filter((id) => id !== rowId);
      }

      onSelectionChange?.(newSelected);
    },
    [selected, onSelectionChange, isSuccessful],
  );

  const emptyRows = Math.max(0, rowsPerPage - paginatedData.length);
  const numSelected = selected.filter((id) => !isSuccessful(id)).length;
  const selectableRowCount = sortedData.filter((row) => !isSuccessful(getRowId(row))).length;

  return (
    <Box>
      <TableContainer>
        <Table
          {...tableProps}
          sx={{ tableLayout: "fixed", ...tableProps?.sx }}
        >
          <TableHead>
            <TableRow>
              {selectable && (
                <SubmitCheckboxTableHeadCell padding="checkbox">
                  <OutlinedCheckbox
                    indeterminate={numSelected > 0 && numSelected < selectableRowCount}
                    checked={selectableRowCount > 0 && numSelected === selectableRowCount}
                    onChange={handleSelectAllClick}
                    inputProps={{
                      "aria-label": "select all",
                    }}
                  />
                </SubmitCheckboxTableHeadCell>
              )}
              {columns.map((column) => (
                <SubmitTableHeadCell
                  key={column.id}
                  sx={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable !== false && sortable ? (
                    <TableSortLabel
                      active={sortKey === column.id}
                      direction={sortKey === column.id ? sortOrder : "asc"}
                      onClick={() => handleSort(column.id)}
                      hideSortIcon={sortKey !== column.id}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    <>{column.label}</>
                  )}
                </SubmitTableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody key={`table-body-${page}-${rowsPerPage}`}>
            {isError && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}

            {isLoading && !isError && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    sx={{
                      border: "none",
                    }}
                    align="center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              </>
            )}

            {!isLoading && !isError && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              paginatedData.map((row) => {
                const rowId = getRowId(row);
                const isItemSelected = isSelected(rowId);
                const isItemSuccessful = isSuccessful(rowId);

                return (
                  <TableRow
                    key={rowId}
                    hover={selectable && !isItemSuccessful}
                    onClick={() => selectable && handleRowClick(rowId)}
                    role={selectable ? "checkbox" : undefined}
                    aria-checked={selectable ? isItemSuccessful : undefined}
                    selected={isItemSuccessful}
                    sx={{ 
                      cursor: selectable && !isItemSuccessful ? "pointer" : "default",
                      "&.Mui-selected": {
                        backgroundColor: isItemSuccessful ? BCDesignTokens.supportSurfaceColorSuccess : "transparent",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: isItemSuccessful ? BCDesignTokens.supportSurfaceColorSuccess : "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    {selectable && (
                      <PlainCheckboxTableCell>
                        <OutlinedCheckbox
                          checked={isItemSelected || isItemSuccessful}
                          isItemSuccessful={isItemSuccessful}
                          inputProps={{
                            "aria-labelledby": `checkbox-${rowId}`,
                          }}
                        />
                      </PlainCheckboxTableCell>
                    )}
                    {columns.map((column) => {
                      const cellContent =
                        column.renderCell?.(row) ?? column.getValue?.(row) ?? null;
                      return (
                        <PlainTableCell key={column.id}>
                          {cellContent}
                        </PlainTableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

            {paginated && !isLoading && !isError && emptyRows > 0 && (
              <TableRow style={{ height: ROW_HEIGHT * emptyRows }}>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} sx={{ border: "none" }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Box>
  );
}
