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
  meta: ({ loaderData, params }) => [
    { title: "All Projects", path: "/staff/projects/" },
    {
      title: loaderData.project.name,
      path: `/staff/projects/${params.projectId}`,
    },
  ],
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
    getAccountProjectForStaffQueryOptions(accountProjectId),
  );

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
