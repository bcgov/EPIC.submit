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

type FoldersListProps = {
  folders: { value: string; label: string }[];
  submissions?: Submission[];
};
export const FoldersList = ({ folders, submissions }: FoldersListProps) => {
  const [selectedFolder, setSelectedFolder] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [locked, setLocked] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string | number | null>(null);

  console.log(submissions);
  console.log(selectedFolder);

  const filteredSubmissions = useMemo(() => {
    if (!submissions || !selectedFolder) return submissions;

    return submissions.filter(
      (submission) =>
        submission.submitted_document.folder === selectedFolder.value,
    );
  }, [submissions, selectedFolder]);

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
                          if (locked) return;
                          setLocked(true);
                          setMoveTarget(submission.id);
                          // Logic to move the document to the top
                          // After moving, reset the locked state
                          setTimeout(() => {
                            setLocked(false);
                            setMoveTarget(null);
                          }, 1000);
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
                  if (locked) return;
                  setLocked(true);
                  setMoveTarget(folder.value);
                  // Logic to move the document to the top
                  // After moving, reset the locked state
                  setTimeout(() => {
                    setLocked(false);
                    setMoveTarget(null);
                    setSelectedFolder(null);
                  }, 1000);
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
