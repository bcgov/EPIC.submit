import { Box, Link as MuiLink, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import {
  INTERNAL_STAFF_DOCUMENT_TYPE,
  InternalStaffDocument,
} from "@/models/SubmissionItem";
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
import LinkIcon from "@mui/icons-material/Link";

type RowProps = Readonly<{
  internalStaffDocument: InternalStaffDocument;
  numColumns?: number;
  hideAction?: boolean;
}>;

export default function Row({
  internalStaffDocument,
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

  const { name, url, type, created_by_user } = internalStaffDocument;

  const handleDocumentClick = () => {
    if (type === INTERNAL_STAFF_DOCUMENT_TYPE.S3) {
      downloadDocument();
    } else if (type === INTERNAL_STAFF_DOCUMENT_TYPE.LINK) {
      navigateToLink();
    }
  };

  const navigateToLink = () => {
    window.open(url, "_blank");
  };

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
      if (internalStaffDocument.type === INTERNAL_STAFF_DOCUMENT_TYPE.S3) {
        await deleteDocument({ filepath: internalStaffDocument.url });
      }
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
      <SubmitTableCell width="40%">
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
            <MuiLink onClick={handleDocumentClick}>{name}</MuiLink>
          </Typography>
          {type === INTERNAL_STAFF_DOCUMENT_TYPE.LINK && (
            <LinkIcon htmlColor={BCDesignTokens.typographyColorLink} />
          )}
        </Box>
      </SubmitTableCell>
      <SubmitTableCell align="right" width="40%">
        <Typography variant="body1" color="inherit">
          {created_by_user.staff_user.first_name}{" "}
          {created_by_user.staff_user.last_name}
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right" width="20%">
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
