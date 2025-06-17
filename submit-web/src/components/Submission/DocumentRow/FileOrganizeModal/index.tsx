import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { modalStyle } from "@/components/Shared/Modals/constants";
import { Submission } from "@/models/Submission";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { useMemo } from "react";
import { NEW_PACKAGE_TYPE_S3_FOLDER_MAP } from "@/hooks/api/useObjectStorage";
import { FoldersList } from "./FoldersList";
import { getSubmittedDocumentsByPackageIdForStaffQueryOptions } from "@/hooks/api/useSubmittedDocuments";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";

type UpdateModalProps = {
  submission: Submission;
  submissionPackageId: string;
  accountProjectId: string;
};

const FileOrganizeModal = ({
  submission,
  submissionPackageId,
  accountProjectId,
}: UpdateModalProps) => {
  const { setClose } = useModal();

  const { data: submissionPackage } = useSuspenseQuery(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }),
  );

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery(
    getSubmittedDocumentsByPackageIdForStaffQueryOptions({
      packageId: submissionPackageId,
    }),
  );

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectForStaffQueryOptions(Number(accountProjectId)).queryKey,
  );

  const folders = useMemo(() => {
    if (!submissionPackage) return [];

    const packageTypeFolders =
      NEW_PACKAGE_TYPE_S3_FOLDER_MAP[submissionPackage.type.name];
    if (!packageTypeFolders) return [];

    const folders = Object.values(packageTypeFolders).flatMap(
      (itemTypeFolders) => itemTypeFolders,
    );
    return folders ?? [];
  }, [submissionPackage]);

  const isLoading = isSubmissionsLoading;

  return (
    <Box sx={{ ...modalStyle, width: "450px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle>
          Move "
          <Box
            component="span"
            sx={{
              maxWidth: 280,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "inline-block",
              verticalAlign: "bottom",
            }}
            title={submission.submitted_document.name}
          >
            {submission.submitted_document.name}
          </Box>
          "
        </DialogTitle>
        <IconButton onClick={setClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          <FoldersList
            folders={folders}
            submissions={submissions}
            submissionToMove={submission}
            submissionPackage={submissionPackage}
            accountProject={accountProject}
          />
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button onClick={setClose} color="primary" sx={{ mr: 1 }}>
          Close
        </Button>
      </DialogActions>
    </Box>
  );
};

export default FileOrganizeModal;
