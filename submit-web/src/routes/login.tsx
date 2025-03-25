import { PageLoader } from "@/components/Shared/PageLoader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { signinSilent, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      signinSilent();
    } else {
      navigate({
        to: "/oidc-callback",
      });
    }
  }, [isAuthenticated, navigate, signinSilent]);

  useEffect(() => {}, []);
  return <PageLoader />;
}
