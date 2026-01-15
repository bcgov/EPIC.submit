import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { RegistrationPageTitle } from "@/components/App/AccountRegistration/RegistrationPageTitle";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import { Grid } from "@mui/material";
import { useLoadProjectsByProponentId } from "@/hooks/api/useProjects";
import { ProjectCard } from "@/components/App/AccountRegistration/ProjectCard";
import ProjectConfirmationForm from "@/components/App/AccountRegistration/ProjectConfirmationForm";

export const Route = createFileRoute(
  "/proponent/account-registration/confirm-projects"
)({
  component: ConfirmProjects,
});

function ConfirmProjects() {
  const { entityName, invitation } = useCreateAccountFormStore();
  const { data: projects } = useLoadProjectsByProponentId(
    invitation?.proponent_id
  );

  return (
    <>
      <RegistrationPageTitle
        mainTitle="Project Account(s)"
        subTitle={
          <Fragment>
            We found the following Project(s) associated with {entityName}.
          </Fragment>
        }
      />
      <Grid container spacing={3} mb={6}>
        {projects?.map((project) => (
          <Grid item key={project.id}>
            <ProjectCard key={project.id} project={project} />
          </Grid>
        ))}
      </Grid>
      <ProjectConfirmationForm />
    </>
  );
}
