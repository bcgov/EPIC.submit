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
import TableSortLabel from "@mui/material/TableSortLabel";
import { useState } from "react";
import { Order } from "../Shared/Table/utils";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SubmissionItemTableRow from "./SubmissionItemTableRow";
import {
  SUBMISSION_ITEM_METHOD,
  SubmissionItem,
} from "@/models/SubmissionItem";
import { SubmissionItemTableRow as SubmissionItemTableRowType } from "./types";
import { StyledTableHeadCell } from "../Shared/Table/common";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import { usePackageTableStore } from "./packageTableStore";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { When } from "react-if";
import InternalDocuments from "./InternalDocuments";

export default function ItemsTable({
  submissionItems,
}: {
  submissionItems: Array<SubmissionItem>;
}) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] =
    useState<keyof SubmissionItemTableRowType>("name");
  const { userType } = useAccount();
  const handleRequestSort = (property: keyof SubmissionItemTableRowType) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const { isValidating } = usePackageTableStore();

  const sortedSubmissionItems = submissionItems.map((subItem) => ({
    id: subItem.id,
    name: subItem.type.name,
    status: subItem.status,
    submitted_by: subItem?.submitted_by,
    version: subItem.version,
    submissions: subItem.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT
    ),
    has_document:
      subItem.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD,
  }));

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
            <StyledTableHeadCell colSpan={2}>
              <TableSortLabel
                active={orderBy === "name"}
                direction={orderBy === "name" ? order : "asc"}
                onClick={() => handleRequestSort("name")}
                IconComponent={SwapVertIcon}
                sx={{
                  ".MuiTableSortLabel-icon": {
                    color: `${BCDesignTokens.themeGray70} !important`,
                    "&:hover": {
                      color: "#EDEBE9 !important",
                    },
                  },
                }}
              >
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
              </TableSortLabel>
            </StyledTableHeadCell>
            <StyledTableHeadCell align="right">Uploaded by</StyledTableHeadCell>
            <StyledTableHeadCell align="right">Version</StyledTableHeadCell>
            <StyledTableHeadCell align="center">Status</StyledTableHeadCell>
            <StyledTableHeadCell align="center">Actions</StyledTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSubmissionItems?.map((subItem) => (
            <SubmissionItemTableRow
              key={`custom-row-${subItem.name}`}
              item={subItem}
              error={
                isValidating &&
                subItem.status !== SUBMISSION_STATUS.COMPLETED.value
              }
            />
          ))}
          <When condition={userType === USER_TYPE.STAFF}>
            <InternalDocuments submissions={submissions} />
          </When>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
