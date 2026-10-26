import { useMemo, useRef, useState } from "react";
import { Box, Grid } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  notFound,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { BCDesignTokens } from "epic.theme";
import { isAxiosError } from "axios";
import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { PROJECT_STATUS } from "@/components/Shared/ProjectStatus/constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  getSubmissionPackageQueryOptions,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { getOrCreateCurrentUser } from "@/hooks/api/useAccounts";
import { saveObject, S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { createSubmission } from "@/hooks/api/useSubmissions";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { PACKAGE_STATUS } from "@/models/Package";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { QUERY_KEY } from "@/hooks/api/constants";
import { HTTP_STATUS } from "@/utils/constants";
import { formatReportPageTitle } from "@/components/App/Projects/ReportDetail/reportTitle";
import { camelCase } from "lodash";
import {
  getPrimaryUploadLabel,
  PRIMARY_ACCEPTED_FILE_TYPES,
  SUPPORTING_ACCEPTED_FILE_TYPES,
  PRIMARY_UPLOAD_CRITERIA,
  SUPPORTING_UPLOAD_DESCRIPTION,
  SUBMIT_SUCCESS_MESSAGE,
  SUBMIT_FAILURE_MESSAGE,
} from "@/components/App/Projects/ReportDetail/reportUpload";
import {
  ReportUploadSection,
  StagedFile,
} from "@/components/App/Projects/ReportDetail/upload/ReportUploadSection";

const ROUTE_ID =
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/reports/$reportPackageId/add-document";

const PendingComponent = () => (
  <PageGrid>
    <Grid size={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

export const Route = createFileRoute(ROUTE_ID)({
  component: ReportAddDocumentPage,
  loader: ({ context: { queryClient }, params: { reportPackageId } }) =>
    queryClient.ensureQueryData(
      getSubmissionPackageQueryOptions({ packageId: Number(reportPackageId) }),
    ),
  onError: (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === HTTP_STATUS.NOT_FOUND
    ) {
      throw notFound();
    }
    throw error;
  },
  pendingMs: 0,
  pendingComponent: PendingComponent,
  head: ({ loaderData: reportPackage, params }) => ({
    meta: [
      {
        title: formatReportPageTitle(reportPackage?.project_report),
        path: `/proponent/projects/${params.projectId}/reports/${params.reportPackageId}/add-document`,
      },
    ],
  }),
});

let stagedIdCounter = 0;
const nextStagedId = () => `staged-${(stagedIdCounter += 1)}`;

function ReportAddDocumentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId: accountProjectIdParam, reportPackageId } = useParams({
    from: ROUTE_ID,
  });
  const accountProjectId = Number(accountProjectIdParam);
  const packageId = Number(reportPackageId);

  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectQueryOptions(accountProjectId),
  );
  const { data: reportPackage } = useSuspenseQuery(
    getSubmissionPackageQueryOptions({ packageId }),
  );

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getOrCreateCurrentUser,
    staleTime: Infinity,
  });
  const uploadedByName = currentUser?.account_user?.full_name ?? "";

  const { mutateAsync: updatePackageState } = useUpdateStateSubmissionPackage();

  const [primaryFiles, setPrimaryFiles] = useState<StagedFile[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<StagedFile[]>([]);
  const [primaryError, setPrimaryError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryDropZoneRef = useRef<HTMLDivElement>(null);

  const report = reportPackage?.project_report;

  const reportItemId = useMemo(() => reportPackage?.items?.[0]?.id, [
    reportPackage,
  ]);

  const projectName = useMemo(
    () => camelCase(accountProject?.project?.name ?? ""),
    [accountProject],
  );

  if (!accountProject || !reportPackage || !report) {
    return <Navigate to="/error" />;
  }

  const pageTitle = formatReportPageTitle(report);
  const primaryLabel = getPrimaryUploadLabel(report.report_type);

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

  const uploadSection = async (staged: StagedFile[], folderKey: string) => {
    const folderPath = getSubmissionFolderName({
      projectName,
      sectionName: folderKey,
    });
    for (const { file } of staged) {
      const url = await saveObject({
        file,
        fileDetails: { filename: file.name, folder: folderPath },
      });
      await createSubmission(Number(reportItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: { name: file.name, url, folder: folderKey },
      });
    }
  };

  const handleCancel = () => {
    navigate({
      to: "/proponent/projects/$projectId/reports/$reportPackageId",
      params: { projectId: accountProjectIdParam, reportPackageId },
    });
  };

  const handleSubmit = async () => {
    if (primaryFiles.length === 0) {
      setPrimaryError(true);
      primaryDropZoneRef.current?.focus();
      return;
    }
    if (!reportItemId) {
      notify.error(SUBMIT_FAILURE_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      // Upload every staged file first; only flip the package to SUBMITTED
      // once all uploads succeed so a mid-way failure leaves nothing partial.
      await uploadSection(primaryFiles, S3_FOLDER.REPORTS.value);
      await uploadSection(
        supportingFiles,
        S3_FOLDER.REPORT_SUPPORTING_DOCUMENTS.value,
      );
      await updatePackageState({
        packageId,
        data: { status: PACKAGE_STATUS.SUBMITTED.value },
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
      });
      notify.success(SUBMIT_SUCCESS_MESSAGE, 15000);
      navigate({
        to: "/proponent/projects/$projectId/reports/$reportPackageId",
        params: { projectId: accountProjectIdParam, reportPackageId },
      });
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? SUBMIT_FAILURE_MESSAGE)
        : SUBMIT_FAILURE_MESSAGE;
      notify.error(message);
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
              <BarTitle title={pageTitle} />
              <Box sx={{ width: "100%" }}>
                <BarBlueTitle title="Document(s) Upload" bold={false} />
              </Box>

              <ReportUploadSection
                heading={primaryLabel}
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
                <Button color="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} loading={isSubmitting}>
                  Submit to EAO
                </Button>
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
