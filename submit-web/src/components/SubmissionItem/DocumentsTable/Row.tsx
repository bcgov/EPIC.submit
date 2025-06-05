import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { useState } from "react";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { useReplaceSubmussion } from "@/hooks/api/useSubmissions";
import { useParams } from "@tanstack/react-router";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { FileUploadButton } from "@/components/Shared/FileUploadButton";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";

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
  const { submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [isReplacingDocument, setIsReplacingDocument] = useState(false);
  const [currentSubmission, setCurrentSubmission] =
    useState<Submission>(documentSubmission);

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

  const {
    submitted_document: { name, url, folder },
    version,
    submitted_by,
  } = currentSubmission;

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

  const replaceDocument = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const fileToUpload = files[0];
    try {
      setIsReplacingDocument(true);
      setIsPendingUpload(true);
      const resolvedFolderPath =
        currentSubmission.submitted_document.folder ===
        S3_FOLDER.SUPPORTING_DOCUMENTS.value
          ? `${folderPath}${S3_FOLDER.SUPPORTING_DOCUMENTS.value}`
          : folderPath;
      const uploadedFile = await saveObject({
        file: fileToUpload,
        fileDetails: {
          filename: fileToUpload.name,
          folder: resolvedFolderPath,
        },
      });

      const documentData = {
        name: fileToUpload.name,
        url: uploadedFile,
        folder: folder,
      };
      await replaceSubmission({
        submissionId: currentSubmission.id,
        data: {
          type: SUBMISSION_TYPE.DOCUMENT,
          data: documentData,
        },
      });
    } catch (e) {
      notify.error("Failed to replace document");
    } finally {
      setIsReplacingDocument(false);
      setIsPendingUpload(false);
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
          <MuiLink
            onClick={openDocument}
            sx={{
              textDecoration: "none",
            }}
          >
            {name}
          </MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
      <SubmitTableCell align="right">{version}</SubmitTableCell>
      <SubmitTableCell align="right">
        <FileUploadButton
          onChange={replaceDocument}
          loading={isReplacingDocument}
        >
          Replace
        </FileUploadButton>
      </SubmitTableCell>
    </TableRow>
  );
}
