import { ContentBox } from "@/components/Shared/ContentBox";
import { PageGrid } from "@/components/Shared/PageGrid";
import { EntityTable } from "@/components/UserManagement/staff/EntityTable";
import { Grid, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/_staffLayout/user-management/")({
  component: UserManagement,
  meta: () => [{ title: "user Management", path: "/staff/user-management" }],
});

function UserManagement() {
  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox
          mainLabel="Generate URL"
          sx={{ width: "100%", height: "fit-content" }}
          contentBoxVariant="secondary"
        >
          <Typography variant="subtitle1">
            Select a Certificate Holder and/or Exemption Holder
          </Typography>
          <EntityTable sx={{ marginTop: "2em" }} />
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
