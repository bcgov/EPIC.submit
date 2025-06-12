import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import { SubmissionPackage } from "@/models/Package";
import { useFileStore } from "@/store/fileStore";
import { useEffect } from "react";
import SubmissionItemTableRow from "../SubmissionItemTableRow";
import { isSubmissionItemReadyToSubmit } from "../utils";
import InternalDocumentsRows from "../../SubmissionItem/InternalDocuments/Rows";
import { usePackageTableStore } from "../packageTableStore";
import ItemsTableHead from "./ItemsTableHead";

type ItemsTableProps = Readonly<{
  submissionPackage: SubmissionPackage;
}>;
export default function ItemsTable({ submissionPackage }: ItemsTableProps) {
  const { initializeFiles } = useFileStore();
  const { items: submissionItems } = submissionPackage;

  const { userType } = useAccount();

  const { isValidating } = usePackageTableStore();

  useEffect(() => {
    initializeFiles(submissionPackage.internal_staff_documents || []);
  }, [submissionPackage.internal_staff_documents, initializeFiles]);

  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table sx={{ tableLayout: "fixed" }}>
        <ItemsTableHead />
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
            <InternalDocumentsRows isItemsTable />
          </When>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
