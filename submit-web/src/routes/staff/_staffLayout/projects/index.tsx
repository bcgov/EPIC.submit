import { useInfiniteQuery } from "@tanstack/react-query";
import { Grid, Skeleton } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { USER_TYPE } from "@/models/User";
import ProjectFilters from "@/components/App/Filters/ProjectFilters";
import { useProjectFilters } from "@/components/App/Filters/projectFilterStore";
import { Projects, ProjectsSkeleton } from "@/components/App/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getAccountProjects } from "@/hooks/api/useProjects";
import { QUERY_KEY } from "@/hooks/api/constants";

export const Route = createFileRoute("/staff/_staffLayout/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "All Projects" }] }),
});

const initialPageParam = 1;
const pageSize = 3;

function ProjectsPage() {
  const { filters } = useProjectFilters();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
  } = useInfiniteQuery({
    initialPageParam: initialPageParam,
    queryKey: [QUERY_KEY.ACCOUNT_PROJECTS, filters],
    queryFn: ({ pageParam }) =>
      getAccountProjects({
        page: pageParam,
        pageSize: pageSize,
        searchOptions: filters,
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  });

  useEffect(() => {
    if (error) {
      notify.error("Failed to load projects");
    }
  }, [error]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetching
        ) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isFetching]);

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
            <div ref={loadMoreRef} style={{ height: "1px" }} />
          </>
        )}
        {isFetchingNextPage && (
          <Skeleton
            variant="rectangular"
            height="320px"
            width="1448px"
            sx={{ marginTop: "1em" }}
          />
        )}
      </Grid>
    </PageGrid>
  );
}
