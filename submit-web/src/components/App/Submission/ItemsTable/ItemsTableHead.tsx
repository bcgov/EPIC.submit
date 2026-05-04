import { TableHead, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { PackageType, SubmissionPackageType } from "@/models/Package";

export default function ItemsTableHead({
  packageType,
}: {
  packageType?: PackageType;
}) {
  const isIPD = packageType?.name === SubmissionPackageType.IPD;
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
        <SubmitTableHeadCell width={"15%"} align="center">
          Status
        </SubmitTableHeadCell>
        <SubmitTableHeadCell
          width={isIPD ? "30%" : "20%"}
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
