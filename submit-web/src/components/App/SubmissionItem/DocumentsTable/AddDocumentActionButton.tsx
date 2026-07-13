import { useState } from "react";
import { FileUploadButton } from "@/components/Shared/FileUploadButton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { QUERY_KEY } from "@/hooks/api/constants";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { createSubmission } from "@/hooks/api/useSubmissions";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { GEO_MAX_FILE_SIZE_BYTES, GEO_MAX_FILE_SIZE_MB } from "@/utils/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { isAxiosError } from "axios";

type AddDocumentActionButtonProps = {
  handleAddDocument: (submission: Submission) => void;
  folder: string;
  folderPath: string;
  setIsPendingUpload: React.Dispatch<React.SetStateAction<boolean>>;
  isGeoSpatial?: boolean;
  onUploadComplete?: (submission: Submission) => void;
};
export const AddDocumentActionButton = ({
  handleAddDocument,
  folder,
  folderPath,
  setIsPendingUpload,
  isGeoSpatial = false,
  onUploadComplete,
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
    const ext = fileToUpload.name.split(".").pop()?.toLowerCase();
    if (isGeoSpatial && ext !== "zip" && ext !== "shp") {
      notify.error("Only .zip and .shp files are allowed for geospatial data.");
      return;
    }
    if (isGeoSpatial && fileToUpload.size > GEO_MAX_FILE_SIZE_BYTES) {
      notify.error(
        `Geospatial files must be ${GEO_MAX_FILE_SIZE_MB} MB or smaller.`,
      );
      return;
    }
    try {
      setIsAddingDocument(true);
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
        folder: folder,
      };
      const addedSubmission = await createSubmission(Number(submissionItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: documentData,
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, Number(submissionItemId)],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, Number(submissionPackageId)],
      });
      if (isGeoSpatial) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.GEO_UPLOADS],
        });
      }
      handleAddDocument(addedSubmission);
      if (isGeoSpatial && onUploadComplete) {
        onUploadComplete(addedSubmission);
      }
    } catch (e) {
      notify.error("Failed to add document");
      if (isAxiosError(e)) {
        notify.error(e.response?.data.message);
      }
    } finally {
      setIsAddingDocument(false);
      setIsPendingUpload(false);
    }
  };
  return (
    <FileUploadButton
      onChange={createDocument}
      loading={isAddingDocument}
      accept={isGeoSpatial ? ".zip,.shp" : undefined}
    >
      {isGeoSpatial ? "+ Add a New Geospatial File" : "+ Add a New Document"}
    </FileUploadButton>
  );
};
