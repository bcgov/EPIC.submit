import {
  CircularProgress,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { useEffect, useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { S3_FOLDER, saveObject } from "@/hooks/api/useObjectStorage";
import { useCreateInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";
import { useParams } from "@tanstack/react-router";
import { INTERNAL_STAFF_DOCUMENT_TYPE, SUBMISSION_ITEM_TYPE, SubmissionItem } from "@/models/SubmissionItem";
import { useFileStore } from "@/store/fileStore";
import { useMounted } from "@/hooks/common";
import { useQueryClient } from "@tanstack/react-query";
import { AccountProject } from "@/models/Project";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { getSubmissionItemQueryOptions } from "@/hooks/api/useItems";
import { camelCase, get } from "lodash";

export type UploadObject = {
  id: number;
  file: File;
  folder?: string;
  pending?: boolean;
  submissionId?: number;
};

type RowProps = Readonly<{
  pendingDocument: UploadObject;
  numColumns?: number;
}>;

export default function PendingRow({
  pendingDocument,
  numColumns = 4,
}: RowProps) {
  const [pendingUpload, setPendingUpload] = useState(false);
  const {
    file: { name },
  } = pendingDocument;

  const { submissionPackageId, submissionId: submissionItemId, projectId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { completeFileUpload, removePendingFile } = useFileStore();

  const { mutateAsync: createInternalStaffDocument } =
    useCreateInternalStaffDocument({
      itemId: Number(submissionItemId),
      packageId: Number(submissionPackageId),
    });

  useMounted(() => {
    setPendingUpload(true);
  });

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey
  );
  const projectName = camelCase(accountProject?.project.name ?? "");

  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemQueryOptions({ itemId: Number(submissionItemId) }).queryKey
  );
  const folderMap = {
    [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: S3_FOLDER.CONSULTATION_RECORDS,
    [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: S3_FOLDER.MANAGEMENT_PLANS,
  };
  const submissionTypeName = submissionItem?.type?.name || "";
  const internalStaffSubFolder = get(folderMap, submissionTypeName, "");

  const uploadObject = async () => {
    try {
      const uploadedFile = await saveObject({
        file: pendingDocument.file,
        fileDetails: {
          filename: pendingDocument.file.name,
          folder: `${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.INTERNAL_STAFF_DOCUMENTS}/${internalStaffSubFolder}`,
        },
      });

      const documentData = {
        name: pendingDocument.file.name,
        url: uploadedFile,
        type: INTERNAL_STAFF_DOCUMENT_TYPE.S3,
      };
      const createdInternalStaff = await createInternalStaffDocument({
        submission_item_id: Number(submissionItemId),
        document: documentData,
      });

      completeFileUpload(pendingDocument.id, createdInternalStaff);
    } catch (error) {
      notify.error("Failed to upload document");
      removePendingFile(pendingDocument.id);
    }
  };

  useEffect(() => {
    if (pendingUpload) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUpload]);

  if (!accountProject) {
    notify.error("Failed to load project");
    return null;
  }

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
          <MuiLink>{name}</MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="left" colSpan={numColumns - 1}>
        <CircularProgress size={20} />
      </SubmitTableCell>
    </TableRow>
  );
}
