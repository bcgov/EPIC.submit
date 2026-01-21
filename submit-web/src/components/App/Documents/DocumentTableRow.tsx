import { useState } from "react";
import dateUtils from "@/utils/dateUtils";
import { Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmittedDocument } from "@/models/Submission";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";

type DocumentRowProps = Readonly<{
  submittedDocument: SubmittedDocument;
}>;

export default function DocumentTableRow({
  submittedDocument,
}: DocumentRowProps) {
  const { name, url } = submittedDocument;

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
          <DocumentLink
            onClick={openDocument}
            name={submittedDocument.name}
            loading={pendingGetObject}
          />
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
      <SubmitTableCell align="center">{""}</SubmitTableCell>
    </TableRow>
  );
}
