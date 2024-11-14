import { ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout",
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      getAccountProjectForStaffQueryOptions(Number(projectId)),
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
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectForStaffQueryOptions(accountProjectId),
  );

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
