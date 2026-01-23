import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid } from "@mui/material";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  notFound,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

const PendingComponent = () => {
  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBoxSkeleton />
      </Grid>
    </PageGrid>
  );
};

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
)({
  component: SubmissionLayout,
  loader: ({ context: { queryClient }, params: { submissionPackageId } }) =>
    queryClient.ensureQueryData(
      getStaffSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
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
  pendingComponent: PendingComponent,
  pendingMs: 0,
  meta: ({ loaderData: submissionPackage }) => [
    { title: submissionPackage?.name },
  ],
});

export default function SubmissionLayout() {
  const queryClient = useQueryClient();
  const {
    projectId: accountProjectIdParam,
    submissionPackageId: submissionPackageIdParam,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const accountProject = queryClient.getQueryData(
    getAccountProjectForStaffQueryOptions(accountProjectId).queryKey,
  );

  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage } = useSuspenseQuery(
    getStaffSubmissionPackageQueryOptions({
      packageId: submissionPackageId,
    }),
  );

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  return <Outlet />;
}
