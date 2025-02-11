import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { BCDesignTokens } from "epic.theme";
import { useDeleteInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";
import { useParams } from "@tanstack/react-router";
import { deleteDocument } from "@/hooks/api/useObjectStorage";
import { Unless } from "react-if";
import { useFileStore } from "@/store/fileStore";

type RowProps = {
  internalStaffDocument: InternalStaffDocument;
  numColumns: number;
  hideAction?: boolean;
};

export default function Row({
  internalStaffDocument,
  numColumns,
  hideAction = false,
}: RowProps) {
  const { submissionPackageId, submissionId: submissionItemId } = useParams({
    strict: false,
  });
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);

  const { mutateAsync: deleteInternalStaffSubmission } =
    useDeleteInternalStaffDocument({
      packageId: Number(submissionPackageId),
      itemId: Number(submissionItemId),
    });

  const { removeFile } = useFileStore();

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

  const onRemoveClick = async () => {
    try {
      setIsRemovingDocument(true);
      await deleteDocument({ filepath: internalStaffDocument.url });
      await deleteInternalStaffSubmission({
        documentId: internalStaffDocument.id,
      });
      removeFile(internalStaffDocument.id);
    } catch (e) {
      notify.error("Failed to remove document");
    } finally {
      setIsRemovingDocument(false);
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
      <SubmitTableCell align="right" colSpan={numColumns - 2}></SubmitTableCell>
      <SubmitTableCell align="right">
        <Unless condition={hideAction}>
          <LoadingButton
            onClick={onRemoveClick}
            loading={isRemovingDocument}
            variant="text"
            sx={{
              color: BCDesignTokens.typographyColorLink,
              "&:hover": {
                backgroundColor: "transparent",
              },
              "&:focus": {
                outline: "none",
              },
            }}
          >
            Remove
          </LoadingButton>
        </Unless>
      </SubmitTableCell>
    </TableRow>
  );
}
