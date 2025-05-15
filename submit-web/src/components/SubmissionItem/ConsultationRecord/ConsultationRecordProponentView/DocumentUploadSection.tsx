import { useCallback, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { Navigate, useParams } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { ControlledFileUpload } from "@/components/Shared/controlled/ControlledFileUpload";
import { CONSULTATION_RECORD_DOCUMENT_FOLDERS } from "./constants";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import DocumentTable from "@/components/DocumentUpload/DocumentTable";
import { getSubmissionItemQueryOptions } from "@/hooks/api/useItems";
import { AccountProject } from "@/models/Project";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { camelCase } from "lodash";
import { useFileStore } from "@/store/fileStore";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";

export const DocumentUploadSection = () => {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );
  const getDocumentSubmissions = useCallback(() => {
    if (!submissionItem) return [];
    return submissionItem.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    );
  }, [submissionItem]);

  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey,
  );

  const { reset, addPendingFile, initializeFiles, files, pendingFiles } =
    useFileStore();

  useEffect(() => {
    initializeFiles(getDocumentSubmissions());
  }, [submissionItem, initializeFiles, getDocumentSubmissions]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleOnDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    addPendingFile(
      file,
      CONSULTATION_RECORD_DOCUMENT_FOLDERS.CONSULTATION_RECORDS,
    );
  };

  if (!submissionItemId) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  const projectName = camelCase(accountProject?.project.name ?? "");

  if (!accountProject) {
    notify.error("Failed to load project");
    return null;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <BarBlueTitle title="Document(s) Upload" />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ flexDirection: "column", display: "flex" }}>
          <Typography
            variant="body1"
            color={BCDesignTokens.typographyColorPrimary}
          >
            Upload Consultation Record(s), Including Comment Tracker
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.typographyColorPlaceholder,
            }}
          >
            Must be unlocked PDF document (i.e., not password protected).
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.typographyColorPlaceholder,
            }}
          >
            Any proposed changes must be in tracked changes.
          </Typography>
        </Box>
        <ControlledFileUpload
          name="consultationRecords"
          height={"13.125rem"}
          onDrop={handleOnDrop}
        />
        <Typography
          variant="body2"
          sx={{
            color: EAOColors.ProponentDark,
          }}
        >
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 500 MB.
        </Typography>
        <Box my={BCDesignTokens.layoutMarginLarge}>
          <DocumentTable
            documents={files}
            pendingDocuments={pendingFiles}
            header={"Consultation Record(s)"}
            folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.CONSULTATION_RECORDS}/`}
            formFieldName={"consultationRecords"}
          />
        </Box>
      </Grid>
    </Grid>
  );
};
