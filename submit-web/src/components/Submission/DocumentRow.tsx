import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "../Shared/Table/utils";
import { StyledTableCell } from "../Shared/Table/common";

type DocumentRowProps = {
  documentSubmission: Submission;
};

export default function DocumentRow({ documentSubmission }: DocumentRowProps) {
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
  return (
    <TableRow>
      <StyledTableCell>
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
          <MuiLink onClick={downloadDocument}>{name}</MuiLink>
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="right">{submitted_by || ""}</StyledTableCell>
      <StyledTableCell align="right">{version}</StyledTableCell>
      <StyledTableCell align="right" colSpan={2}></StyledTableCell>
    </TableRow>
  );
}
