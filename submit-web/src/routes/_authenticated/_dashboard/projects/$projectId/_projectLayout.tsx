import { ProjectsSkeleton } from "@/components/Projects";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/$projectId/_projectLayout",
)({
  loader: () => useGetAccountProject,
  component: ProjectLayout,
  meta: ({ params }) => [{ title: `Project ${params.projectId}` }],
});

function ProjectLayout() {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const {
    data: accountProject,
    isLoading,
    isError,
    error,
  } = useGetAccountProject({
    accountProjectId,
  });
  const META_TITLE = `Project ${accountProjectId}`;
  const matches = useRouterState({ select: (s) => s.matches });
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (accountProject) {
      replaceBreadcrumb(META_TITLE, accountProject?.project.name || "");
    }
  }, [accountProject, matches, replaceBreadcrumb, META_TITLE]);

  if (isLoading) {
    return (
      <PageGrid>
        <ProjectsSkeleton />
      </PageGrid>
    );
  }

  if (!accountProject) return <Navigate to="/error" />;

  if (isError) {
    return <h2>{error.message}</h2>;
  }

  return <Outlet />;
}
