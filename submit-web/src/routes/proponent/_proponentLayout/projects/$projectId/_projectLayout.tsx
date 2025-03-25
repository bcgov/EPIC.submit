import { ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { QUERY_KEY } from "@/hooks/api/constants";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout",
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      getAccountProjectQueryOptions(Number(projectId)),
    ),
  component: ProjectLayout,
  meta: ({ loaderData, params }) => [
    { title: "All Projects", path: "/proponent/projects/" },
    {
      title: loaderData.project.name,
      path: `/proponent/projects/${params.projectId}`,
    },
  ],
  pendingComponent: () => (
    <PageGrid>
      <ProjectsSkeleton />
    </PageGrid>
  ),
  errorComponent: () => <Navigate to="/error" />,
});

function ProjectLayout() {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectQueryOptions(accountProjectId),
  );

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
