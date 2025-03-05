import {
  PlainTableCell,
  SubmitTableCell,
  SubmitTableHeadCell,
} from "@/components/Shared/Table/common";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Link as MuiLink,
  TableProps,
  TableRow,
  TablePagination,
} from "@mui/material";

export const EntityTable = (props: TableProps) => {
  const mockEntities = [
    {
      name: "Entity 1",
      id: 1,
      onboardedTotalProjects: "0/1",
      status: "Active",
      actions: "action",
    },
    {
      name: "Entity 2",
      id: 2,
      onboardedTotalProjects: "0/1",
      status: "Active",
      actions: "action",
    },
    {
      name: "Entity 3",
      id: 3,
      onboardedTotalProjects: "0/1",
      status: "Active",
      actions: "action",
    },
    {
      name: "Entity 4",
      id: 4,
      onboardedTotalProjects: "0/1",
      status: "Active",
      actions: "action",
    },
  ];

  const emptyRows = 6 - Math.min(6, mockEntities.length);

  const onEntityClick = (entityId: number) => {
    console.log("Entity clicked", entityId);
  };
  return (
    <Box>
      <TableContainer>
        <Table {...props}>
          <TableHead>
            <TableRow>
              <SubmitTableHeadCell>Entity</SubmitTableHeadCell>

              <SubmitTableHeadCell>Status</SubmitTableHeadCell>
              <SubmitTableHeadCell>Action</SubmitTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockEntities.map((entity) => (
              <TableRow key={entity.id}>
                <PlainTableCell>
                  <MuiLink
                    sx={{
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      "&:hover": {
                        textDecoration: "underline",
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => onEntityClick(entity.id)}
                  >
                    {entity.name}
                  </MuiLink>
                </PlainTableCell>
                <PlainTableCell>{entity.status}</PlainTableCell>
                <PlainTableCell>{entity.actions}</PlainTableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 38 * emptyRows,
                }}
              >
                <TableCell colSpan={3} sx={{ border: "none" }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={mockEntities.length}
        rowsPerPage={10}
        page={1}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />
    </Box>
  );
};
