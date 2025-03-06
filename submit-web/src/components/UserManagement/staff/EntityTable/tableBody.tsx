import { PlainTableCell } from "@/components/Shared/Table/common";
import { Proponent } from "@/models/Proponent";
import { TableCell, Link as MuiLink, TableRow } from "@mui/material";

type EntityTableBodyProps = {
  isLoading: boolean;
  isError: boolean;
  proponents: Proponent[];
};
export const EntityTableBody = ({
  proponents,
  isError,
  isLoading,
}: EntityTableBodyProps) => {
  const emptyRows = 6 - Math.min(6, proponents.length);

  const onEntityClick = (entityId: number) => {
    console.log("Entity clicked", entityId);
  };

  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={3}>Error fetching proponents</TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={3}>Loading proponents...</TableCell>
      </TableRow>
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
          <PlainTableCell></PlainTableCell>
          <PlainTableCell></PlainTableCell>
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
