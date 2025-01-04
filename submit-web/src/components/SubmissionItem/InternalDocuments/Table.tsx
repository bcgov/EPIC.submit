import {
  Table as MuiTable,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { InternalStaffDocument } from "@/models/SubmissionItem";

import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import Rows from "./Rows";

export default function Table({
  internalStaffDocuments,
}: {
  internalStaffDocuments: Array<InternalStaffDocument>;
}) {
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
            <SubmitTableHeadCell align="right">Version</SubmitTableHeadCell>
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <Rows
            internalStaffDocuments={internalStaffDocuments}
            numColumns={4}
          />
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
