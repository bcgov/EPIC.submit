import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { AccountProject } from "@/models/Project";
import { Box, styled } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { ProjectSubmissionsCard } from "./ProjectSubmissionsCard";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ProjectParam = {
  accountProject: AccountProject;
};

export const Project = ({ accountProject }: ProjectParam) => {
  const navigate = useNavigate();

  const { name, ea_certificate } = accountProject.project;
  const currentPhase =
    accountProject.account_project_works?.at(-1)?.work?.current_phase ?? null;

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
      {currentPhase?.work_type_name == "ASSESSMENT" ? (
        <ProjectSubmissionsCard
          title={`${name} - Assessment`}
          status={PROJECT_STATUS.EARLY_ENGAGEMENT}
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
