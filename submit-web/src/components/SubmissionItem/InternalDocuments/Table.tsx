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
            <SubmitTableHeadCell align="right" sx={{ width: "30%" }}>
              Uploaded by
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="center" sx={{ width: "10%" }}>
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
