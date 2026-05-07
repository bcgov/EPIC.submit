import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { AccountProject } from "@/models/Project";
import { SubmissionPackageType } from "@/models/Package";
import { useNavigate } from "@tanstack/react-router";
import { ProjectSubmissionsCard } from "./ProjectSubmissionsCard";
import { PROJECT_STATUS } from "@/components/App/registration/addProjects/ProjectCard/constants";

type ProjectParam = {
  accountProject: AccountProject;
};

export const Project = ({ accountProject }: ProjectParam) => {
  const navigate = useNavigate();
  
  const { name, ea_certificate } = accountProject.project;
  const hasAccountProjectWorks = (accountProject.account_project_works?.length ?? 0) > 0;

  const handleNewSubmission = (workId?: number, isManagementPlan?: boolean) => {
    navigate({
      to: `/proponent/projects/${accountProject.id}/new-submission`,
      search: { workId, isManagementPlan },
    });
  };

  return (
    <ContentBox
      data-testid={`project-${accountProject.id}`}
      mainLabel={name}
      topLabel={accountProject.project.proponent?.name || ""}
      bottomLabel={ea_certificate ? `EAC # ${ea_certificate}` : ""}
    >
      {hasAccountProjectWorks && accountProject.account_project_works && 
        accountProject.account_project_works.map((accountProjectWork) => {
          const workPackages = accountProject.packages.filter(
            (pkg) => pkg.account_project_work?.id === accountProjectWork.id
          );
          return (
            <ProjectSubmissionsCard
              key={accountProjectWork.id}
              title={accountProjectWork.work.title || ""}
              status={accountProjectWork.work.current_phase?.name || PROJECT_STATUS.POST_DECISION}
              isWorkRelated={true}
              workId={accountProjectWork.id}
              packages={workPackages}
              onNewSubmission={handleNewSubmission}
            />
          );
        })
      }
      {accountProject.project.has_approved_condition && (
        <ProjectSubmissionsCard
          title="Management Plans & Related Documents"
          status={PROJECT_STATUS.POST_DECISION}
          isWorkRelated={false}
          packages={accountProject.packages.filter(
            (pkg) => pkg.type.name === SubmissionPackageType.MANAGEMENT_PLAN
          )}
          onNewSubmission={handleNewSubmission}
        />
      )}
    </ContentBox>
  );
};
