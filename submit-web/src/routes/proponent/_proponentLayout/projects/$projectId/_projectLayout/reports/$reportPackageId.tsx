import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
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
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/reports/$reportPackageId";

const PendingComponent = () => (
  <PageGrid>
    <Grid size={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

export const Route = createFileRoute(ROUTE_ID)({
  component: ReportLayout,
  loader: ({ context: { queryClient }, params: { reportPackageId } }) =>
    queryClient.ensureQueryData(
      getSubmissionPackageQueryOptions({
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
        path: `/proponent/projects/${params.projectId}/reports/${params.reportPackageId}`,
      },
    ],
  }),
});

function ReportLayout() {
  const { projectId: accountProjectIdParam, reportPackageId } = useParams({
    from: ROUTE_ID,
  });
  const accountProjectId = Number(accountProjectIdParam);

  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectQueryOptions(accountProjectId),
  );
  const { data: reportPackage } = useSuspenseQuery(
    getSubmissionPackageQueryOptions({ packageId: Number(reportPackageId) }),
  );

  if (!accountProject || !reportPackage || !reportPackage.project_report) {
    return <Navigate to="/error" />;
  }

  return <Outlet />;
}
