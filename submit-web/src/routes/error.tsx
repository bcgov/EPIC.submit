import ErrorPageComponent from "@/components/ErrorPage";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/error")({
  component: ErrorPage,
  meta: () => [{ title: "Error" }],
});

function ErrorPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/logout" />;
  }

  return <ErrorPageComponent />;
}
