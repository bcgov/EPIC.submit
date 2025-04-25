import { PageLoader } from "@/components/Shared/PageLoader";
import { useMounted } from "@/hooks/common";
import { useAccount } from "@/store/accountStore";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/logout")({
  component: Logout,
});

function Logout() {
  const { signoutSilent, isAuthenticated } = useAuth();
  const { reset } = useAccount();

  const navigate = useNavigate();

  useMounted(() => {
    signoutSilent();
    reset();
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({
        to: "/",
      });
    }
  }, [isAuthenticated, navigate]);

  return <PageLoader />;
}
