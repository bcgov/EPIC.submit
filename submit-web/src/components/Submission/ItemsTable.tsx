import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import SubmissionItemTableRow from "./SubmissionItemTableRow";
import { SubmitTableHeadCell } from "../Shared/Table/common";
import { usePackageTableStore } from "./packageTableStore";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import InternalDocumentsRows from "../SubmissionItem/InternalDocuments/Rows";
import { SubmissionPackage } from "@/models/Package";
import { isSubmissionItemReadyToSubmit } from "./utils";

type ItemsTableProps = Readonly<{
  submissionPackage: SubmissionPackage;
}>;
export default function ItemsTable({ submissionPackage }: ItemsTableProps) {
  const { items: submissionItems } = submissionPackage;

  const { userType } = useAccount();

  const { isValidating } = usePackageTableStore();

  const internalStaffDocuments = submissionItems.flatMap(
    (item) => item.internal_staff_documents ?? [],
  );

  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table sx={{ tableLayout: "fixed" }}>
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
            <SubmitTableHeadCell align="center">Status</SubmitTableHeadCell>
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissionItems?.map((subItem) => (
            <SubmissionItemTableRow
              key={`custom-row-${subItem.type.name}`}
              item={subItem}
              error={
                isValidating &&
                !isSubmissionItemReadyToSubmit({
                  submissionItem: subItem,
                  submissionPackage: submissionPackage,
                })
              }
            />
          ))}
          <When condition={userType === USER_TYPE.STAFF}>
            <InternalDocumentsRows
              internalStaffDocuments={internalStaffDocuments}
              numColumns={5}
            />
          </When>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
