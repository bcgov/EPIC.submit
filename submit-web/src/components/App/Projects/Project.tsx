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
  const { name, ea_certificate, current_work } = accountProject.project;
  const status =
    current_work?.current_phase?.name || PROJECT_STATUS.POST_DECISION;
  const title = current_work?.title || "Management Plans & Related Documents";

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
      <ProjectSubmissionsCard
        title={title}
        status={status}
        isWorkRelated={accountProject.account_project_works?.length !== 0}
        packages={accountProject.packages}
        onNewSubmission={handleNewSubmission}
      />
    </ContentBox>
  );
};
