import { ProponentStatusChip } from "@/components/ProponentStatusChip";
import { ContentBox } from "@/components/Shared/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { ProjectsTable } from "@/components/UserManagement/staff/ProjectsTable/ProjectsTable";
import { RegistrationUrl } from "@/components/UserManagement/staff/RegistrationUrl/RegistrationUrl";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { BCDesignTokens } from "epic.theme";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, notFound } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/staff/_staffLayout/proponents/$proponentId",
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
    { title: "Proponents/Holders", path: "/staff/proponents" },
    {
      title: loaderData?.name,
      path: `/staff/proponents/${params.proponentId}`,
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
    from: "/staff/_staffLayout/proponents/$proponentId",
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
          mainLabel={proponent?.name}
          statusChip={<ProponentStatusChip status={proponent?.status} />}
          sx={{ width: "100%", height: "43.75em" }}
          contentBoxVariant="secondary"
        >
            <Typography 
              variant="body1" 
              sx={{
                mb: BCDesignTokens.layoutMarginXlarge,
                fontWeight: "bold",
                whiteSpace: "pre-line"
              }}
            >
              {`1. Select the project(s)/Work(s) you want to enable in EPIC.submit
              2. Generate an invite link
              3. Send it to the Proponent/Holder
              
              Once they create their account, those Project(s)/Work(s) will be ready for submissions.`}
            </Typography>
            <BarBlueTitle 
              title="Eligible Project(s)/Work(s)" 
              bold={false} 
              variant="h5"
              tooltip={
                <Tooltip title="Project(s)/Work(s) for this Proponent/Holder will be added to this list as they become eligible to submit in EPIC.submit and can be added manually once the Proponent/Holder created their account." arrow>
                  <IconButton sx={{ p: 0, ml: 1, mb: 0.5 }}>
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              } 
            />
            <ProjectsTable 
              sx={{ 
                mt: BCDesignTokens.layoutMarginXxlarge, 
                mb: BCDesignTokens.layoutMarginXxxlarge 
              }}
            />
            <RegistrationUrl />
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
