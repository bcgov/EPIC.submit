import { CircularProgress, Link as MuiLink, Typography } from "@mui/material";
import { PackageTableRow, DocumentTableCell } from "./DocumentTableRow";
import {
  createSubmission,
  useTriggerGeoProcess,
} from "@/hooks/api/useSubmissions";
import { SUBMISSION_TYPE, Submission } from "@/models/Submission";
import { QUERY_KEY } from "@/hooks/api/constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo, useState } from "react";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useMounted } from "@/hooks/common";
import { useFileStore } from "@/store/fileStore";
import { isAxiosError } from "axios";

type DocumentTableRowProps = Readonly<{
  documentItem: any;
  error?: boolean;
  folder?: string;
  isGeoSpatial?: boolean;
  onUploadComplete?: (submission: Submission) => void;
}>;
export default function PendingDocumentRow({
  documentItem,
  error = false,
  folder: s3Folder,
  isGeoSpatial,
  onUploadComplete,
}: DocumentTableRowProps) {
  const { submissionId: subItemId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { mutateAsync: triggerGeoProcessAsync } = useTriggerGeoProcess();

  const [isPending, setIsPending] = useState(false);

  const queryClient = useQueryClient();

  const { completeFileUpload, removePendingFile, pendingFiles } =
    useFileStore();

  // pending file with smallest id
  const firstPendingFile = useMemo(() => {
    return pendingFiles.reduce(
      (prev, current) => (prev.id < current.id ? prev : current),
      pendingFiles[0] ?? { id: Infinity },
    );
  }, [pendingFiles]);

  useMounted(() => {
    setIsPending(true);
  });

  useEffect(() => {
    if (isPending && firstPendingFile.id === documentItem.id) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, firstPendingFile]);

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
        url: uploadedFile,
        folder: documentItem.folder,
      };
      const documentSubmission = await createSubmission(Number(subItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: documentData,
      });

      if (isGeoSpatial) {
        const ext = documentItem.file.name.split(".").pop()?.toLowerCase();
        if (ext === "shp" || ext === "zip") {
          try {
            await triggerGeoProcessAsync({ itemId: Number(subItemId) });
            // Force React Query to immediately fetch the new row so polling starts
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEY.GEO_UPLOADS],
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to auto-trigger geo processing", e);
          }
        }
      }

      completeFileUpload(documentItem.id, documentSubmission);

      if (isGeoSpatial && onUploadComplete) {
        onUploadComplete(documentSubmission);
      }

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, documentSubmission.item_id],
      });
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message
        : "";
      notify.error(
        `Failed to upload document. Please try again later. ${errorMessage}`,
      );
      removePendingFile(documentItem.id);
    }
  };

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
      <DocumentTableCell align="center"></DocumentTableCell>
    </PackageTableRow>
  );
}
