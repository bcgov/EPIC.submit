import ProjectFilters from "@/components/App/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/App/Filters/projectFilterStore";
import { Projects, ProjectsSkeleton } from "@/components/App/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { expandStatusFilters } from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Else, If, Then } from "react-if";

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

  const { data: unfilteredProjectsData } = useGetAccountProjectsByAccount({
    accountId,
    searchOptions: {},
  });

  const hasApprovedConditionProject = useMemo(
    () =>
      unfilteredProjectsData?.some((p) => p.project.has_approved_condition) ??
      false,
    [unfilteredProjectsData],
  );

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
        <ProjectFilters
          userType={USER_TYPE.PROPONENT}
          hideStatusFilter={!hasApprovedConditionProject}
        />
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
