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
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import { SubmitTableHeadCell } from "../Shared/Table/common";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { usePackageTableStore } from "./packageTableStore";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import InternalDocumentsRows from "../SubmissionItem/InternalDocuments/Rows";
import { SubmissionPackage } from "@/models/Package";
import { useMemo } from "react";
import { UPDATE_REQUEST_TYPE } from "@/models/UpdateRequest";
import { isSubmissionItemReadyToSubmit } from "./utils";
import { filterOpenUpdateRequests } from "@/utils";

type ItemsTableProps = Readonly<{
  submissionPackage: SubmissionPackage;
}>;
export default function ItemsTable({ submissionPackage }: ItemsTableProps) {
  const { items: submissionItems, update_requests } = submissionPackage;

  const itemUpdateRequestMap = useMemo(() => {
    const _update_requests = filterOpenUpdateRequests(update_requests);
    return _update_requests
      .flatMap((update_request) => update_request.submission_item_ids)
      .reduce((acc: { [key: number]: boolean }, id) => {
        acc[id] = true;
        return acc;
      }, {});
  }, [update_requests]);

  const itemRevisionRequiredMap = useMemo(() => {
    const _update_requests = update_requests.filter(
      (update_request) =>
        update_request.type === UPDATE_REQUEST_TYPE.REVIEW.value,
    );
    return _update_requests
      .flatMap((update_request) => update_request.submission_item_ids)
      .reduce((acc: { [key: number]: boolean }, id) => {
        acc[id] = true;
        return acc;
      }, {});
  }, [update_requests]);

  const { userType } = useAccount();

  const { isValidating } = usePackageTableStore();

  // const sortedSubmissionItems = submissionItems.map((subItem) => ({
  //   id: subItem.id,
  //   name: subItem.type.name,
  //   status: subItem.status,
  //   submitted_by: subItem?.submitted_by,
  //   version: subItem.version,
  //   submissions: subItem.submissions.filter(
  //     (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  //   ),
  //   has_document:
  //     subItem.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD,
  //   reviewStatus: subItem.review?.status,
  //   isUpdateRequest: Boolean(itemUpdateRequestMap[subItem.id]),
  //   isRevisionRequired: Boolean(itemRevisionRequiredMap[subItem.id]),
  //   review_start_date: subItem.review_start_date,
  // }));

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
