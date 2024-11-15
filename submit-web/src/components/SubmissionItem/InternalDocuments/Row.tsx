import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { StyledTableCell } from "@/components/Shared/Table/common";

type RowProps = {
  internalStaffDocument: InternalStaffDocument;
};

export default function Row({ internalStaffDocument }: RowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const { name, url, created_by } = internalStaffDocument;

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
      <StyledTableCell align="right">{created_by || ""}</StyledTableCell>
      <StyledTableCell align="right" colSpan={2}></StyledTableCell>
    </TableRow>
  );
}
