import { ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { HTTP_STATUS } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useParams,
  notFound,
} from "@tanstack/react-router";
import { isAxiosError } from "axios";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout",
)({
  loader: async ({ context: { queryClient }, params: { projectId } }) => {
    try {
      const data = await queryClient.ensureQueryData(
        getAccountProjectQueryOptions(Number(projectId)),
      );
      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
          throw notFound();
        }
      } else {
        throw error;
      }
    }
  },
  component: ProjectLayout,
  meta: ({ loaderData, params }) => [
    { title: "All Projects", path: "/proponent/projects/" },
    {
      title: loaderData?.project.name ?? "",
      path: `/proponent/projects/${params.projectId}`,
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
    getAccountProjectQueryOptions(accountProjectId),
  );

  if (!accountProject) return <Navigate to="/error" />;

  return <Outlet />;
}
