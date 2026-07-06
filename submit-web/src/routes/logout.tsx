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
  const { signoutRedirect, isAuthenticated } = useAuth();
  const { reset } = useAccount();
  const search = Route.useSearch();

  const navigate = useNavigate();

  useMounted(() => {
    reset();
    signoutRedirect({
      post_logout_redirect_uri: search.redirect
        ? `${window.location.origin}${search.redirect}`
        : window.location.origin,
    });
  });

  // Fallback: if signoutRedirect doesn't navigate away (e.g. IdP doesn't
  // support end_session_endpoint), handle it client-side.
  useEffect(() => {
    if (!isAuthenticated) {
      if (search.redirect) {
        navigate({ to: search.redirect as any });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [isAuthenticated, navigate, search.redirect]);

  return <PageLoader />;
}
