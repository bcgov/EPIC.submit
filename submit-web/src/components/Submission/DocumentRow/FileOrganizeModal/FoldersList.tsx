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
import { useMemo, useState, useCallback } from "react";
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
import { useModal } from "@/components/Shared/Modals/modalStore";

type FoldersListProps = {
  folders: { value: string; label: string }[];
  submissions?: Submission[];
  submissionToMove: Submission;
  submissionPackage: SubmissionPackage;
  accountProject?: AccountProject;
};

const MoveChip = ({
  loading,
  label,
  disabled,
  onClick,
}: {
  loading: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) =>
  loading ? (
    <CircularProgress size={20} />
  ) : (
    <Chip
      label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{ borderRadius: 10 }}
    />
  );

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
  const { setClose } = useModal();

  const { mutateAsync: moveSubmission } = useMoveSubmission({
    packageId: Number(submissionPackage.id),
  });

  const { refetch } = useQuery(
    getStaffSubmissionPackageQueryOptions({
      packageId: submissionPackage.id,
    }),
  );

  const filteredSubmissions = useMemo(() => {
    if (!submissions || !selectedFolder) return submissions;
    return submissions.filter(
      (submission) =>
        submission.submitted_document.folder === selectedFolder.value &&
        submission.id !== submissionToMove.id, // Exclude the submission being moved
    );
  }, [submissions, selectedFolder, submissionToMove]);

  const getItemTypeByFolder = useCallback(
    (
      packageTypeMap: Record<string, { value: string; label: string }[]>,
      folderValue: string,
    ) => {
      for (const [itemType, folders] of Object.entries(packageTypeMap)) {
        if (folders.some((folder) => folder.value === folderValue)) {
          return itemType;
        }
      }
      return undefined;
    },
    [],
  );

  const getItemFromFolder = useCallback(
    (folderValue: string) => {
      if (!submissionPackage?.type || !folderValue) return undefined;
      const packageTypeMap =
        NEW_PACKAGE_TYPE_S3_FOLDER_MAP[submissionPackage.type.name];
      if (!packageTypeMap) return undefined;
      const itemType = getItemTypeByFolder(packageTypeMap, folderValue);
      if (!itemType) return undefined;
      return submissionPackage.items.find((item) => item.type.name === itemType)
        ?.id;
    },
    [submissionPackage, getItemTypeByFolder],
  );

  const handleMove = useCallback(
    async ({
      itemId,
      folderValue,
      targetSubmissionId,
    }: {
      itemId: number;
      folderValue: string;
      targetSubmissionId?: number;
    }) => {
      setLocked(true);
      setMoveTarget(targetSubmissionId ?? folderValue);

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
            "Failed to move submission" +
              (folderValue ? " to folder " + folderValue : "") +
              ": " +
              copyObjectResponse.message,
          );
          return;
        }

        await moveSubmission({
          submissionId: submissionToMove.id,
          destinationItemId: itemId,
          newPath: copyObjectResponse.new_relative_url ?? "",
          ...(targetSubmissionId ? { targetSubmissionId } : {}),
          destinationFolder: folderValue,
        });
        await refetch();

        setSelectedFolder(null);
        notify.success(
          `Submission moved successfully${
            folderValue ? " to folder " + folderValue : ""
          }`,
        );
      } catch (error) {
        notify.error(
          `Failed to move submission: ${isAxiosError(error) ? error.message : "Internal error"}`,
        );
      } finally {
        setLocked(false);
        setMoveTarget(null);
        setClose();
      }
    },
    [accountProject, moveSubmission, refetch, submissionToMove, setClose],
  );

  const handleOnTopOfExistingSubmission = async (
    targetSubmissionId: number,
  ) => {
    if (locked || !selectedFolder) return;
    const itemId = submissions?.find(
      (submission) => submission.id === targetSubmissionId,
    )?.item_id;
    if (!itemId) {
      notify.error("No item found for the target submission");
      return;
    }
    await handleMove({
      itemId,
      folderValue: selectedFolder.value,
      targetSubmissionId,
    });
  };

  const handleMoveToFolder = async (folderValue: string) => {
    if (locked) return;
    const itemId = getItemFromFolder(folderValue);
    if (!itemId) {
      notify.error(`No item found for folder ${folderValue}`);
      return;
    }
    await handleMove({ itemId, folderValue });
  };

  if (selectedFolder) {
    return (
      <Stack direction="column" spacing={2}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            size="small"
            onClick={() => setSelectedFolder(null)}
            aria-label="Back to folders"
            sx={{ mr: 1 }}
            disabled={locked}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1">{selectedFolder.label}</Typography>
        </Box>
        <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
          {filteredSubmissions?.length ? (
            <Stack direction="column" spacing={1}>
              {filteredSubmissions.map((submission) => (
                <Stack
                  key={submission.id}
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InsertDriveFileIcon />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {submission.submitted_document.name}
                    </Typography>
                  </Stack>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MoveChip
                      loading={moveTarget === submission.id}
                      label="Move on Top"
                      disabled={locked}
                      onClick={() =>
                        handleOnTopOfExistingSubmission(submission.id)
                      }
                    />
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body1" sx={{ ml: 1 }}>
              No documents in this folder.
            </Typography>
          )}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack direction="column" spacing={2}>
      {folders.map((folder) => (
        <Stack
          key={folder.value}
          direction="row"
          justifyContent="space-between"
          spacing={1}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FolderIcon />
            <Typography variant="body1" sx={{ ml: 1 }}>
              {folder.label}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MoveChip
              loading={moveTarget === folder.value}
              label="Move"
              disabled={locked}
              onClick={() => handleMoveToFolder(folder.value)}
            />
            <IconButton
              size="small"
              onClick={() => setSelectedFolder(folder)}
              sx={{ ml: 1 }}
              disabled={locked}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
};
