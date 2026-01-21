import { Case, Switch } from "react-if";
import { ManagementPlan } from "./ManagementPlan";
import { PROJECT_STATUS } from "./constants";
import { Project } from "@/models/Project";

type ProjectCardProps = {
  project: Project;
};
export const ProjectCard = ({ project }: ProjectCardProps) => {
  //TODO: Get project status from the project object
  const projectStatus = PROJECT_STATUS.POST_DECISION;
  return (
    <Switch>
      <Case condition={projectStatus === PROJECT_STATUS.POST_DECISION}>
        <ManagementPlan project={project} />
      </Case>
    </Switch>
  );
};
