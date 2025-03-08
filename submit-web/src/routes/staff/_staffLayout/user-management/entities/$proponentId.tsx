import { ContentBox } from "@/components/Shared/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { Grid, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/staff/_staffLayout/user-management/entities/$proponentId",
)({
  component: ProponentPage,
  loader: ({ context: { queryClient }, params: { proponentId } }) =>
    queryClient.ensureQueryData(getProponentOptions(Number(proponentId))),
  meta: ({ loaderData, params }) => [
    { title: "User Management", path: "/staff/user-management" },
    {
      title: loaderData.name,
      path: `/staff/user-management/entities/${params.proponentId}`,
    },
  ],
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
    from: "/staff/_staffLayout/user-management/entities/$proponentId",
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
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
