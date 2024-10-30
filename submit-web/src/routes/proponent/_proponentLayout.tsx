import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid, Typography } from "@mui/material";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

const IDIR = "idir";

export const Route = createFileRoute("/proponent/_proponentLayout")({
  component: Proponent,
});

function Proponent() {
  const { user, signoutRedirect } = useAuth();

  if (user?.profile.identity_provider !== IDIR) {
    signoutRedirect();
  }

  const noRoles = !user?.profile.roles;
  if (noRoles) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <Typography>
            You need to request access from the administrator
          </Typography>
        </Grid>
      </PageGrid>
    );
  }

  return <Outlet />;
}
