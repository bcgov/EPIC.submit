import { CircularProgress, Link as MuiLink, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { PackageTableRow, DocumentTableCell } from "./DocumentTableRow";
import { createSubmission } from "@/hooks/api/useSubmissions";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { QUERY_KEY } from "@/hooks/api/constants";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { useEffect } from "react";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Document } from "@/store/documentUploadStore";

type DocumentTableRowProps = {
  documentItem: Document;
  error?: boolean;
  folder?: string;
};
export default function PendingDocumentRow({
  documentItem,
  error = false,
  folder: s3Folder,
}: DocumentTableRowProps) {
  const { submissionId: subItemId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();

  const { triggerPending, completeDocument, removeDocument } =
    useDocumentUploadStore();

  useEffect(() => {
    triggerPending(documentItem.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadObject = async () => {
    try {
      const uploadedFile = await saveObject({
        file: documentItem.file,
        fileDetails: {
          filename: documentItem.file.name,
          folder: s3Folder,
        },
      });

      const documentData = {
        name: documentItem.file.name,
        url: uploadedFile.filepath,
        folder: documentItem.folder,
      };
      const documentSubmission = await createSubmission(Number(subItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: documentData,
      });

      completeDocument(documentItem.id, documentSubmission.id);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, documentSubmission.item_id],
      });
    } catch (error) {
      notify.error("Failed to upload document");
      removeDocument(documentItem.id);
    }
  };

  useEffect(() => {
    if (documentItem.pending) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentItem.pending]);

  const onActionClick = () => {};

  return (
    <PackageTableRow key={`row-${documentItem.file.name}`} error={error}>
      <DocumentTableCell colSpan={2}>
        <Typography
          variant="body1"
          color="inherit"
          sx={{
            overflow: "clip",
            textOverflow: "ellipsis",
            cursor: "pointer",
            mx: 0.5,
            textDecoration: "none",
          }}
        >
          <MuiLink sx={{ textDecoration: "none" }}>
            {documentItem.file.name}
          </MuiLink>
        </Typography>
      </DocumentTableCell>
      <DocumentTableCell align="center" colSpan={2}>
        <CircularProgress size={"16px"} />
      </DocumentTableCell>
      <DocumentTableCell align="center">
        <Typography
          variant="body2"
          sx={{
            color: BCDesignTokens.typographyColorLink,
            "&:hover": {
              cursor: "pointer",
              textDecoration: "underline",
            },
          }}
          onClick={onActionClick}
        >
          Remove
        </Typography>
      </DocumentTableCell>
    </PackageTableRow>
  );
}
