import { TableRow } from "@mui/material";
import {
  Submission,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
} from "@/models/Submission";
import { useState } from "react";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { useDeleteSubmission, useReplaceSubmussion } from "@/hooks/api/useSubmissions";
import { useParams } from "@tanstack/react-router";
import { deleteDocument, saveObject } from "@/hooks/api/useObjectStorage";
import { FileUploadButton } from "@/components/Shared/FileUploadButton";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { BCDesignTokens } from "epic.theme";
import { useFileStore } from "@/store/fileStore";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  folderPath: string;
  setIsPendingUpload: React.Dispatch<React.SetStateAction<boolean>>;
}>;

export default function Row({
  documentSubmission,
  folderPath,
  setIsPendingUpload,
}: DocumentRowProps) {
  const queryClient = useQueryClient();
  const { submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [isReplacingDocument, setIsReplacingDocument] = useState(false);
  const [currentSubmission, setCurrentSubmission] =
    useState<Submission>(documentSubmission);

  const { removeFile } = useFileStore();

  const { mutateAsync: deleteSubmission } = useDeleteSubmission({
    submissionItemId: currentSubmission.item_id,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, documentSubmission.major_version], // major version is the package id
      });
      notify.success("Document removed successfully");
    },
  });

  const { mutateAsync: replaceSubmission } = useReplaceSubmussion({
    onSuccess: (newSubmission) => {
      setCurrentSubmission(newSubmission);
      notify.success("Document replaced successfully");
    },
    onError: () => {
      notify.error("Failed to replace document");
    },
    submissionPackageId: Number(submissionPackageId),
  });

  const { submitted_document, version, submitted_by } = currentSubmission;

  const downloadDocument = async () => {
    try {
      if (pendingGetObject || !submitted_document) return;
      setPendingGetObject(true);
      await getObjectFromS3({
        name: submitted_document.name,
        url: submitted_document.url,
      });
    } catch (e) {
      const errorMessage = isAxiosError(e)
        ? (e.response?.data?.message ?? "Failed to download document")
        : "Failed to download document";
      notify.error(errorMessage);
    } finally {
      setPendingGetObject(false);
    }
  };

  const openDocument = () => {
    downloadDocument();
  };

  const replaceDocument = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const fileToUpload = files[0];
    try {
      setIsReplacingDocument(true);
      setIsPendingUpload(true);
      const uploadedFile = await saveObject({
        file: fileToUpload,
        fileDetails: {
          filename: fileToUpload.name,
          folder: folderPath,
        },
      });

      const documentData = {
        name: fileToUpload.name,
        url: uploadedFile,
        folder: submitted_document?.folder,
      };
      await replaceSubmission({
        submissionId: currentSubmission.id,
        data: {
          type: SUBMISSION_TYPE.DOCUMENT,
          data: documentData,
        },
      });
    } catch (e) {
      const errorMessage = isAxiosError(e)
        ? (e.response?.data?.message ?? "Failed to replace document")
        : "Failed to replace document";
      notify.error(errorMessage);
    } finally {
      setIsReplacingDocument(false);
      setIsPendingUpload(false);
    }
  };

  const removeDocument = async () => {
    try {
      setIsRemovingDocument(true);
      await deleteDocument({ filepath: submitted_document?.url ?? "" });
      await deleteSubmission(currentSubmission.id);
      removeFile(currentSubmission.id);
    } catch (e) {
      notify.error("Failed to remove document");
    } finally {
      setIsRemovingDocument(false);
    }
  };

  // Only allow removal of the first version of the document but not yet submitted
  const isRemovable =
    currentSubmission.status === SUBMISSION_STATUS.PENDING &&
    currentSubmission.minor_version === 1;

  return (
    <TableRow>
      <SubmitTableCell>
        {/* <Typography
          variant="body1"
          color="inherit"
          sx={{
            overflow: "clip",
            textOverflow: "ellipsis",
            cursor: "pointer",
            mx: 0.5,
          }}
        > */}
        <DocumentLink
          name={submitted_document?.name ?? ""}
          loading={pendingGetObject}
          onClick={openDocument}
        />
        {/* </Typography> */}
      </SubmitTableCell>
      <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
      <SubmitTableCell align="right">{version}</SubmitTableCell>
      <SubmitTableCell align="right">
        {isRemovable ? (
          <LoadingButton
            variant="text"
            loading={isRemovingDocument}
            onClick={removeDocument}
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
        ) : (
          <FileUploadButton
            onChange={replaceDocument}
            loading={isReplacingDocument}
          >
            Replace
          </FileUploadButton>
        )}
      </SubmitTableCell>
    </TableRow>
  );
}
