import { useMemo } from "react";
import { Grid } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  notFound,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { useAuth } from "react-oidc-context";
import { camelCase } from "lodash";
import { isAxiosError } from "axios";
import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { useAddEaoReportDocuments } from "@/hooks/api/useAddEaoReportDocuments";
import { HTTP_STATUS } from "@/utils/constants";
import {
  ADD_FAILURE_MESSAGE,
  ADD_SUCCESS_MESSAGE,
} from "@/components/App/Projects/ReportDetail/reportUpload";
import {
  DateReceivedForm,
  formatDateReceived,
  getDateReceivedError,
} from "@/components/App/Projects/ReportDetail/upload/dateReceived";
import { DateReceivedField } from "@/components/App/Projects/ReportDetail/upload/DateReceivedField";
import {
  ReportDocumentUploadForm,
  ReportUploadSubmission,
} from "@/components/App/Projects/ReportDetail/upload/ReportDocumentUploadForm";

const ROUTE_ID =
  "/staff/_staffLayout/projects/$projectId/_projectLayout/reports/$reportPackageId/add-document";

const PendingComponent = () => (
  <PageGrid>
    <Grid size={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

export const Route = createFileRoute(ROUTE_ID)({
  component: StaffReportAddDocumentPage,
  loader: ({ context: { queryClient }, params: { reportPackageId } }) =>
    queryClient.ensureQueryData(
      getStaffSubmissionPackageQueryOptions({
        packageId: Number(reportPackageId),
      }),
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
  // ($reportPackageId.tsx). This leaf adds only its own "Add Document" crumb.
  head: () => ({
    meta: [{ title: "Add Document" }],
  }),
});

function StaffReportAddDocumentPage() {
  const navigate = useNavigate();
  const { projectId: accountProjectIdParam, reportPackageId } = useParams({
    from: ROUTE_ID,
  });
  const accountProjectId = Number(accountProjectIdParam);
  const packageId = Number(reportPackageId);

  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectForStaffQueryOptions(accountProjectId),
  );
  const { data: reportPackage } = useSuspenseQuery(
    getStaffSubmissionPackageQueryOptions({ packageId }),
  );

  const auth = useAuth();
  const { data: currentUser } = useGetUserByGuid({
    guid: auth.user?.profile?.preferred_username,
  });
  const uploadedByName = [
    currentUser?.staff_user?.first_name,
    currentUser?.staff_user?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const { addDocuments } = useAddEaoReportDocuments(packageId);

  const methods = useForm<DateReceivedForm>({
    defaultValues: { receivedDate: null },
  });

  const report = reportPackage?.project_report;
  const reportItemId = reportPackage?.items?.[0]?.id;
  const projectName = useMemo(
    () => camelCase(accountProject?.project?.name ?? ""),
    [accountProject],
  );

  if (!accountProject || !reportPackage || !report) {
    return <Navigate to="/error" />;
  }

  const goBackToReport = () =>
    navigate({
      to: "/staff/projects/$projectId/reports/$reportPackageId",
      params: { projectId: accountProjectIdParam, reportPackageId },
    });

  // Shows the date message under the field, outlines it in red and moves focus
  // to it. Nothing is saved while the date is missing or in the future.
  const validateDateReceived = () => {
    const error = getDateReceivedError(methods.getValues("receivedDate"));
    if (error) {
      methods.setError("receivedDate", { type: "manual", message: error });
      methods.setFocus("receivedDate");
      return false;
    }
    methods.clearErrors("receivedDate");
    return true;
  };

  const handleSubmit = async ({
    primaryFiles,
    supportingFiles,
  }: ReportUploadSubmission) => {
    const receivedDate = methods.getValues("receivedDate");
    if (!reportItemId || !receivedDate) {
      notify.error(ADD_FAILURE_MESSAGE);
      return;
    }
    try {
      await addDocuments({
        itemId: reportItemId,
        projectName,
        receivedDate: formatDateReceived(receivedDate),
        primaryFiles,
        supportingFiles,
      });
      notify.success(ADD_SUCCESS_MESSAGE, 15000);
      goBackToReport();
    } catch (error) {
      // Stay on the page with the files still listed; nothing was kept.
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? ADD_FAILURE_MESSAGE)
        : ADD_FAILURE_MESSAGE;
      notify.error(message);
    }
  };

  return (
    <FormProvider {...methods}>
      <ReportDocumentUploadForm
        accountProject={accountProject}
        report={report}
        uploadedByName={uploadedByName}
        submitLabel="Add Documents"
        beforeSections={<DateReceivedField />}
        validate={validateDateReceived}
        onSubmit={handleSubmit}
        onCancel={goBackToReport}
      />
    </FormProvider>
  );
}
