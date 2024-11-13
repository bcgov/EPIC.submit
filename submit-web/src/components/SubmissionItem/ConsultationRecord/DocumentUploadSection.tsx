import { useEffect } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import { When } from "react-if";
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
import { camelCase } from "change-case";

export const DocumentUploadSection = () => {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );

  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey,
  );

  const { reset, handleAddDocuments, documents } = useDocumentUploadStore();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleOnDrop = (acceptedFiles: File[]) => {
    handleAddDocuments(
      acceptedFiles[0],
      CONSULTATION_RECORD_DOCUMENT_FOLDERS.CONSULTATION_RECORDS,
    );
  };

  if (!submissionItemId) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  const documentSubmissions = submissionItem?.submissions.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );

  const documentSubmissionIds = documentSubmissions?.map(
    (submission) => submission.id,
  );

  const pendingDocuments = documents.filter(
    (document) =>
      !document.submissionId ||
      !documentSubmissionIds?.includes(document.submissionId),
  );

  const projectName = camelCase(accountProject?.project.name || "");

  if (!accountProject) {
    notify.error("Failed to load project");
    return null;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography
          variant="h5"
          fontWeight={400}
          sx={{ color: BCDesignTokens.typographyColorDisabled }}
        >
          Document(s) Upload
        </Typography>
        <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
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
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 250 MB.
        </Typography>
        <When
          condition={Boolean(
            documentSubmissions?.length || pendingDocuments?.length,
          )}
        >
          <Box my={BCDesignTokens.layoutMarginLarge}>
            <DocumentTable
              documents={documentSubmissions}
              pendingDocuments={pendingDocuments}
              header={"Consultation Record(s)"}
              folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.CONSULTATION_RECORDS}`}
            />
          </Box>
        </When>
      </Grid>
    </Grid>
  );
};
