import { useState } from "react";
import dateUtils from "@/utils/dateUtils";
import { Link as MuiLink, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmittedDocument } from "@/models/Submission";
import { SubmissionStatusChip } from "../SubmissionStatusChip";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

interface DocumentRowProps {
  submittedDocument: SubmittedDocument;
}

export default function DocumentTableRow({ submittedDocument }: DocumentRowProps) {
  const { name, url } = submittedDocument;

  const [pendingGetObject, setPendingGetObject] = useState(false)

  const downloadDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };
  
  const openDocument = () => {
    downloadDocument();
  };

  return (
    <>
      <TableRow>
        <SubmitTableCell align="left">
          {submittedDocument.project_name ?? ""}
        </SubmitTableCell>
        <SubmitTableCell>
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
            <MuiLink onClick={openDocument}>{submittedDocument.name}</MuiLink>
          </Typography>
        </SubmitTableCell>
        <SubmitTableCell align="right">
          {submittedDocument.version ?? ""}
        </SubmitTableCell>
        <SubmitTableCell align="center">
          {dateUtils.formatDate(submittedDocument.submitted_on)}
        </SubmitTableCell>
        <SubmitTableCell
          align="right"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <SubmissionStatusChip status={submittedDocument.status ?? ""} />
        </SubmitTableCell>
        <SubmitTableCell align="center">
          {''}
        </SubmitTableCell>
      </TableRow>
    </>
  );
}
