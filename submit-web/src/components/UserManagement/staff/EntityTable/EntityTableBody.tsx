import { PlainTableCell } from "@/components/Shared/Table/common";
import { Proponent } from "@/models/Proponent";
import {
  TableCell,
  Link as MuiLink,
  TableRow,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

type EntityTableBodyProps = {
  isLoading: boolean;
  isError: boolean;
  proponents: Proponent[];
  rowsPerPage: number;
};
export const EntityTableBody = ({
  proponents,
  isError,
  isLoading,
  rowsPerPage,
}: EntityTableBodyProps) => {
  const navigate = useNavigate();
  const emptyRows = rowsPerPage - proponents.length;

  const handleRowClick = (id: number) => {
    navigate({
      to: `/staff/proponents/${id}`,
    });
  };

  if (isError) {
    return (
      <TableRow>
        <TableCell align="center">Error fetching proponents</TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return (
      <>
        <TableRow>
          <TableCell
            sx={{
              border: "none",
            }}
            align="center"
          >
            Loading proponents...
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <LinearProgress />
          </TableCell>
        </TableRow>
      </>
    );
  }

  if (proponents.length === 0) {
    return (
      <TableRow>
        <TableCell>No proponents found</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {proponents.map((entity) => (
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
              onClick={() => handleRowClick(entity.id)}
            >
              {entity.name}
            </MuiLink>
          </PlainTableCell>
        </TableRow>
      ))}
      {emptyRows > 0 && (
        <TableRow
          style={{
            height: 38 * emptyRows,
          }}
        >
          <TableCell sx={{ border: "none" }} />
        </TableRow>
      )}
    </>
  );
};
