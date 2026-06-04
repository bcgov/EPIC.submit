import { EnableProjectsButton } from "@/components/App/Proponents/EnableProjectsButton/EnableProjectsButton";
import {
  EligibleProjectsTable,
  OnboardedProjectsTable,
} from "@/components/App/Proponents/ProjectsTable";
import { ContactsSection } from "@/components/App/Proponents/Contacts";
import { RegistrationUrl } from "@/components/App/Proponents/RegistrationUrl/RegistrationUrl";
import { ProponentStatusChip } from "@/components/App/ProponentStatusChip";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getProponentOptions } from "@/hooks/api/useProponents";
import { useProponentStore } from "@/store/proponentStore";
import { HTTP_STATUS } from "@/utils/constants";
import { Grid, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useParams } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { BCDesignTokens } from "epic.theme";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/staff/_staffLayout/proponents/$proponentId",
)({
  component: ProponentPage,
  loader: ({ context: { queryClient }, params: { proponentId } }) =>
    queryClient.ensureQueryData(
      getProponentOptions(Number(proponentId), {
        includeInvitations: true,
        includeEligibilityEntries: true,
        includeAdministrators: true,
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
  head: ({ loaderData, params }) => ({
    meta: [
      { title: "Proponents/Holders", path: "/staff/proponents" },
      {
        title: loaderData?.name,
        path: `/staff/proponents/${params.proponentId}`,
      },
    ],
  }),
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

  const {
    data: proponent,
    isPending,
    isError,
    refetch,
  } = useSuspenseQuery(
    getProponentOptions(proponentId, {
      includeInvitations: true,
      includeEligibilityEntries: true,
      includeAdministrators: true,
    }),
  );

  // Zustand store actions
  const { eligibleEntries, setProponent, setIsLoading, setIsError, reset } =
    useProponentStore();

  // Sync query data to store
  useEffect(() => {
    if (proponent) {
      setProponent(proponent);
    }
  }, [proponent, setProponent]);

  useEffect(() => {
    setIsLoading(isPending);
  }, [isPending, setIsLoading]);

  useEffect(() => {
    setIsError(isError);
    if (isError) {
      notify.error("Error fetching proponent");
    }
  }, [isError, setIsError]);

  // Reset store on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <PageGrid>
      <Grid item xs={12} sx={{ alignSelf: "flex-start" }}>
        <ContentBox
          mainLabel={proponent?.name}
          statusChip={<ProponentStatusChip status={proponent?.status} />}
          sx={{ width: "100%", minHeight: "43.75em" }}
          contentBoxVariant="secondary"
        >
          {proponent?.status == "ONBOARDED" ? (
            <OnboardedProjectsTable />
          ) : (
            <Typography
              variant="body1"
              sx={{
                mb: BCDesignTokens.layoutMarginXxxlarge,
                fontWeight: "bold",
                whiteSpace: "pre-line",
              }}
            >
              {`1. Select the project(s)/Work(s) you want to enable in EPIC.submit
                2. Generate an invite link
                3. Send it to the Proponent/Holder
                
                Once they create their account, those Project(s)/Work(s) will be ready for submissions.`}
            </Typography>
          )}
          <EligibleProjectsTable />
          {proponent?.status == "ONBOARDED" && eligibleEntries.length > 0 && (
            <EnableProjectsButton onEnableProjects={refetch} />
          )}
          {proponent?.status != "ONBOARDED" && eligibleEntries.length > 0 && (
            <RegistrationUrl onInvitationCreated={refetch} />
          )}
          <ContactsSection
            entityName={proponent?.name}
            administrators={proponent?.administrators}
          />
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
