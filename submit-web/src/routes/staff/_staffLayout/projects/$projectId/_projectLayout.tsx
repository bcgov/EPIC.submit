import { ProjectsSkeleton } from "@/components/App/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { getAccountProjectForStaffQueryOptions } from "@/hooks/api/useProjects";
import { HTTP_STATUS } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  notFound,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout",
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      getAccountProjectForStaffQueryOptions(Number(projectId)),
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
  head: ({ loaderData, params }) => ({
    meta: [
      { title: "All Projects", path: "/staff/projects/" },
      {
        title: loaderData?.project.name,
        path: `/staff/projects/${params.projectId}`,
      },
    ],
  }),
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
    getAccountProjectForStaffQueryOptions(accountProjectId),
  );

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
