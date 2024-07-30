import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: Auth,
});

function Auth() {
  const { isAuthenticated, signinRedirect, isLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      signinRedirect();
    }
  }, [isAuthenticated, isLoading, signinRedirect]);

  return <Outlet />;
}
