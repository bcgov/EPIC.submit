import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetAccountProjects } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { Else, If, Then } from "react-if";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import ProjectFilters from "@/components/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/Filters/projectFilterStore";

export const Route = createFileRoute("/_authenticated/_dashboard/projects/")({
  component: ProjectsPage,
  meta: () => [{ title: "All Projects" }],
});

export function ProjectsPage() {
  const { accountId } = useAccount();
  const { filters } = useProjectFilters();
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
  } = useGetAccountProjects({
    accountId: 1,
    searchOptions: filters,
  });

  useEffect(() => {
    if (isProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isProjectsError]);

  if (isProjectsError) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ProjectFilters />
        <If condition={isProjectsLoading}>
          <Then>
            <ProjectsSkeleton />
          </Then>
          <Else>
            <Projects accountProjects={projectsData} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
