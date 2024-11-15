import {
  CircularProgress,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { StyledTableCell } from "@/components/Shared/Table/common";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

type RowProps = {
  pendingDocument: Record<string, any>;
};

export default function PendingRow({ pendingDocument }: RowProps) {
  const {
    file: { name },
  } = pendingDocument;

  const { triggerPending, removeDocument } = useDocumentUploadStore();

  console.log(pendingDocument);

  useEffect(() => {
    triggerPending(pendingDocument.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadObject = async () => {
    try {
      // TODO: Implement saveObject function
    } catch (error) {
      notify.error("Failed to upload document");
      removeDocument(pendingDocument.id);
    }
  };

  useEffect(() => {
    if (pendingDocument.pending) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDocument.pending]);

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
          <MuiLink>{name}</MuiLink>
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="left" colSpan={3}>
        <CircularProgress size={20} />
      </StyledTableCell>
    </TableRow>
  );
}
