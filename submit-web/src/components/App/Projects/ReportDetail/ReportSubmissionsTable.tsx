import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  SubmitTableCell,
  SubmitTableHead,
  SubmitTableHeadCell,
  SubmitTableRow,
} from "@/components/Shared/Table/common";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { StatusChip } from "@/components/Shared/StatusChip";
import { SubmissionPackage } from "@/models/Package";
import { Submission } from "@/models/Submission";
import dateUtils from "@/utils/dateUtils";
import {
  getReportDocumentSubmissions,
  getDocumentStatusLabel,
  getDocumentStatusTheme,
} from "./reportSubmissions";

type ReportSubmissionsTableProps = {
  reportPackage: SubmissionPackage;
};

const EMPTY_MESSAGE = "No documents have been submitted yet.";

const DocumentNameCell = ({ submission }: { submission: Submission }) => {
  const [loading, setLoading] = useState(false);
  const name = submission.submitted_document?.name ?? "";
  const url = submission.submitted_document?.url ?? "";

  const onDownload = async () => {
    if (loading || !url) return;
    try {
      setLoading(true);
      await getObjectFromS3({ name, url });
    } catch {
      notify.error("Failed to download document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={name}>
      <Box
        sx={{
          maxWidth: "520px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <DocumentLink
          name={
            <Typography
              component="span"
              aria-label={name}
              sx={{
                textDecoration: "underline",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                maxWidth: "520px",
                verticalAlign: "bottom",
              }}
            >
              {name}
            </Typography>
          }
          loading={loading}
          onClick={onDownload}
        />
      </Box>
    </Tooltip>
  );
};

/**
 * Read-only submissions table for a report/notification phase page. Lists every
 * document submitted for this report in this phase, newest first; Document Name
 * downloads, Status is a badge, and there is no Actions column. Renders a single
 * empty-state row when there are no submissions.
 */
export const ReportSubmissionsTable = ({
  reportPackage,
}: ReportSubmissionsTableProps) => {
  const submissions = getReportDocumentSubmissions(reportPackage);

  return (
    <TableContainer component={Box} sx={{ width: "100%" }}>
      <Table sx={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
        <SubmitTableHead>
          <TableRow>
            <SubmitTableHeadCell>Document Name</SubmitTableHeadCell>
            <SubmitTableHeadCell>Submitted By</SubmitTableHeadCell>
            <SubmitTableHeadCell>Date Submitted</SubmitTableHeadCell>
            <SubmitTableHeadCell>Status</SubmitTableHeadCell>
          </TableRow>
        </SubmitTableHead>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <SubmitTableCell
                colSpan={4}
                sx={{
                  p: "0 !important",
                  background: "#F1F8FE",
                  border: "1px solid #D8EAFD",
                  borderRadius: "5px",
                  "&:first-of-type": {
                    borderLeft: "1px solid #D8EAFD",
                    borderTopLeftRadius: 5,
                    borderBottomLeftRadius: 5,
                  },
                  "&:last-of-type": {
                    borderRight: "1px solid #D8EAFD",
                    borderTopRightRadius: 5,
                    borderBottomRightRadius: 5,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    height: "40px",
                    pl: "16px",
                    alignItems: "center",
                    alignSelf: "stretch",
                  }}
                >
                  {EMPTY_MESSAGE}
                </Box>
              </SubmitTableCell>
            </TableRow>
          ) : (
            submissions.map((submission) => (
              <SubmitTableRow key={submission.id}>
                <SubmitTableCell width="55%">
                  <DocumentNameCell submission={submission} />
                </SubmitTableCell>
                <SubmitTableCell width="20%">
                  {submission.submitted_by || "-"}
                </SubmitTableCell>
                <SubmitTableCell width="10%">
                  {dateUtils.formatDate(submission.created_date) || "-"}
                </SubmitTableCell>
                <SubmitTableCell width="15%">
                  <StatusChip
                    label={getDocumentStatusLabel(submission.status)}
                    theme={getDocumentStatusTheme(submission.status)}
                  />
                </SubmitTableCell>
              </SubmitTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportSubmissionsTable;
