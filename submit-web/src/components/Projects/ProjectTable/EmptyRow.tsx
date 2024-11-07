import { TableCell, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function EmptyRow() {
  return (
    <TableRow key={`empty-row`} sx={{ py: 1 }}>
      <TableCell
        component="th"
        scope="row"
        colSpan={4}
        sx={{
          border: 0,
          py: BCDesignTokens.layoutPaddingXsmall,
        }}
      />
    </TableRow>
  );
}
