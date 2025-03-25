import { PageLoader } from "@/components/Shared/PageLoader";
import { useMounted } from "@/hooks/common";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/logout")({
  component: Logout,
});

function Logout() {
  const { signoutSilent } = useAuth();
  const navigate = useNavigate();
  useMounted(() => {
    signoutSilent();
    navigate({
      to: "/",
    });
  });
  return <PageLoader />;
}
