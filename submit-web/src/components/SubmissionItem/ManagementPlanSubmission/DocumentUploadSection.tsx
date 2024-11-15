import { useEffect } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useObjectUploadStore } from "@/store/documentUploadStore";
import { When } from "react-if";
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
import { camelCase } from "change-case";

export const DocumentUploadSection = () => {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);

  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey,
  );

  const {
    reset,
    handleAddObjects: handleAddDocuments,
    uploadObjects: documents,
  } = useObjectUploadStore();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleOnDrop = (acceptedFiles: File[], folder: string) => {
    handleAddDocuments(acceptedFiles[0], folder);
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

  const managementPlanDocuments = documentSubmissions?.filter(
    (submission) =>
      submission.submitted_document.folder ===
      MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN,
  );

  const supportingDocuments = documentSubmissions?.filter(
    (submission) =>
      submission.submitted_document.folder ===
      MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING,
  );

  const pendingDocuments = documents.filter(
    (document) =>
      !document.submissionId ||
      !documentSubmissionIds?.includes(document.submissionId),
  );

  const pendingManagementPlanDocuments = pendingDocuments.filter(
    (document) =>
      document.folder === MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN,
  );

  const pendingSupportingDocuments = pendingDocuments.filter(
    (document) =>
      document.folder === MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING,
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
              MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN,
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

        <When
          condition={Boolean(
            managementPlanDocuments?.length ||
              pendingManagementPlanDocuments?.length,
          )}
        >
          <Box my={BCDesignTokens.layoutMarginLarge}>
            <DocumentTable
              header={"Management Plan"}
              documents={managementPlanDocuments}
              pendingDocuments={pendingManagementPlanDocuments}
              folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.MANAGEMENT_PLANS}`}
            />
          </Box>
        </When>
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
              MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING,
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

        <When
          condition={Boolean(
            supportingDocuments?.length || pendingSupportingDocuments?.length,
          )}
        >
          <Box my={BCDesignTokens.layoutMarginLarge}>
            <DocumentTable
              header={"Supporting Documents"}
              documents={supportingDocuments}
              pendingDocuments={pendingSupportingDocuments}
              folder={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${S3_FOLDER.MANAGEMENT_PLANS}/${S3_FOLDER.SUPPORTING_DOCUMENTS}`}
            />
          </Box>
        </When>
      </Grid>
    </Grid>
  );
};
