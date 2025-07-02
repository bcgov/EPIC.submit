import { ContentBox } from "@/components/Shared/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ProjectsTable } from "@/components/UserManagement/staff/ProjectsTable";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, notFound } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/staff/_staffLayout/invitations/entities/$proponentId",
)({
  component: ProponentPage,
  loader: ({ context: { queryClient }, params: { proponentId } }) =>
    queryClient.ensureQueryData(
      getProponentOptions(Number(proponentId), {
        includeProjects: true,
        includeInvitations: true,
      }),
    ),
  onError: (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === HTTP_STATUS.NOT_FOUND
    ) {
      throw notFound();
    }
    notify.error("Failed to load proponent data");
    throw error;
  },
  meta: ({ loaderData, params }) => [
    { title: "Invitations", path: "/staff/invitations" },
    {
      title: loaderData?.name,
      path: `/staff/invitations/entities/${params.proponentId}`,
    },
  ],
  pendingMs: 0,
  pendingComponent: () => (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBoxSkeleton />
      </Grid>
    </PageGrid>
  ),
});

function ProponentPage() {
  const { proponentId } = useParams({
    from: "/staff/_staffLayout/invitations/entities/$proponentId",
  });
  const { data: proponent, isError } = useSuspenseQuery(
    getProponentOptions(proponentId, {
      includeProjects: true,
      includeInvitations: true,
    }),
  );

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching proponent");
    }
  }, [isError]);

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox
          mainLabel="Generate URL"
          sx={{ width: "100%", height: "fit-content" }}
          contentBoxVariant="secondary"
        >
          <Typography variant="h4">{proponent?.name}</Typography>
          <ProjectsTable />
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
