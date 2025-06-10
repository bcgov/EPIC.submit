import {
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import Rows from "./Rows";

type TableProps = Readonly<{
  hideManageDocuments?: boolean;
}>;
export default function Table({ hideManageDocuments = false }: TableProps) {
  return (
    <TableContainer sx={{ height: "100%", cursor: "pointer" }}>
      <MuiTable>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
            },
          }}
        >
          <TableRow>
            <SubmitTableHeadCell>
              <Typography
                variant="body2"
                sx={{
                  color: BCDesignTokens.themeGray70,
                  "&:hover": {
                    color: "#EDEBE9",
                  },
                }}
              >
                Form/Document
              </Typography>
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Uploaded by</SubmitTableHeadCell>
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <Rows numColumns={5} hideManageDocuments={hideManageDocuments} />
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
