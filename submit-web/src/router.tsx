import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "./store/accountStore";
import { useEffect } from "react";
import { getAccountQueryOptions } from "./hooks/api/useAccounts";

type RouterProviderWithAuthContextProps = Readonly<{
  router: any;
}>;
export default function RouterProviderWithAuthContext({
  router,
}: RouterProviderWithAuthContextProps) {
  const authentication = useAuth();
  const { data, isFetched } = useQuery(
    getAccountQueryOptions({
      guid: authentication?.user?.profile.sub,
      accessToken: authentication.user?.access_token,
    }),
  );

  const account = useAccount();
  const { setAccount } = account;

  useEffect(() => {
    if (isFetched) {
      router.invalidate();
      setAccount({
        ...data,
      });
    }
  }, [isFetched, data, setAccount, router]);

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function

    return authentication.events.addAccessTokenExpiring(() => {
      // eslint-disable-next-line no-console
      console.log("AccessTokenExpiring: Refreshing token");
      authentication.signinSilent();
    });
  }, [authentication]);

  useEffect(() => {
    if (authentication.user?.expired && authentication.isAuthenticated) {
      // eslint-disable-next-line no-console
      console.log("AccessToken expired");
      window.location.href = window.location.origin + "/logout";
    }
  }, [authentication.user?.expired, authentication.isAuthenticated]);

  return (
    <RouterProvider
      router={router}
      context={{
        authentication,
        account: {
          ...account,
          ...(data ?? {}),
        },
      }}
    />
  );
}
