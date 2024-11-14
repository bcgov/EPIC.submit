import { TableCell, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type EmptyRowProps = {
  colSpan: number;
};
export default function EmptyRow({ colSpan = 4 }: EmptyRowProps) {
  return (
    <TableRow key={`empty-row`} sx={{ py: 1 }}>
      <TableCell
        component="th"
        scope="row"
        colSpan={colSpan}
        sx={{
          border: 0,
          py: BCDesignTokens.layoutPaddingXsmall,
        }}
      />
    </TableRow>
  );
}
