import { ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { QUERY_KEY } from "@/hooks/api/constants";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      getAccountProjectQueryOptions(Number(projectId))
    ),
  component: ProjectLayout,
  meta: ({ loaderData }) => [{ title: loaderData.project.name }],
  pendingComponent: () => (
    <PageGrid>
      <ProjectsSkeleton />
    </PageGrid>
  ),
  errorComponent: () => <Navigate to="/error" />,
});

function ProjectLayout() {
  const { projectId: accountProjectIdParam } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout",
  });
  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>([
    QUERY_KEY.ACCOUNT_PROJECT,
    Number(accountProjectIdParam),
  ]);

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
