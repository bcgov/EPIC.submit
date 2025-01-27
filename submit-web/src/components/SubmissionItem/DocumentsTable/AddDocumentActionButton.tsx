import { useState } from "react";
import { FileUploadButton } from "@/components/Shared/FileUploadButton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { QUERY_KEY } from "@/hooks/api/constants";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { createSubmission } from "@/hooks/api/useSubmissions";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

type AddDocumentActionButtonProps = {
  handleAddDocument: (submission: Submission) => void;
  folder: string;
};
export const AddDocumentActionButton = ({
  handleAddDocument,
  folder,
}: AddDocumentActionButtonProps) => {
  const { submissionPackageId, submissionId: submissionItemId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const queryClient = useQueryClient();

  const createDocument = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const fileToUpload = files[0];
    try {
      setIsAddingDocument(true);
      const uploadedFile = await saveObject({
        file: fileToUpload,
        fileDetails: {
          filename: fileToUpload.name,
        },
      });

      const documentData = {
        name: fileToUpload.name,
        url: uploadedFile.filepath,
        folder: folder,
      };
      const addedSubmission = await createSubmission(Number(submissionItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: documentData,
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, Number(submissionPackageId)],
      });
      handleAddDocument(addedSubmission);
    } catch (e) {
      notify.error("Failed to add document");
    } finally {
      setIsAddingDocument(false);
    }
  };
  return (
    <FileUploadButton onChange={createDocument} loading={isAddingDocument}>
      + Add a New Document
    </FileUploadButton>
  );
};
