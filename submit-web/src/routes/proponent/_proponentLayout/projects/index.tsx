import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { Else, If, Then } from "react-if";
import { Projects, ProjectsSkeleton } from "@/components/App/Projects";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import ProjectFilters from "@/components/App/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/App/Filters/projectFilterStore";
import { USER_TYPE } from "@/models/User";
import { expandStatusFilters } from "@/models/Submission";

export const Route = createFileRoute("/proponent/_proponentLayout/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "All Projects" }] }),
});

export function ProjectsPage() {
  const { accountId } = useAccount();
  const { filters } = useProjectFilters();
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
  } = useGetAccountProjectsByAccount({
    accountId,
    searchOptions: {
      ...filters,
      ...(filters.status.length > 0 && {
        status: expandStatusFilters(filters.status),
      }),
    },
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
        <ProjectFilters userType={USER_TYPE.PROPONENT} />
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
