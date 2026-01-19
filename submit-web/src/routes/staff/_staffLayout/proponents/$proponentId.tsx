/*eslint sort-imports: "error"*/
import { ProjectsTable } from "@/components/App/Proponents/ProjectsTable/ProjectsTable";
import { RegistrationUrl } from "@/components/App/Proponents/RegistrationUrl/RegistrationUrl";
import { ProponentStatusChip } from "@/components/ProponentStatusChip";
import { ContentBox } from "@/components/Shared/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { InvitationStatus } from "@/models/Invitation";
import { HTTP_STATUS } from "@/utils/constants";
import { InfoOutlined } from "@mui/icons-material";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useParams } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { BCDesignTokens } from "epic.theme";
import { useEffect, useState } from "react";

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
  const [selectedProjectsIds, setSelectedProjectsIds] = useState<(string | number)[]>([]);
  const { proponentId } = useParams({
    from: "/staff/_staffLayout/proponents/$proponentId",
  });
  const { data: proponent, isPending, isError } = useSuspenseQuery(
    getProponentOptions(proponentId, {
      includeProjects: true,
      includeInvitations: true,
    }),
  );

  // Ideally there is only 1 pending invitation per proponent, but just in case we grab the most recent pending invite.
  const pendingInvitation = proponent?.invitations
        ?.filter(invitation => invitation.status === InvitationStatus.PENDING)
        .sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime(),)[0]

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
          sx={{ width: "100%", minHeight: "43.75em" }}
          contentBoxVariant="secondary"
        >
            <Typography 
              variant="body1" 
              sx={{
                mb: BCDesignTokens.layoutMarginXxxlarge,
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
              projects={proponent?.projects}
              pendingProjectIds={pendingInvitation?.project_ids}
              selectedProjectsIds={selectedProjectsIds}
              onSelectionChange={setSelectedProjectsIds}
              isLoading={isPending}
              isError={isError}
              sx={{ 
                mt: BCDesignTokens.layoutMarginXxlarge, 
                mb: BCDesignTokens.layoutMarginXxxlarge 
              }}
            />
            <RegistrationUrl
              pendingInvitation={pendingInvitation}
              selectedProjectsIds={selectedProjectsIds}
            />
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
