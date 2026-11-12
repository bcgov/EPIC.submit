import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { formatReportPageTitle } from "@/components/App/Projects/ReportDetail/reportTitle";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  notFound,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

const ROUTE_ID =
  "/staff/_staffLayout/projects/$projectId/_projectLayout/reports/$reportPackageId";

const PendingComponent = () => (
  <PageGrid>
    <Grid size={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

export const Route = createFileRoute(ROUTE_ID)({
  component: StaffReportLayout,
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
  head: ({ loaderData: reportPackage, params }) => ({
    meta: [
      {
        title: formatReportPageTitle(reportPackage?.project_report),
        path: `/staff/projects/${params.projectId}/reports/${params.reportPackageId}`,
      },
    ],
  }),
});

function StaffReportLayout() {
  const { projectId: accountProjectIdParam, reportPackageId } = useParams({
    from: ROUTE_ID,
  });
  const accountProjectId = Number(accountProjectIdParam);

  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectForStaffQueryOptions(accountProjectId),
  );
  const { data: reportPackage } = useSuspenseQuery(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(reportPackageId),
    }),
  );

  if (!accountProject || !reportPackage || !reportPackage.project_report) {
    return <Navigate to="/error" />;
  }

  return <Outlet />;
}
