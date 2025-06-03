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
import { PACKAGE_TYPE_S3_FOLDER_MAP } from "@/hooks/api/useObjectStorage";
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

  // const { data: accountProject, isLoading: isAccountProjectLoading } = useQuery(
  //   getAccountProjectForStaffQueryOptions(Number(accountProjectId)),
  // );

  const queryClient = useQueryClient();
  console.log("accountProjectId", accountProjectId);
  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectForStaffQueryOptions(Number(accountProjectId)).queryKey,
  );

  console.log("accountProject", accountProject);

  const folders = useMemo(() => {
    if (!submissionPackage) return [];

    if (
      !Object.keys(PACKAGE_TYPE_S3_FOLDER_MAP).includes(
        submissionPackage.type.name,
      )
    ) {
      return [];
    }

    return PACKAGE_TYPE_S3_FOLDER_MAP[submissionPackage.type.name];
  }, [submissionPackage]);

  const isLoading = isSubmissionsLoading;

  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <DialogTitle>Move "{submission.submitted_document.name}"</DialogTitle>
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
