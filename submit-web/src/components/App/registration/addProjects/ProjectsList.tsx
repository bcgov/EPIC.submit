import { Stack } from "@mui/material";
import { Skeleton } from "./ProjectCard/Skeleton";

export const ProjectListSkeleton = () => {
  return (
    <Stack spacing={2} direction="row">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </Stack>
  );
};
