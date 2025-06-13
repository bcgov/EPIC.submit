import {
  CircularProgress,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { useEffect, useMemo, useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { S3_FOLDER, saveObject } from "@/hooks/api/useObjectStorage";
import { useCreateInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";
import { useParams } from "@tanstack/react-router";
import { INTERNAL_STAFF_DOCUMENT_TYPE } from "@/models/SubmissionItem";
import { useFileStore } from "@/store/fileStore";
import { useMounted } from "@/hooks/common";
import { useQueryClient } from "@tanstack/react-query";
import { AccountProject } from "@/models/Project";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { camelCase } from "lodash";
import { isAxiosError } from "axios";

export type UploadObject = {
  id: number;
  file: File;
  folder?: string;
  pending?: boolean;
};

type RowProps = Readonly<{
  pendingDocument: UploadObject;
}>;

export default function PendingRow({ pendingDocument }: RowProps) {
  const [pendingUpload, setPendingUpload] = useState(false);
  const {
    file: { name },
  } = pendingDocument;

  const { submissionPackageId, projectId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/internal-documents/",
  });

  const { completeFileUpload, removePendingFile, pendingFiles } =
    useFileStore();

  // pending file with smallest id
  const firstPendingFile = useMemo(() => {
    return pendingFiles.reduce(
      (prev, current) => (prev.id < current.id ? prev : current),
      pendingFiles[0] ?? { id: Infinity }
    );
  }, [pendingFiles]);

  const { mutateAsync: createInternalStaffDocument } =
    useCreateInternalStaffDocument({
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

  const uploadObject = async () => {
    try {
      const uploadedFile = await saveObject({
        file: pendingDocument.file,
        fileDetails: {
          filename: pendingDocument.file.name,
          folder: `${S3_FOLDER.SUBMISSIONS.value}/${projectName}/${S3_FOLDER.INTERNAL_STAFF_DOCUMENTS.value}`,
        },
      });

      const documentData = {
        name: pendingDocument.file.name,
        url: uploadedFile,
        type: INTERNAL_STAFF_DOCUMENT_TYPE.S3,
      };
      const createdInternalStaff = await createInternalStaffDocument({
        package_id: Number(submissionPackageId),
        document: documentData,
      });

      completeFileUpload(pendingDocument.id, createdInternalStaff);
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message || "Failed to upload document"
        : "Failed to upload document";
      notify.error(errorMessage);
      removePendingFile(pendingDocument.id);
    }
  };

  useEffect(() => {
    if (firstPendingFile.id === pendingDocument.id && pendingUpload) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUpload, firstPendingFile]);

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
      <SubmitTableCell align="left" colSpan={4}>
        <CircularProgress size={20} />
      </SubmitTableCell>
    </TableRow>
  );
}
