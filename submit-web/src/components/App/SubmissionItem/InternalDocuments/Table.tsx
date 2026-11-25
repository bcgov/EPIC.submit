import {
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import Rows from "./Rows";

type TableProps = Readonly<{
  hideManageDocuments?: boolean;
}>;
export default function Table({ hideManageDocuments = false }: TableProps) {
  return (
    <TableContainer
      sx={{ height: "100%", cursor: "pointer", overflow: "visible" }}
    >
      <MuiTable sx={{ tableLayout: "fixed" }}>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
            },
          }}
        >
          <TableRow>
            <SubmitTableHeadCell sx={{ width: "60%" }}>
              Form/Document
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="left" sx={{ width: "30%" }}>
              Uploaded by
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="right" sx={{ width: "10%" }}>
              Actions
            </SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <Rows hideManageDocuments={hideManageDocuments} />
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
