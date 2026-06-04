import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { useMemo } from "react";
import { Grid } from "@mui/material";
import { useGetProponent } from "@/hooks/api/useProponents";
import { EligibilityEntryCard } from "@/components/App/AccountRegistration/EligibilityEntryCard";
import ProjectConfirmationForm from "@/components/App/AccountRegistration/ProjectConfirmationForm";
import { EligibilityEntry } from "@/store/proponentStore";

export const Route = createFileRoute(
  "/proponent/account-registration/confirm-projects"
)({
  component: ConfirmProjects,
});

function ConfirmProjects() {
  const { entityName, invitation } = useCreateAccountFormStore();
  const { data: proponent } = useGetProponent(
    invitation?.proponent_id ?? 0,
    {
      includeEligibilityEntries: true,
    },
    {
      enabled: !!invitation?.proponent_id,
    }
  );

  const eligibilityEntries = useMemo(() => {
    if (!proponent || !invitation?.project_selections || invitation.project_selections.length === 0) {
      return [];
    }
    
    const rawEntries = (proponent as any).eligibility_entries || [];
    const entries: EligibilityEntry[] = rawEntries.map((entry: any) => ({
      ...entry,
      id: entry.work_id
        ? `${entry.project_id}:work:${entry.work_id}`
        : `${entry.project_id}:non_work:${entry.non_work_item_type}`,
    }));

    // Filter entries based on project_selections
    return entries.filter((entry) => {
      const selection = invitation.project_selections?.find(
        (ps) => ps.project_id === entry.project_id
      );
      if (!selection) return false;

      if (entry.work_id) {
        return selection.work_ids?.includes(entry.work_id);
      } else {
        const nonWorkType = entry.non_work_item_type;
        return nonWorkType ? selection.non_work_item_types?.includes(nonWorkType) ?? false : false;
      }
    });
  }, [proponent, invitation?.project_selections]);

  return (
    <>
      <RegistrationPageTitle
        mainTitle="Project Account(s)"
        subTitle={
          <Fragment>
            We found the following Project(s)/Work(s) associated with {entityName}.
          </Fragment>
        }
      />
      <Grid container spacing={3} mb={6}>
        {eligibilityEntries.map((entry) => (
          <Grid item key={entry.id}>
            <EligibilityEntryCard entry={entry} />
          </Grid>
        ))}
      </Grid>
      <ProjectConfirmationForm />
    </>
  );
}
