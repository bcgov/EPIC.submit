import { useState } from "react";
import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import {
  SubmitSubTableCell,
  SubmitTableCell,
} from "@/components/Shared/Table/common";
import { StatusCell } from "../DocumentRow/StatusCell";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
}>;

export default function DocumentSubRow({
  documentSubmission,
}: DocumentRowProps) {
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

  return (
    <TableRow>
      <SubmitTableCell width={"50%"}>
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
      <SubmitTableCell align="right" width={"10%"}>
        {submitted_by || ""}
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"10%"}>
        {version}
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"20%"}>
        <StatusCell submittedDocument={documentSubmission} />
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"10%"}></SubmitTableCell>
    </TableRow>
  );
}
