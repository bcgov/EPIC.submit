import {
  Button,
  CircularProgress,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { useReplaceSubmussion } from "@/hooks/api/useSubmissions";
import { useParams } from "@tanstack/react-router";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { QUERY_KEY } from "@/hooks/api/constants";
import { useQueryClient } from "@tanstack/react-query";
import { VisuallyHiddenInput } from "@/components/Shared/VisuallyHiddenInput";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
}>;

export default function Row({ documentSubmission }: DocumentRowProps) {
  const { submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [isReplacingDocument, setIsReplacingDocument] = useState(false);
  const [currentSubmission, setCurrentSubmission] =
    useState<Submission>(documentSubmission);

  const { mutateAsync: replaceSubmission } = useReplaceSubmussion({
    onSuccess: (newSubmission) => {
      setCurrentSubmission(newSubmission);
      notify.success("Document replaced successfully");
    },
    onError: () => {
      notify.error("Failed to replace document");
    },
    submissionPackageId: Number(submissionPackageId),
  });

  const queryClient = useQueryClient();

  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = currentSubmission;

  const downloadDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };

  const openDocument = () => {
    downloadDocument();
  };

  const replaceDocument = async (files: FileList | null) => {
    console.log("called replaceDocument");
    if (!files || files.length === 0) {
      console.log("no files");
      return;
    }
    const fileToUpload = files[0];
    try {
      setIsReplacingDocument(true);
      const uploadedFile = await saveObject({
        file: fileToUpload,
        fileDetails: {
          filename: fileToUpload.name,
        },
      });

      await replaceSubmission({
        submissionId: currentSubmission.id,
        data: {
          name: fileToUpload.name,
          url: uploadedFile.filepath,
        },
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackageId],
      });
    } catch (e) {
      notify.error("Failed to replace document");
    } finally {
      setIsReplacingDocument(false);
    }
  };

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
          <MuiLink onClick={openDocument}>{name}</MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
      <SubmitTableCell align="right">{version}</SubmitTableCell>
      <SubmitTableCell align="right">
        {isReplacingDocument ? (
          <CircularProgress size={20} />
        ) : (
          <Button
            component="label"
            role={undefined}
            variant="text"
            tabIndex={-1}
          >
            Replace
            <VisuallyHiddenInput
              type="file"
              onChange={(event) => replaceDocument(event.target.files)}
              multiple
            />
          </Button>
        )}
      </SubmitTableCell>
    </TableRow>
  );
}
