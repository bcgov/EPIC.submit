import { LoginOptions } from "@/components/Login/LoginOptions";
import { PageGrid } from "@/components/Shared/PageGrid";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search) => ({
    path: typeof search.path === "string" ? search.path : "",
  }),
});

function Login() {
  const { signinRedirect, isAuthenticated } = useAuth();
  const { reset } = useAccount();
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");

  useEffect(() => {
    if (isAuthenticated) {
      navigate({
        to: "/oidc-callback",
        search: {
          path: path,
        },
      });
    }
  }, [isAuthenticated, navigate, signinRedirect, path, reset]);

  if (!isAuthenticated) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <LoginOptions />
        </Grid>
      </PageGrid>
    );
  }

  return <PageLoader />;
}
