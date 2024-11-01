import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/_staffLayout/projects")({
  component: Projects,
});

function Projects() {
  return (
    <PageGrid>
      <Grid item xs={12}>
        <h1>Projects</h1>
      </Grid>
    </PageGrid>
  );
}
