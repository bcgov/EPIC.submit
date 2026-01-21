import { Stack } from "@mui/material";
import { Skeleton } from "./ProjectCard/Skeleton";
import { ProjectCard } from "./ProjectCard";
import { Project } from "@/models/Project";

type ProjectsListProps = {
  projects?: Project[];
};

export const ProjectListSkeleton = () => {
  return (
    <Stack spacing={2} direction="row">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </Stack>
  );
};
export const ProjectsList = ({ projects }: ProjectsListProps) => {
  if (!projects?.length) {
    return <p>No projects found</p>;
  }
  return (
    <Stack spacing={2} direction="row">
      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Stack>
  );
};
