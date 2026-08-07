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
      sx={{ height: "100%", overflow: "visible", mt: 2.25, mb: 1 }}
    >
      <Table
        sx={{
          tableLayout: "fixed",
          // Align the first/last columns with the surrounding 16px content
          // inset (matching the InfoBox). Body cells add a 0.5-spacing (4px)
          // inner margin on their content, so their cell padding is 12px to
          // land the text at 16px. Scoped to direct rows so nested sub-tables
          // are unaffected.
          "& > tbody > tr > td:first-of-type": {
            paddingLeft: "12px !important",
          },
          "& > tbody > tr > td:last-of-type": {
            paddingRight: "16px !important",
          },
        }}
      >
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
