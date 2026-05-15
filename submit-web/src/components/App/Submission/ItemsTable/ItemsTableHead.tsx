import { TableHead, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";

export default function ItemsTableHead() {
  return (
    <TableHead
      sx={{
        ".MuiTableCell-root": {
          p: BCDesignTokens.layoutPaddingXsmall,
        },
      }}
    >
      <TableRow>
        <SubmitTableHeadCell width={"45%"}>
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
        <SubmitTableHeadCell width={"10%"} align="left">
          Uploaded by
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"10%"} align="right">
          Version
        </SubmitTableHeadCell>
        <SubmitTableHeadCell width={"18%"} align="center">
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          width="17%"
          align="right"
          sx={{
            paddingRight: "2% !important",
          }}
        >
          Actions
        </SubmitTableHeadCell>
      </TableRow>
    </TableHead>
  );
}
