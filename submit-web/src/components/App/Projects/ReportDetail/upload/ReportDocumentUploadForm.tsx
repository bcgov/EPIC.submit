import { ReactNode, useRef, useState } from "react";
import { Box, Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import BarTitle, { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { PROJECT_STATUS } from "@/components/Shared/ProjectStatus/constants";
import { AccountProject } from "@/models/Project";
import { ProjectReport } from "@/models/Package";
import { formatReportPageTitle } from "../reportTitle";
import {
  getPrimaryUploadLabel,
  PRIMARY_ACCEPTED_FILE_TYPES,
  PRIMARY_UPLOAD_CRITERIA,
  SUPPORTING_ACCEPTED_FILE_TYPES,
  SUPPORTING_UPLOAD_DESCRIPTION,
} from "../reportUpload";
import { ReportUploadSection, StagedFile } from "./ReportUploadSection";

let stagedIdCounter = 0;
const nextStagedId = () => `staged-${(stagedIdCounter += 1)}`;

export type ReportUploadSubmission = {
  primaryFiles: StagedFile[];
  supportingFiles: StagedFile[];
};

type ReportDocumentUploadFormProps = {
  accountProject: AccountProject;
  report: ProjectReport;
  // Name shown in each staged file's "Uploaded by" column.
  uploadedByName: string;
  // Label of the final action button, e.g. "Submit to EAO" or "Add Documents".
  submitLabel: string;
  // Extra content rendered above the upload sections (e.g. a Date Received field).
  beforeSections?: ReactNode;
  // Extra validation that runs before the file check. Return false to stop the
  // submit; the caller is responsible for showing its own error and moving focus.
  validate?: () => boolean;
  // Called with the staged files once validation passes. The caller handles its
  // own errors (the form keeps the files listed either way) and navigates on success.
  onSubmit: (submission: ReportUploadSubmission) => Promise<void>;
  onCancel: () => void;
};

/**
 * The "Document(s) Upload" page body shared by the Regulated Party and EAO
 * report/notification add-document pages: the project card, a primary and a
 * supporting upload section with Remove, the "Please upload a document."
 * validation, and Cancel / final action buttons.
 */
export const ReportDocumentUploadForm = ({
  accountProject,
  report,
  uploadedByName,
  submitLabel,
  beforeSections,
  validate,
  onSubmit,
  onCancel,
}: ReportDocumentUploadFormProps) => {
  const [primaryFiles, setPrimaryFiles] = useState<StagedFile[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<StagedFile[]>([]);
  const [primaryError, setPrimaryError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryDropZoneRef = useRef<HTMLDivElement>(null);

  const addPrimaryFiles = (files: File[]) => {
    setPrimaryError(false);
    setPrimaryFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ id: nextStagedId(), file })),
    ]);
  };
  const addSupportingFiles = (files: File[]) => {
    setSupportingFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ id: nextStagedId(), file })),
    ]);
  };

  const handleSubmit = async () => {
    const extraFieldsValid = validate ? validate() : true;
    const hasPrimaryFile = primaryFiles.length > 0;
    setPrimaryError(!hasPrimaryFile);
    if (!extraFieldsValid) {
      return;
    }
    if (!hasPrimaryFile) {
      primaryDropZoneRef.current?.focus();
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit({ primaryFiles, supportingFiles });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageGrid>
      <Grid size={12}>
        <ContentBox
          mainLabel={accountProject.project?.name}
          topLabel={accountProject.project?.proponent?.name || ""}
          bottomLabel={
            accountProject.project?.ea_certificate
              ? `EAC # ${accountProject.project.ea_certificate}`
              : ""
          }
        >
          <Box
            sx={{
              padding: BCDesignTokens.layoutPaddingMedium,
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            <SubmissionTitle
              sx={{ pb: BCDesignTokens.layoutPaddingSmall }}
              customTitle="Reports & Recurring Submissions"
              customStatus={PROJECT_STATUS.POST_DECISION}
            />
            <Box
              sx={{
                pt: BCDesignTokens.layoutPaddingSmall,
                pb: BCDesignTokens.layoutPaddingMedium,
                px: BCDesignTokens.layoutPaddingMedium,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: BCDesignTokens.layoutPaddingMedium,
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              }}
            >
              <BarTitle title={formatReportPageTitle(report)} />
              <Box sx={{ width: "100%" }}>
                <BarBlueTitle title="Document(s) Upload" bold={false} />
              </Box>

              {beforeSections}

              <ReportUploadSection
                heading={getPrimaryUploadLabel(report.report_type)}
                description={PRIMARY_UPLOAD_CRITERIA}
                acceptedFileTypes={PRIMARY_ACCEPTED_FILE_TYPES}
                uploadedByName={uploadedByName}
                files={primaryFiles}
                onAddFiles={addPrimaryFiles}
                onRemoveFile={(id) =>
                  setPrimaryFiles((prev) => prev.filter((f) => f.id !== id))
                }
                error={primaryError}
                dropZoneRef={primaryDropZoneRef}
              />

              <ReportUploadSection
                heading="Upload Supporting Documents"
                description={SUPPORTING_UPLOAD_DESCRIPTION}
                acceptedFileTypes={SUPPORTING_ACCEPTED_FILE_TYPES}
                uploadedByName={uploadedByName}
                files={supportingFiles}
                onAddFiles={addSupportingFiles}
                onRemoveFile={(id) =>
                  setSupportingFiles((prev) => prev.filter((f) => f.id !== id))
                }
              />

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button color="secondary" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} loading={isSubmitting}>
                  {submitLabel}
                </Button>
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
};
