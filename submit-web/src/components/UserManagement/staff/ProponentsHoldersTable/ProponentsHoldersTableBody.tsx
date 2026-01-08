import { PlainTableCell } from "@/components/Shared/Table/common";
import { Proponent } from "@/models/Proponent";
import {
  TableCell,
  Link as MuiLink,
  TableRow,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

type ProponentsHoldersTableBodyProps = {
  isLoading: boolean;
  isError: boolean;
  proponents: Proponent[];
  rowsPerPage: number;
};

export const ProponentsHoldersTableBody = ({
  proponents,
  isError,
  isLoading,
  rowsPerPage,
}: ProponentsHoldersTableBodyProps) => {
  const navigate = useNavigate();
  const emptyRows = Math.max(0, rowsPerPage - proponents.length);

  const handleViewProponent = (id: number) => {
    navigate({
      to: `/staff/invitations/entities/${id}`,
    });
  };

  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={3} align="center">
          Error fetching proponents
        </TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return (
      <>
        <TableRow>
          <TableCell
            colSpan={3}
            sx={{
              border: "none",
            }}
            align="center"
          >
            Loading proponents...
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={3}>
            <LinearProgress />
          </TableCell>
        </TableRow>
      </>
    );
  }

  if (proponents.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={3}>No proponents found</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {proponents.map((entity) => (
        <TableRow key={entity.id}>
          <PlainTableCell>{entity.name}</PlainTableCell>
          <PlainTableCell />
          <PlainTableCell>
            <MuiLink
              component="button"
              sx={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                "&:hover": {
                  textDecoration: "underline",
                  cursor: "pointer",
                },
              }}
              onClick={() => handleViewProponent(entity.id)}
            >
              View Proponent Information
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
          <TableCell colSpan={3} sx={{ border: "none" }} />
        </TableRow>
      )}
    </>
  );
};

