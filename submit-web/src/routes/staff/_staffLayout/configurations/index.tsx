import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { BannerConfigurationForm } from "@/components/App/Configurations/BannerConfigurationForm";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { Box, Grid, Typography } from "@mui/material";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/_staffLayout/configurations/")({
  component: Configurations,
  head: () => ({
    meta: [{ title: "Configurations", path: "/staff/configurations" }],
  }),
  beforeLoad: ({ context: { account } }) => {
    if (!account.isLoading) {
      if (!account?.roles?.includes(EPIC_SUBMIT_ROLE.full_access)) {
        return redirect({ to: "/unauthorized" });
      }
    }
  },
});

function Configurations() {
  return (
    <Box
      sx={{
        padding: "36px 24px",
        width: "100%",
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ContentBox
            mainLabel="Banner Configurations"
            sx={{ width: "100%", height: "fit-content" }}
            contentBoxVariant="secondary"
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Configure the banner shown on the public welcome page. Only one
              banner can be active at a time. Enable a banner to display it, or
              disable it to hide the banner entirely.
            </Typography>
            <BannerConfigurationForm />
          </ContentBox>
        </Grid>
      </Grid>
    </Box>
  );
}
