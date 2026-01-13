import { SubmitTableHeadCell, PlainTableCell } from "@/components/Shared/Table/common";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableProps,
  TableRow,
  LinearProgress,
} from "@mui/material";
import TableSortLabel from "@mui/material/TableSortLabel";
import { useEffect, useMemo, useState, ReactNode, useCallback } from "react";

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
  rowsPerPageOptions?: readonly number[];
  tableProps?: TableProps;
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
  rowsPerPageOptions = [10, 25],
  tableProps,
}: DataTableProps<T>) {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [data.length]);


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

  const sortedData = useMemo(() => {
    if (!sortKey || !sortable) {
      return data;
    }

    const column = columns.find((col) => col.id === sortKey);
    if (!column?.getValue) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = column.getValue?.(a) ?? "";
      const bValue = column.getValue?.(b) ?? "";
      return String(aValue).localeCompare(String(bValue), undefined, {
        sensitivity: "base",
      });
    });

    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [data, sortKey, sortOrder, columns, sortable]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
    if (sortedData.length > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [sortedData.length, rowsPerPage, page]);

  const paginatedData = useMemo(() => {
    if (sortedData.length === 0) {
      return [];
    }

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, rowsPerPage]);

  const emptyRows = Math.max(0, rowsPerPage - paginatedData.length);

  return (
    <Box>
      <TableContainer>
        <Table
          {...tableProps}
          sx={{ tableLayout: "fixed", ...tableProps?.sx }}
        >
          <TableHead>
            <TableRow>
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
                <TableCell colSpan={columns.length} align="center">
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}

            {isLoading && !isError && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      border: "none",
                    }}
                    align="center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              </>
            )}

            {!isLoading && !isError && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              paginatedData.map((row) => (
                <TableRow key={getRowId(row)}>
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
              ))}

            {!isLoading && !isError && emptyRows > 0 && (
              <TableRow style={{ height: ROW_HEIGHT * emptyRows }}>
                <TableCell colSpan={columns.length} sx={{ border: "none" }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedData.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Box>
  );
}

