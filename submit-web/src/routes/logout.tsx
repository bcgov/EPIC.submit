import { PageLoader } from "@/components/Shared/PageLoader";
import { useMounted } from "@/hooks/common";
import { useAccount } from "@/store/accountStore";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/logout")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: search.redirect as string | undefined,
    };
  },
  component: Logout,
});

function Logout() {
  const { signoutSilent, isAuthenticated } = useAuth();
  const { reset } = useAccount();
  const search = Route.useSearch();

  const navigate = useNavigate();

  useMounted(() => {
    signoutSilent();
  });

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      if (search.redirect) {
        navigate({ to: search.redirect as any });
      } else {
        navigate({
          to: "/",
        });
      }
    }
  }, [isAuthenticated, navigate, reset, search.redirect]);

  return <PageLoader />;
}
