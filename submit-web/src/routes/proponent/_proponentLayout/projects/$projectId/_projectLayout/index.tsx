import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { Project as ProjectComponent } from "@/components/Projects/Project";
import { useGetAccountProject } from "@/hooks/api/useProjects";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/",
)({
  component: ProjectPage,
  notFoundComponent: () => {
    return <p>Project not found!</p>;
  },
});

function ProjectPage() {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ProjectComponent accountProject={accountProject} />
      </Grid>
    </PageGrid>
  );
}
