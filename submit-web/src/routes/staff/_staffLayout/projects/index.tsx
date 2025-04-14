import { useInfiniteQuery } from "@tanstack/react-query";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { USER_TYPE } from "@/models/User";
import ProjectFilters from "@/components/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/Filters/projectFilterStore";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getAccountProjectsForStaff } from "@/hooks/api/useProjects";

export const Route = createFileRoute("/staff/_staffLayout/projects/")({
  component: ProjectsPage,
  meta: () => [{ title: "All Projects" }],
});

function ProjectsPage() {
  const { filters } = useProjectFilters();

  const fetchProjects = async ({ pageParam = 0 }) => {
    const res = await fetch(`/api/projects?cursor=${pageParam}`, {
      method: "POST",
      body: JSON.stringify(filters),
    });
    return res.json();
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
    status,
  } = useInfiniteQuery({
    initialPageParam: 1,
    queryKey: ["projects", filters],
    queryFn: ({ pageParam }) =>
      getAccountProjectsForStaff({
        page: pageParam,
        pageSize: 3,
        searchOptions: filters,
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });

  useEffect(() => {
    if (error) {
      notify.error("Failed to load projects");
    }
  }, [error]);

  if (error) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ProjectFilters userType={USER_TYPE.STAFF} />
        {isPending ? (
          <ProjectsSkeleton />
        ) : (
          <>
            {data.pages.map((page) => (
              <Projects
                key={page.next_cursor - 1}
                accountProjects={page.projects}
              />
            ))}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? "Loading more..."
                  : hasNextPage
                    ? "Load More"
                    : "No more projects"}
              </button>
            </div>
          </>
        )}
      </Grid>
    </PageGrid>
  );
}
