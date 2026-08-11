import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { QUERY_KEY } from "@/hooks/api/constants";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid } from "@mui/material";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  notFound,
  Outlet,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

const PendingComponent = () => (
  <PageGrid>
    <Grid item xs={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

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
  beforeLoad: ({ context: { account } }) => {
    if (!account || account.isLoading) return;
    if (!account.userManagementRoles || account.userManagementRoles.length === 0) {
      return redirect({
        to: "/error",
      });
    }

    const allowedRoles = [
      USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
      USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
      USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
      USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
    ];
    const hasAllowedRole = account.userManagementRoles.some(
      (r) => allowedRoles.includes(r.role_name),
    );
    if (hasAllowedRole) {
      return;
    }
    return redirect({
      to: "/proponent/projects",
    });
  },
  head: ({ loaderData: submissionPackage }) => ({
    meta: [{ title: submissionPackage?.name }],
  }),
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
