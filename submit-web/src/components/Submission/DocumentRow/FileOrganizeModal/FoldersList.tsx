import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useMemo, useState } from "react";
import { Submission } from "@/models/Submission";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useMoveSubmission } from "@/hooks/api/useSubmissions";
import {
  copyObject,
  NEW_PACKAGE_TYPE_S3_FOLDER_MAP,
} from "@/hooks/api/useObjectStorage";
import { SubmissionPackage } from "@/models/Package";
import { AccountProject } from "@/models/Project";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";

type FoldersListProps = {
  folders: { value: string; label: string }[];
  submissions?: Submission[];
  submissionToMove: Submission;
  submissionPackage: SubmissionPackage;
  accountProject?: AccountProject;
};
export const FoldersList = ({
  folders,
  submissions,
  submissionToMove,
  submissionPackage,
  accountProject,
}: FoldersListProps) => {
  const [selectedFolder, setSelectedFolder] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [locked, setLocked] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string | number | null>(null);

  const { mutateAsync: moveSubmission, isSuccess } = useMoveSubmission({
    packageId: Number(submissionPackage.id),
    submissionId: submissionToMove.id,
  });

  const { refetch } = useQuery(
    getStaffSubmissionPackageQueryOptions({
      packageId: submissionPackage.id,
      enabled: isSuccess,
    }),
  );

  const filteredSubmissions = useMemo(() => {
    if (!submissions || !selectedFolder) return submissions;

    return submissions.filter(
      (submission) =>
        submission.submitted_document.folder === selectedFolder.value,
    );
  }, [submissions, selectedFolder]);

  const handleOnTopOfExistingSubmission = async (
    targetSubmissionId: number,
  ) => {
    if (locked || !selectedFolder) return;
    setLocked(true);
    setMoveTarget(targetSubmissionId);

    const itemId = submissions?.find(
      (submission) => submission.id === targetSubmissionId,
    )?.item_id;

    if (!itemId) {
      notify.error("No item found for the target submission");
      setLocked(false);
      setMoveTarget(null);
      return;
    }

    try {
      const copyObjectResponse = await copyObject({
        relativeUrl: submissionToMove.submitted_document.url,
        destinationFolder: getSubmissionFolderName({
          projectName: accountProject?.project.name ?? "",
          sectionName: selectedFolder.value,
        }),
        filename: submissionToMove.submitted_document.name,
      });

      if (copyObjectResponse.status !== "success") {
        notify.error(
          `Failed to move submission: ${copyObjectResponse.message}`,
        );
        return;
      }

      await moveSubmission({
        submissionId: submissionToMove.id,
        destinationItemId: itemId,
        newPath: copyObjectResponse.new_relative_url ?? "",
        targetSubmissionId,
      });

      setSelectedFolder(null);
    } catch (error) {
      console.error("Error moving submission:", error);
      notify.error(
        `Failed to move submission: ${isAxiosError(error) ? error.message : "Internal error"}`,
      );
    } finally {
      setLocked(false);
      setMoveTarget(null);
      refetch();
    }
  };

  const getItemTypeByFolder = (
    packageTypeMap: Record<string, { value: string; label: string }[]>,
    folderValue: string,
  ) => {
    for (const [itemType, folders] of Object.entries(packageTypeMap)) {
      if (folders.map((folder) => folder.value).includes(folderValue)) {
        return itemType;
      }
    }
    return undefined;
  };

  const getItemFromFolder = (folderValue: string) => {
    if (!submissionPackage?.type || !folderValue) return undefined;

    const packageTypeMap =
      NEW_PACKAGE_TYPE_S3_FOLDER_MAP[submissionPackage.type.name];
    if (!packageTypeMap) return undefined;

    const itemType = getItemTypeByFolder(packageTypeMap, folderValue);

    if (!itemType) return undefined;

    // Find the item in the package with the matching type name
    return submissionPackage.items.find((item) => item.type.name === itemType)
      ?.id;
  };

  const handleMoveToFolder = async (folderValue: string) => {
    if (locked) return;
    setLocked(true);
    setMoveTarget(folderValue);

    const itemId = getItemFromFolder(folderValue);
    if (!itemId) {
      notify.error(`No item found for folder ${folderValue}`);
      setLocked(false);
      setMoveTarget(null);
      return;
    }

    try {
      const copyObjectResponse = await copyObject({
        relativeUrl: submissionToMove.submitted_document.url,
        destinationFolder: getSubmissionFolderName({
          projectName: accountProject?.project.name ?? "",
          sectionName: folderValue,
        }),
        filename: submissionToMove.submitted_document.name,
      });

      if (copyObjectResponse.status !== "success") {
        notify.error(
          `Failed to move submission to folder ${folderValue}: ${copyObjectResponse.message}`,
        );
        return;
      }

      await moveSubmission({
        submissionId: submissionToMove.id,
        destinationItemId: itemId,
        newPath: copyObjectResponse.new_relative_url ?? "",
      });

      setSelectedFolder(null);
    } catch (error) {
      console.error("Error moving submission:", error);
    } finally {
      setLocked(false);
      setMoveTarget(null);
      refetch();
    }
  };

  if (selectedFolder) {
    return (
      <Stack direction="column" spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            size="small"
            onClick={() => setSelectedFolder(null)}
            aria-label="Back to folders"
            sx={{ marginRight: 1 }}
            disabled={locked}
          >
            <ChevronLeftIcon />
          </IconButton>

          <Typography variant="subtitle1">{selectedFolder.label}</Typography>
        </Box>
        <Box sx={{ padding: 2, border: "1px solid #ccc", borderRadius: 1 }}>
          {filteredSubmissions?.length ? (
            <Stack direction="column" spacing={1}>
              {filteredSubmissions.map((submission) => (
                <Stack
                  key={submission.id}
                  direction={"row"}
                  justifyContent={"space-between"}
                  spacing={1}
                >
                  <Stack
                    key={submission.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <InsertDriveFileIcon />
                    <Typography variant="body2" style={{ marginLeft: 8 }}>
                      {submission.submitted_document.name}
                    </Typography>
                  </Stack>
                  <div
                    key={submission.id}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {moveTarget === submission.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Chip
                        label="Move on Top"
                        disabled={locked}
                        onClick={() => {
                          handleOnTopOfExistingSubmission(submission.id);
                        }}
                        sx={{
                          borderRadius: 10,
                        }}
                      />
                    )}
                  </div>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body1" style={{ marginLeft: 8 }}>
              No documents in this folder.
            </Typography>
          )}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack direction={"column"} spacing={2}>
      {folders.map((folder) => (
        <Stack
          key={folder.value}
          direction={"row"}
          justifyContent={"space-between"}
          spacing={1}
        >
          <div
            key={folder.value}
            style={{ display: "flex", alignItems: "center" }}
          >
            <FolderIcon />
            <Typography variant="body1" style={{ marginLeft: 8 }}>
              {folder.label}
            </Typography>
          </div>
          <div
            key={folder.value}
            style={{ display: "flex", alignItems: "center" }}
          >
            {moveTarget === folder.value ? (
              <CircularProgress size={20} />
            ) : (
              <Chip
                label="Move"
                disabled={locked}
                onClick={() => {
                  handleMoveToFolder(folder.value);
                }}
                sx={{
                  borderRadius: 10,
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={() => setSelectedFolder(folder)}
              sx={{ marginLeft: 1 }}
              disabled={locked}
            >
              <ChevronRightIcon />
            </IconButton>
          </div>
        </Stack>
      ))}
    </Stack>
  );
};
