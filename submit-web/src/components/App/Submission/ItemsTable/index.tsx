import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { useFileStore } from "@/store/fileStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useEffect } from "react";
import SubmissionItemTableRow from "@/components/App/Submission/SubmissionItemTableRow";
import { isSubmissionItemReadyToSubmit } from "@/components/App/Submission/utils";
import InternalDocumentsRows from "@/components/App/SubmissionItem/InternalDocuments/Rows";
import { usePackageTableStore } from "@/components/App/Submission/packageTableStore";
import ItemsTableHead from "@/components/App/Submission/ItemsTable/ItemsTableHead";
import { AccountProject } from "@/models/Project";

type ItemsTableProps = Readonly<{
  submissionPackage: SubmissionPackage;
  accountProject: AccountProject;
  onRequestUpdate?: (itemTypeId: number, itemTypeName: string) => void;
  pendingRequestItemTypeIds?: number[];
  sentRequestItemTypeIds?: number[];
}>;
export default function ItemsTable({
  submissionPackage,
  accountProject,
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

  const renderItems = (items: typeof submissionItems) =>
    items?.map((subItem) => (
      <SubmissionItemTableRow
        key={`custom-row-${subItem.type.name}`}
        item={subItem}
        packageType={packageType}
        error={
          isValidating &&
          (packageType.name === SubmissionPackageType.ADDITIONAL_INFORMATION
            ? submissionPackage.items.reduce((acc, item) => {
                const documentSubmissions = item.submissions.filter(
                  (s) => s.type === SUBMISSION_TYPE.DOCUMENT,
                );
                return acc + documentSubmissions.length;
              }, 0) === 0
            : !isSubmissionItemReadyToSubmit({
                submissionItem: subItem,
                submissionPackage: submissionPackage,
              }))
        }
        onRequestUpdate={onRequestUpdate}
        hasPendingRequest={pendingRequestItemTypeIds.includes(subItem.type_id)}
        hasSentRequest={sentRequestItemTypeIds.includes(subItem.type_id)}
      />
    ));

  return (
    <TableContainer
      component={Box}
      sx={{ height: "100%", overflow: "hidden", mt: 2.25, mb: 1 }}
    >
      <Table sx={{ tableLayout: "fixed" }}>
        <ItemsTableHead approvalType={packageType.approval_type} />
        <TableBody>
          {renderItems(submissionItems)}
          <When
            condition={
              userType === USER_TYPE.STAFF &&
              accountProject.account_project_works?.length === 0
            }
          >
            <InternalDocumentsRows layout="compact" />
          </When>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
