import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { PageLoader } from "@/components/Shared/PageLoader";
import { LandingPageComponent } from "@/components/App/LandingPageComponent";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/oidc-callback" />;
  }

  return <LandingPageComponent />;
}
