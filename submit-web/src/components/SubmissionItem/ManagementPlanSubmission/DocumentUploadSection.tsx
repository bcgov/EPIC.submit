import { useEffect } from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import DocumentContainer from "./DocumentContainer";
import { When } from "react-if";
import { Navigate, useParams } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import DocumentToUploadContainer from "../DocumentToUploadContainer";
import { ControlledFileUpload } from "@/components/Shared/controlled/ControlledFileUpload";
import { MANAGEMENT_PLAN_DOCUMENT_FOLDERS } from "./constants";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";

export const DocumentUploadSection = () => {
  const { submissionId: submissionItemId } = useParams({
    from: "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    "item",
    submissionItemId,
  ]);

  const { reset, handleAddDocuments, documents } = useDocumentUploadStore();

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
      </Grid>
      <When condition={Boolean(documentSubmissions?.length)}>
        <Grid
          container
          item
          xs={12}
          sx={{ mb: BCDesignTokens.layoutMarginXlarge }}
        >
          {managementPlanDocuments?.map((docSub) => (
            <DocumentContainer
              key={docSub.id}
              document={docSub.submitted_document}
            />
          ))}
        </Grid>
      </When>
      <Grid
        container
        item
        xs={12}
        sx={{ mb: BCDesignTokens.layoutMarginXlarge }}
      >
        {pendingManagementPlanDocuments.map((document) => (
          <DocumentToUploadContainer key={document.id} document={document} />
        ))}
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
      </Grid>
      <When condition={Boolean(documentSubmissions?.length)}>
        <Grid
          container
          item
          xs={12}
          sx={{ mb: BCDesignTokens.layoutMarginXlarge }}
        >
          {supportingDocuments?.map((docSub) => (
            <DocumentContainer
              key={docSub.id}
              document={docSub.submitted_document}
            />
          ))}
        </Grid>
      </When>
      <Grid
        container
        item
        xs={12}
        sx={{ mb: BCDesignTokens.layoutMarginXlarge }}
      >
        {pendingSupportingDocuments.map((document) => (
          <DocumentToUploadContainer key={document.id} document={document} />
        ))}
      </Grid>
    </Grid>
  );
};
