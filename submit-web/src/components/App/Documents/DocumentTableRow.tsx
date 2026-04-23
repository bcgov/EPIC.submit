import { useState } from "react";
import dateUtils from "@/utils/dateUtils";
import { TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { PaginatedSubmittedDocument } from "@/models/Submission";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IconButton } from "@mui/material";
import DocumentsSubTable from "@/components/App/Submission/ItemsTable/DocumentsSubTable";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { isAxiosError } from "axios";
import { SubmissionStatusChip } from "../SubmissionStatusChip";

type DocumentRowProps = Readonly<{
  submittedDocument: PaginatedSubmittedDocument;
}>;

export default function DocumentTableRow({
  submittedDocument,
}: DocumentRowProps) {
  const { name, url, version, submitted_on, status, work, phase } =
    submittedDocument;

  const [expanded, setExpanded] = useState(false);
  const [pendingGetObject, setPendingGetObject] = useState(false);

  const downloadDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : "An unexpected error occurred";
      notify.error(errorMessage);
    } finally {
      setPendingGetObject(false);
    }
  };

  const openDocument = () => {
    downloadDocument();
  };

  return (
    <>
      <TableRow sx={[expanded && { "& > *": { borderBottom: "unset" } }]}>
        <SubmitTableCell align="left">
          <Typography
            variant="body1"
            color="inherit"
            sx={{
              overflow: "clip",
              textOverflow: "ellipsis",
              cursor: "pointer",
              mx: 0.5,
            }}
          >
            <DocumentLink
              onClick={openDocument}
              name={name}
              loading={pendingGetObject}
            />
          </Typography>
        </SubmitTableCell>
        <SubmitTableCell align="left">{work}</SubmitTableCell>
        <SubmitTableCell align="left">{phase}</SubmitTableCell>
        <SubmitTableCell align="left">
          {version}
          {version !== "1.1" ? (
            <IconButton onClick={() => setExpanded(!expanded)} sx={{ p: 0 }}>
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.3s ease-in-out",
                }}
              />
            </IconButton>
          ) : (
            <span style={{ marginRight: "24px" }} />
          )}
        </SubmitTableCell>
        <SubmitTableCell align="left">
          {dateUtils.formatDate(submitted_on)}
        </SubmitTableCell>
        <SubmitTableCell
          align="center"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <SubmissionStatusChip status={status ?? ""} />
        </SubmitTableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <SubmitTableCell
            colSpan={6}
            style={{ paddingBottom: 0, paddingTop: 0, borderTop: "none" }}
          >
            <DocumentsSubTable
              submissionId={submittedDocument.root_submission_id}
              currentDocumentId={submittedDocument.id}
            />
          </SubmitTableCell>
        </TableRow>
      )}
    </>
  );
}
