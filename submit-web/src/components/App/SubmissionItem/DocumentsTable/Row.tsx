import { Box, TableRow, IconButton } from "@mui/material";
import {
  Submission,
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
} from "@/models/Submission";
import { useState } from "react";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import {
  useDeleteSubmission,
  useReplaceSubmussion,
} from "@/hooks/api/useSubmissions";
import { useParams } from "@tanstack/react-router";
import { deleteDocument, saveObject } from "@/hooks/api/useObjectStorage";
import { FileUploadButton } from "@/components/Shared/FileUploadButton";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { GeoApprovedBadge } from "@/components/Shared/GeoApprovedBadge";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { BCDesignTokens } from "epic.theme";
import { useFileStore } from "@/store/fileStore";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DocumentsSubTable from "@/components/App/Submission/ItemsTable/DocumentsSubTable";
import { GEO_MAX_FILE_SIZE_BYTES, GEO_MAX_FILE_SIZE_MB } from "@/utils/constants";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  folderPath: string;
  setIsPendingUpload: React.Dispatch<React.SetStateAction<boolean>>;
  isGeoSpatial?: boolean;
  onDocumentClick?: (documentItem: Submission) => void;
  onUploadComplete?: (submission: Submission) => void;
}>;

export default function Row({
  documentSubmission,
  folderPath,
  setIsPendingUpload,
  isGeoSpatial = false,
  onDocumentClick,
  onUploadComplete,
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
  const [expanded, setExpanded] = useState(false);

  const { removeFile } = useFileStore();

  const { mutateAsync: deleteSubmission } = useDeleteSubmission({
    submissionItemId: currentSubmission.item_id,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEY.SUBMISSION_PACKAGE,
          documentSubmission.major_version,
        ], // major version is the package version
      });
      notify.success("Document removed successfully");
    },
  });

  const { mutateAsync: replaceSubmission } = useReplaceSubmussion({
    onSuccess: (newSubmission) => {
      setCurrentSubmission(newSubmission);
      notify.success("Document replaced successfully");
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, Number(currentSubmission.item_id)],
      });
      if (isGeoSpatial) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.GEO_UPLOADS],
        });
      }
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
    if (isGeoSpatial && onDocumentClick) {
      onDocumentClick(currentSubmission);
    } else {
      downloadDocument();
    }
  };

  const replaceDocument = async (files: FileList | null) => {
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
      const newSubmission = await replaceSubmission({
        submissionId: currentSubmission.id,
        data: {
          type: SUBMISSION_TYPE.DOCUMENT,
          data: documentData,
        },
      });

      if (isGeoSpatial && onUploadComplete) {
        onUploadComplete(newSubmission);
      }
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, Number(currentSubmission.item_id)],
      });
      if (isGeoSpatial) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.GEO_UPLOADS],
        });
      }
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
    <>
      <TableRow>
        <SubmitTableCell>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              overflow: "hidden",
            }}
          >
            <DocumentLink
              name={submitted_document?.name ?? ""}
              loading={pendingGetObject}
              onClick={openDocument}
            />
            <GeoApprovedBadge
              itemId={currentSubmission.item_id}
              url={submitted_document?.url}
              folder={submitted_document?.folder}
            />
          </Box>
        </SubmitTableCell>
        <SubmitTableCell align="left">{submitted_by || ""}</SubmitTableCell>
        <SubmitTableCell align="right">
          {version}
          {currentSubmission.minor_version > 1 ? (
            <IconButton onClick={() => setExpanded(!expanded)} sx={{ p: 0 }}>
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.3s ease-in-out",
                }}
              />
            </IconButton>
          ) : (
            <span style={{ marginRight: "24px" }} />
          )}
        </SubmitTableCell>
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
              accept={isGeoSpatial ? ".zip,.shp" : undefined}
            >
              Replace
            </FileUploadButton>
          )}
        </SubmitTableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <SubmitTableCell
            colSpan={5}
            style={{ paddingBottom: 0, paddingTop: 0, borderTop: "none" }}
          >
            <DocumentsSubTable
              submission={currentSubmission}
              onDocumentClick={onDocumentClick}
            />
          </SubmitTableCell>
        </TableRow>
      )}
    </>
  );
}
