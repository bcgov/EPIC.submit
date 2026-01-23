import { ProjectsSkeleton } from "@/components/App/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { HTTP_STATUS } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout",
)({
  beforeLoad: ({
    context: { account },
    params: { projectId: accountProjectId },
  }) => {
    if (!account || account.isLoading) {
      return;
    }

    if (
      String(account.userManagementRole?.account_project_id) !==
      accountProjectId
    ) {
      return redirect({
        to: "/unauthorized",
      });
    }
  },
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      getAccountProjectQueryOptions(Number(projectId)),
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
  component: ProjectLayout,
  meta: ({ loaderData, params }) => [
    { title: "All Projects", path: "/proponent/projects/" },
    {
      title: loaderData?.project.name ?? "",
      path: `/proponent/projects/${params.projectId}`,
    },
  ],
  pendingMs: 0,
  pendingComponent: () => (
    <PageGrid>
      <ProjectsSkeleton />
    </PageGrid>
  ),
});

function ProjectLayout() {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectQueryOptions(accountProjectId),
  );
  const { userManagementRole } = useAccount();

  if (!accountProject) return <Navigate to="/error" />;

  if (userManagementRole?.account_project_id !== accountProjectId) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
}
