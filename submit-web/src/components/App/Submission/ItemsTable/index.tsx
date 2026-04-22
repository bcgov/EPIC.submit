import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import { SubmissionPackage } from "@/models/Package";
import { useFileStore } from "@/store/fileStore";
import { useEffect } from "react";
import SubmissionItemTableRow from "@/components/App/Submission/SubmissionItemTableRow";
import { isSubmissionItemReadyToSubmit } from "@/components/App/Submission/utils";
import InternalDocumentsRows from "@/components/App/SubmissionItem/InternalDocuments/Rows";
import { usePackageTableStore } from "@/components/App/Submission/packageTableStore";
import ItemsTableHead from "@/components/App/Submission/ItemsTable/ItemsTableHead";

type ItemsTableProps = Readonly<{
  submissionPackage: SubmissionPackage;
  onRequestUpdate?: (itemTypeId: number, itemTypeName: string) => void;
  pendingRequestItemTypeIds?: number[];
  sentRequestItemTypeIds?: number[];
}>;
export default function ItemsTable({ 
  submissionPackage, 
  onRequestUpdate,
  pendingRequestItemTypeIds = [],
  sentRequestItemTypeIds = [],
}: ItemsTableProps) {
  const { initializeFiles } = useFileStore();
  const { items: submissionItems, type: packageType } = submissionPackage;

  const { userType } = useAccount();

  const { isValidating } = usePackageTableStore();

  useEffect(() => {
    initializeFiles(submissionPackage.internal_staff_documents || []);
  }, [submissionPackage.internal_staff_documents, initializeFiles]);

  return (
    <TableContainer component={Box} sx={{ height: "100%", overflow: "hidden" }}>
      <Table sx={{ tableLayout: "fixed" }}>
        <ItemsTableHead packageType={packageType} />
        <TableBody>
          {submissionItems?.map((subItem) => (
            <SubmissionItemTableRow
              key={`custom-row-${subItem.type.name}`}
              item={subItem}
              packageType={packageType}
              error={
                isValidating &&
                !isSubmissionItemReadyToSubmit({
                  submissionItem: subItem,
                  submissionPackage: submissionPackage,
                })
              }
              onRequestUpdate={onRequestUpdate}
              hasPendingRequest={pendingRequestItemTypeIds.includes(subItem.type_id)}
              hasSentRequest={sentRequestItemTypeIds.includes(subItem.type_id)}
            />
          ))}
          <When condition={userType === USER_TYPE.STAFF}>
            <InternalDocumentsRows layout="compact" />
          </When>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
