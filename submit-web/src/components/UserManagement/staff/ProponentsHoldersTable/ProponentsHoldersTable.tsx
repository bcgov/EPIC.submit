import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { TablePaginationFooter } from "@/components/Shared/Table/TablePaginationFooter";
import { useGetAllProponents } from "@/hooks/api/useProponents";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableProps,
  TableRow,
} from "@mui/material";
import TableSortLabel from "@mui/material/TableSortLabel";
import { useEffect, useMemo, useState } from "react";
import { Proponent } from "@/models/Proponent";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ProponentsHoldersTableBody } from "./ProponentsHoldersTableBody";
import { useProponentsHoldersTable } from "./proponentsHoldersTableStore";

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGE = 0;
const RADIX = 10;

function compareByName(a: Proponent, b: Proponent, order: "asc" | "desc") {
  const aName = a?.name || "";
  const bName = b?.name || "";
  const result = aName.localeCompare(bName, undefined, { sensitivity: "base" });
  return order === "asc" ? result : -result;
}

export const ProponentsHoldersTable = (props: TableProps) => {
  const { searchText, sortOrder, toggleSortOrder } = useProponentsHoldersTable();
  const { data, isPending, isError } = useGetAllProponents();
  const [proponents, setProponents] = useState<Proponent[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [searchText]);

  useEffect(() => {
    setProponents(data || []);
  }, [data]);

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching proponents");
    }
  }, [isError]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(Math.max(0, Math.floor(newPage)));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = typeof event.target.value === "string"
      ? Number.parseInt(event.target.value, RADIX)
      : event.target.value;
    if (!Number.isNaN(value) && value > 0) {
      setRowsPerPage(value);
      setPage(DEFAULT_PAGE);
    }
  };

  const filteredProponents = useMemo(() => {
    if (!searchText.trim()) {
      return proponents;
    }
    const normalizedSearch = searchText.trim().toLowerCase().replace(/\s+/g, " ");
    return proponents.filter((proponent) =>
      proponent?.name?.toLowerCase().includes(normalizedSearch),
    );
  }, [proponents, searchText]);

  const sortedProponents = useMemo(
    () => [...filteredProponents].sort((a, b) => compareByName(a, b, sortOrder)),
    [filteredProponents, sortOrder],
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedProponents.length / rowsPerPage));
    if (sortedProponents.length > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [sortedProponents.length, rowsPerPage, page]);

  const paginatedProponents = useMemo(() => {
    if (sortedProponents.length === 0) {
      return [];
    }
    const validPage = Math.max(0, Math.floor(page));
    const startIndex = validPage * rowsPerPage;
    const endIndex = Math.min(sortedProponents.length, startIndex + rowsPerPage);
    if (startIndex >= sortedProponents.length) {
      return [];
    }
    return sortedProponents.slice(startIndex, endIndex).slice(0, rowsPerPage);
  }, [sortedProponents, page, rowsPerPage]);

  return (
    <Box>
      <TableContainer>
        <Table {...props}>
          <TableHead>
            <TableRow>
              <SubmitTableHeadCell>
                <TableSortLabel
                  active={false}
                  direction={sortOrder}
                  onClick={toggleSortOrder}
                  hideSortIcon
                >
                  Entities
                </TableSortLabel>
              </SubmitTableHeadCell>
              <SubmitTableHeadCell>Status</SubmitTableHeadCell>
              <SubmitTableHeadCell>Actions</SubmitTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody key={`table-body-${page}-${rowsPerPage}`}>
            <ProponentsHoldersTableBody
              proponents={paginatedProponents}
              isError={isError}
              isLoading={isPending}
              rowsPerPage={rowsPerPage}
            />
          </TableBody>
        </Table>
      </TableContainer>
      <TablePaginationFooter
        count={sortedProponents.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25]}
      />
    </Box>
  );
};
