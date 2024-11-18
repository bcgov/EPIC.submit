import {
  CircularProgress,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { StyledTableCell } from "@/components/Shared/Table/common";
import {
  UploadObject,
  useObjectUploadStore,
} from "@/store/documentUploadStore";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { S3_FOLDER, saveObject } from "@/hooks/api/useObjectStorage";
import { useCreateInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";
import { useParams } from "@tanstack/react-router";
import { INTERNAL_STAFF_DOCUMENT_TYPE } from "@/models/SubmissionItem";

type RowProps = {
  pendingDocument: UploadObject;
};

export default function PendingRow({ pendingDocument }: RowProps) {
  const {
    file: { name },
  } = pendingDocument;

  const { submissionPackageId, submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { triggerPending, removeObject, completeObject } =
    useObjectUploadStore();
  const { mutateAsync: createInternalStaffDocument } =
    useCreateInternalStaffDocument({
      itemId: Number(submissionItemId),
      packageId: Number(submissionPackageId),
    });

  useEffect(() => {
    triggerPending(pendingDocument.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadObject = async () => {
    try {
      const uploadedFile = await saveObject({
        file: pendingDocument.file,
        fileDetails: {
          filename: pendingDocument.file.name,
          folder: `${S3_FOLDER.INTERNAL_STAFF_DOCUMENTS}/${S3_FOLDER.MANAGEMENT_PLANS}`,
        },
      });

      const documentData = {
        name: pendingDocument.file.name,
        url: uploadedFile.filepath,
        type: INTERNAL_STAFF_DOCUMENT_TYPE.S3,
      };
      const createdInternalStaff = await createInternalStaffDocument({
        submission_item_id: Number(submissionItemId),
        document: documentData,
      });

      completeObject(pendingDocument.id, createdInternalStaff.id);
    } catch (error) {
      notify.error("Failed to upload document");
      removeObject(pendingDocument.id);
    }
  };

  useEffect(() => {
    if (pendingDocument.pending) {
      uploadObject();
    }
  }, [pendingDocument.pending, uploadObject]);

  return (
    <TableRow>
      <StyledTableCell>
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
      </StyledTableCell>
      <StyledTableCell align="left" colSpan={3}>
        <CircularProgress size={20} />
      </StyledTableCell>
    </TableRow>
  );
}
