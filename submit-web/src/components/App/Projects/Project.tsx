import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { AccountProject } from "@/models/Project";
import { useNavigate } from "@tanstack/react-router";
import { ProjectSubmissionsCard } from "./ProjectSubmissionsCard";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";

type ProjectParam = {
  accountProject: AccountProject;
};

export const Project = ({ accountProject }: ProjectParam) => {
  const navigate = useNavigate();
  const { name, ea_certificate } = accountProject.project;
  const currentWork =
    accountProject.account_project_works?.at(-1)?.work ?? null;
  const currentPhase = currentWork?.current_phase ?? null;

  const handleNewSubmission = () => {
    navigate({
      to: `/proponent/projects/${accountProject.id}/new-submission`,
    });
  };

  return (
    <ContentBox
      data-testid={`project-${accountProject.id}`}
      mainLabel={name}
      topLabel={accountProject.project.proponent?.name || ""}
      bottomLabel={ea_certificate ? `EAC # ${ea_certificate}` : ""}
    >
      {currentPhase?.work_type_name?.toUpperCase() == "ASSESSMENT" ? (
        <ProjectSubmissionsCard
          title={`${currentWork?.title}`}
          status={currentPhase.name}
          packages={accountProject.packages}
          onNewSubmission={handleNewSubmission}
        />
      ) : (
        <ProjectSubmissionsCard
          title="Management Plans & Related Documents"
          status={PROJECT_STATUS.POST_DECISION}
          packages={accountProject.packages}
          onNewSubmission={handleNewSubmission}
        />
      )}
    </ContentBox>
  );
};
