import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";

type RowProps = {
  internalStaffDocument: InternalStaffDocument;
  numColumns: number;
};

export default function Row({ internalStaffDocument, numColumns }: RowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const { name, url } = internalStaffDocument;

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
          <MuiLink onClick={downloadDocument}>{name}</MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right" colSpan={numColumns - 1}></SubmitTableCell>
    </TableRow>
  );
}
