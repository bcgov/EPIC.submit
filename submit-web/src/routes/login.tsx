import { PageLoader } from "@/components/Shared/PageLoader";
import { useMounted } from "@/hooks/common";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/login")({
  component: NotFound,
});

function NotFound() {
  const { signinSilent } = useAuth();
  useMounted(() => {
    signinSilent();
  });
  return <PageLoader />;
}
