import { createFileRoute } from "@tanstack/react-router";
import { Button, Paper } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { PageLoader } from "@/components/Shared/PageLoader";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, signoutSilent, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      signoutSilent();
    }
  }, [isAuthenticated]);

  if (isAuthenticated || isLoading) {
    return <PageLoader />;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        padding: "1.5rem 2.5rem",
        backgroundColor: "primary.accent.light",
      }}
    >
      <h2>Environmental Assessments</h2>
      <p>
        British Columbia's environmental assessment process provides
        opportunities for Indigenous Nations, government agencies and the public
        to influence the outcome of environmental assessments in British
        Columbia.
      </p>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => navigate({ to: "/proponent/projects" })}
      >
        See Plans
      </Button>
    </Paper>
  );
}
