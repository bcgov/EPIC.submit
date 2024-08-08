import { Loader } from "@/components/Shared/Loader";
import { useGetUserByGuid } from "@/hooks/useAccounts";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback")({
  component: OidcCallback,
});

function OidcCallback() {
  const { error: getAuthError, user: kcUser } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const proponent_id = params.get("proponent_id");

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  if (getAuthError || isUserError) {
    return <Navigate to="/error" />;
  }

  if (isUserLoading) {
    return <Loader />;
  }

  if (userData?.account) {
    return <Navigate to="/profile" />;
  }

  return (
    <Navigate
      to="/registration/create-account"
      search={{
        proponent_id: proponent_id ? Number.parseInt(proponent_id) : undefined,
      }}
    />
  );
}
