import { Loader } from "@/components/Shared/Loader";
import { useAccount } from "@/store/accountStore";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: Auth,
});

function Auth() {
  const { isAuthenticated, signinRedirect, isLoading, user } = useAuth();
  const { setAccount } = useAccount();
  const proponent_id = user?.profile.sub;

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // signinRedirect();
    }
    if (isAuthenticated && !isLoading) {
      setAccount({ isLoading: false, proponentId: proponent_id });
    }
  }, [isAuthenticated, isLoading, signinRedirect, setAccount, proponent_id]);

  if (isLoading) {
    return <Loader />;
  }

  // if (!isAuthenticated) {
  //   return <Navigate to={"/"} />;
  // }

  return <Outlet />;
}
