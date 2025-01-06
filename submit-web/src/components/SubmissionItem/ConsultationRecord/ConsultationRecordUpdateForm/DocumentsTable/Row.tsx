import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
}>;

export default function Row({ documentSubmission }: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);

  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;

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

  const replaceDocument = () => {
    console.log("Replace document");
  };

  return (
    <TableRow>
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
          <MuiLink onClick={openDocument}>{name}</MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
      <SubmitTableCell align="right">{version}</SubmitTableCell>
      <SubmitTableCell align="right" colSpan={1}></SubmitTableCell>
      <SubmitTableCell align="right">
        <MuiLink onClick={replaceDocument}>Replace</MuiLink>
      </SubmitTableCell>
    </TableRow>
  );
}
