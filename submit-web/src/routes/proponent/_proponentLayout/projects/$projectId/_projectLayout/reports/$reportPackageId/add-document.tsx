import { UploadDestination } from "@/models/documentUploadConfig";
import { S3_FOLDER } from "@/models/documentUploadConfig";
import { useMemo } from "react";
import { Grid } from "@mui/material";
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
import { isAxiosError } from "axios";
import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  getSubmissionPackageQueryOptions,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { getOrCreateCurrentUser } from "@/hooks/api/useAccounts";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { createDocumentSubmission } from "@/hooks/api/useSubmissions";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { PACKAGE_STATUS } from "@/models/Package";
import { QUERY_KEY } from "@/hooks/api/constants";
import { HTTP_STATUS } from "@/utils/constants";
import { camelCase } from "lodash";
import {
  SUBMIT_SUCCESS_MESSAGE,
  SUBMIT_FAILURE_MESSAGE,
} from "@/components/App/Projects/ReportDetail/reportUpload";
import { StagedFile } from "@/components/App/Projects/ReportDetail/upload/ReportUploadSection";
import {
  ReportDocumentUploadForm,
  ReportUploadSubmission,
} from "@/components/App/Projects/ReportDetail/upload/ReportDocumentUploadForm";

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
  // The report-name breadcrumb is owned by the parent layout route
  // ($reportPackageId.tsx) and renders as a link. This leaf adds only its
  // own "Add Document" crumb for the current page.
  head: () => ({
    meta: [{ title: "Add Document" }],
  }),
});

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

  const uploadSection = async (
    staged: StagedFile[],
    destination: UploadDestination,
  ) => {
    const folderPath = getSubmissionFolderName({
      projectName,
      sectionName: destination.value,
    });
    for (const { file } of staged) {
      const url = await saveObject({
        file,
        fileDetails: { filename: file.name, folder: folderPath },
      });
      await createDocumentSubmission(Number(reportItemId), destination, { name: file.name, url });
    }
  };

  const handleCancel = () => {
    navigate({
      to: "/proponent/projects/$projectId/reports/$reportPackageId",
      params: { projectId: accountProjectIdParam, reportPackageId },
    });
  };

  const handleSubmit = async ({
    primaryFiles,
    supportingFiles,
  }: ReportUploadSubmission) => {
    if (!reportItemId) {
      notify.error(SUBMIT_FAILURE_MESSAGE);
      return;
    }

    try {
      // Upload every staged file first; only flip the package to SUBMITTED
      // once all uploads succeed so a mid-way failure leaves nothing partial.
      await uploadSection(
        primaryFiles,
        S3_FOLDER.REPORTS,
      );
      await uploadSection(
        supportingFiles,
        S3_FOLDER.REPORT_SUPPORTING_DOCUMENTS,
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
    }
  };

  return (
    <ReportDocumentUploadForm
      accountProject={accountProject}
      report={report}
      uploadedByName={uploadedByName}
      submitLabel="Submit to EAO"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
