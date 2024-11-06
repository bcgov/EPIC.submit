import ProjectFilters from "@/components/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/Filters/projectFilterStore";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  getAccountProjectsForStaffQueryOptions,
  useGetAccountProjectsByAccount,
} from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute("/staff/_staffLayout/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { accountId } = useAccount();
  const { filters } = useProjectFilters();
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
  } = useGetAccountProjectsByAccount({
    accountId,
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
