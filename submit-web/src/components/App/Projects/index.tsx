import { AccountProject } from "@/models/Project";
import { Box, Stack } from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";

type ProjectsParams = {
  accountProjects?: AccountProject[];
};
export const Projects = ({ accountProjects }: ProjectsParams) => {
  if (!accountProjects) return <Navigate to={"/error"} />;
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 2 }}
    >
      {accountProjects.map((accountProject) => (
        <Project key={accountProject.id} accountProject={accountProject} />
      ))}
    </Box>
  );
};

export const ProjectsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
