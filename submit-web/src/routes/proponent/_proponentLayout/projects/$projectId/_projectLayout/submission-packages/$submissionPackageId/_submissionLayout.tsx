import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { QUERY_KEY } from "@/hooks/api/constants";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { Grid } from "@mui/material";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
  useParams,
} from "@tanstack/react-router";
export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
)({
  component: SubmissionLayout,
  loader: ({ context: { queryClient }, params: { submissionPackageId } }) =>
    queryClient.ensureQueryData(
      getSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
      }),
    ),
  pendingComponent: () => (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBoxSkeleton />
      </Grid>
    </PageGrid>
  ),
  beforeLoad: ({ context: { account }, params: { submissionPackageId } }) => {
    if (!account || account.isLoading) return;
    if (!account.userManagementRole) {
      return redirect({
        to: "/error",
      });
    }
    if (
      account.userManagementRole.role_name ===
        USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR &&
      account.userManagementRole.package_ids?.includes(
        Number(submissionPackageId),
      )
    ) {
      return;
    }
    if (
      [
        USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
        USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
      ].includes(account.userManagementRole?.role_name)
    ) {
      return;
    }
    return redirect({
      to: "/proponent/projects",
    });
  },
  meta: ({ loaderData: submissionPackage }) => [
    { title: submissionPackage.name },
  ],
});

export default function SubmissionLayout() {
  const queryClient = useQueryClient();

  const {
    projectId: accountProjectIdParam,
    submissionPackageId: submissionPackageIdParam,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const accountProject = queryClient.getQueryData([
    QUERY_KEY.ACCOUNT_PROJECT,
    accountProjectId,
  ]);

  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage } = useSuspenseQuery(
    getSubmissionPackageQueryOptions({
      packageId: submissionPackageId,
    }),
  );

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  return <Outlet />;
}
