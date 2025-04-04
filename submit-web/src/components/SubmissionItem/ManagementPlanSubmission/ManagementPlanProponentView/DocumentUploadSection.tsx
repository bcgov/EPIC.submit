import { useCallback, useEffect } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { Navigate, useParams } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { ControlledFileUpload } from "@/components/Shared/controlled/ControlledFileUpload";
import { MANAGEMENT_PLAN_DOCUMENT_FOLDERS } from "./constants";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import DocumentTable from "@/components/DocumentUpload/DocumentTable";
import { QUERY_KEY } from "@/hooks/api/constants";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";
import { camelCase } from "lodash";
import { useFileStore } from "@/store/fileStore";

export const DocumentUploadSection = () => {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);

  const getDocumentSubmissions = useCallback(() => {
    if (!submissionItem) return [];
    return submissionItem.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT
    );
  }, [submissionItem]);

  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey
  );

  const { reset, files, addPendingFile, pendingFiles, initializeFiles } =
    useFileStore();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    initializeFiles(getDocumentSubmissions());
  }, [submissionItem, getDocumentSubmissions, initializeFiles]);

  const handleOnDrop = (acceptedFiles: File[], folder: string) => {
    addPendingFile(acceptedFiles[0], folder);
  };

  if (!submissionItemId) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  const managementPlanDocuments = files?.filter(
    (submission) =>
      submission.submitted_document.folder ===
      MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN
  );

  const supportingDocuments = files?.filter(
    (submission) =>
      submission.submitted_document.folder ===
      MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING
  );

  const pendingManagementPlanDocuments = pendingFiles.filter(
    (document) =>
      document.folder === MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN
  );

  const pendingSupportingDocuments = pendingFiles.filter(
    (document) =>
      document.folder === MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING
  );
  const projectName = camelCase(accountProject?.project.name ?? "");

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
            Upload Management Plan
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
          name="managementPlans"
          height={"13.125rem"}
          onDrop={(acceptedFiles) =>
            handleOnDrop(
              acceptedFiles,
              MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN
            )
          }
        />
        <Typography
          variant="body2"
          sx={{
            color: EAOColors.ProponentDark,
          }}
        >
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 250 MB.
        </Typography>

        <Box my={BCDesignTokens.layoutMarginLarge}>
          <DocumentTable
            header={"Management Plan"}
            documents={managementPlanDocuments}
            pendingDocuments={pendingManagementPlanDocuments}
            folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.MANAGEMENT_PLANS}/`}
            formFieldName={"managementPlans"}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ flexDirection: "column", display: "flex" }}>
          <Typography
            variant="body1"
            color={BCDesignTokens.typographyColorPrimary}
          >
            Upload Supporting Documents, as applicable
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.typographyColorPlaceholder,
            }}
          >
            e.g. table of proposed changes, table of concordance
          </Typography>
        </Box>
        <ControlledFileUpload
          name="supportingDocuments"
          height={"13.125rem"}
          onDrop={(acceptedFiles) =>
            handleOnDrop(
              acceptedFiles,
              MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING
            )
          }
        />
        <Typography
          variant="body2"
          sx={{
            color: EAOColors.ProponentDark,
          }}
        >
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 250 MB.
        </Typography>

        <Box my={BCDesignTokens.layoutMarginLarge}>
          <DocumentTable
            header={"Supporting Documents"}
            formFieldName={"supportingDocuments"}
            documents={supportingDocuments}
            pendingDocuments={pendingSupportingDocuments}
            folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.MANAGEMENT_PLANS}/${S3_FOLDER.SUPPORTING_DOCUMENTS}/`}
          />
        </Box>
      </Grid>
    </Grid>
  );
};
