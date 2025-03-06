import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { useProponents } from "@/hooks/api/useProponents";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableProps,
  TableRow,
  TablePagination,
} from "@mui/material";
import { EntityTableBody } from "./tableBody";
import { useEffect, useMemo, useState } from "react";
import { Proponent } from "@/models/Proponent";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_PAGE = 0;
const RADIX = 10;
export const EntityTable = (props: TableProps) => {
  const { data, isPending, isError } = useProponents();
  const [proponents, setProponents] = useState<Proponent[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    setProponents(data || []);
  }, [data]);

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching proponents");
    }
  }, [isError]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, RADIX));
    setPage(DEFAULT_PAGE);
  };

  const paginatedProponents = useMemo(
    () =>
      proponents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [proponents, page, rowsPerPage],
  );

  return (
    <Box>
      <TableContainer>
        <Table {...props}>
          <TableHead>
            <TableRow>
              <SubmitTableHeadCell>Entity</SubmitTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <EntityTableBody
              proponents={paginatedProponents}
              isError={isError}
              isLoading={isPending}
              rowsPerPage={rowsPerPage}
            />
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={proponents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
