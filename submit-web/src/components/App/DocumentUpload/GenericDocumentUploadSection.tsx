import { useCallback, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { Navigate, useParams } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { ControlledFileUpload } from "@/components/Shared/ControlledFormFields/ControlledFileUpload";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import DocumentTable from "@/components/App/DocumentUpload/DocumentTable";
import { QUERY_KEY } from "@/hooks/api/constants";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";
import { camelCase } from "lodash";
import { useFileStore } from "@/store/fileStore";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { DEFAULT_ACCEPTED_FILE_TYPES, EXTENSION_TO_MIME_TYPE_MAP } from "@/utils/constants";
import { Accept } from "react-dropzone";

export interface UploadSectionConfig {
  name: string;
  label: string;
  folder: string;
  maxFiles?: number;
  maxFilesErrorMessage?: string;
  description?: string;
  acceptedFileTypes?: string[];
  acceptedFileTypesCriteria?: string;
}

interface GenericDocumentUploadSectionProps {
  sections: UploadSectionConfig[];
  title?: string;
}

export const GenericDocumentUploadSection: React.FC<
  GenericDocumentUploadSectionProps
> = ({ sections, title = "Document(s) Upload" }) => {
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
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    );
  }, [submissionItem]);

  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey,
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
    acceptedFiles.forEach((file) => {
      addPendingFile(file, folder);
    });
  };

  const projectName = useMemo(
    () => camelCase(accountProject?.project.name ?? ""),
    [accountProject],
  );

  const acceptedFileTypes = useMemo(() => {
    return (
      sections.map((section) => section.acceptedFileTypes || []).flat()
    ).length > 0 
      ? sections.map((section) => section.acceptedFileTypes || []).flat() 
      : DEFAULT_ACCEPTED_FILE_TYPES;
  }, [sections]);

  const fileUploadAccept = useMemo(() => {
    const acceptObj: Accept = {};
    
    acceptedFileTypes.forEach((ext) => {
      const cleanExt = ext.replace(/^\./, '').toLowerCase(); // remove leading dot if any
      const mimeTypes = EXTENSION_TO_MIME_TYPE_MAP[cleanExt] || ["application/octet-stream"]; // fallback
      
      mimeTypes.forEach((mime) => {
        if (!acceptObj[mime]) {
          acceptObj[mime] = [];
        }
        if (!acceptObj[mime].includes(`.${cleanExt}`)) {
          acceptObj[mime].push(`.${cleanExt}`);
        }
      });
    });

    return acceptObj;
  }, [acceptedFileTypes]);

  if (!submissionItemId) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  if (!accountProject) {
    notify.error("Failed to load project");
    return null;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <BarBlueTitle title={title} bold={false} />
      </Grid>
      {sections.map((section) => {
        const sectionDocuments = files?.filter(
          (submission) =>
            submission.submitted_document?.folder === section.folder,
        );
        const pendingSectionDocuments = pendingFiles.filter(
          (document) => document.folder === section.folder,
        );

        return (
          <Grid item xs={12} key={section.name}>
            <Box sx={{ flexDirection: "column", display: "flex" }}>
              <Typography
                variant="body1"
                color={BCDesignTokens.typographyColorPrimary}
                fontWeight={700}
                mt={BCDesignTokens.layoutMarginMedium}
              >
                Upload {section.label}
              </Typography>
              {section.description ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: BCDesignTokens.typographyColorPlaceholder,
                  }}
                >
                  {section.description}
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      color: BCDesignTokens.typographyColorPlaceholder,
                    }}
                  >
                    {section.acceptedFileTypesCriteria ||
                      "Must be unlocked PDF document (i.e., not password protected)."}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: BCDesignTokens.typographyColorPlaceholder,
                    }}
                  >
                    Any proposed changes must be in tracked changes.
                  </Typography>
                </>
              )}
            </Box>
            <ControlledFileUpload
              name={section.name}
              height={"13.125rem"}
              onDrop={(acceptedFiles) =>
                handleOnDrop(acceptedFiles, section.folder)
              }
              maxFiles={section.maxFiles}
              maxFilesErrorMessage={section.maxFilesErrorMessage}
              accept={fileUploadAccept}
            />
            <Typography
              variant="body2"
              sx={{
                color: EAOColors.ProponentDark,
              }}
            >
              Accepted file types: {acceptedFileTypes.join(", ")}. Max file
              size: 500 MB.
            </Typography>

            <Box my={BCDesignTokens.layoutMarginLarge}>
              <DocumentTable
                header={section.label}
                documents={sectionDocuments}
                pendingDocuments={pendingSectionDocuments}
                folder={getSubmissionFolderName({
                  projectName: projectName,
                  sectionName: section.folder,
                })}
                formFieldName={section.name}
              />
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};
