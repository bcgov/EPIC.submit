import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { AccountStoreState, useAccount } from "./store/accountStore";
import { useEffect, useState } from "react";
import { getAccount } from "./hooks/api/useAccounts";

type RouterProviderWithAuthContextProps = Readonly<{
  router: any;
}>;
export default function RouterProviderWithAuthContext({
  router,
}: RouterProviderWithAuthContextProps) {
  const authentication = useAuth();

  const account = useAccount();
  const { setAccount } = account;
  const [accountData, setAccountData] = useState<Partial<AccountStoreState>>(
    {},
  );

  const getAccountData = async () => {
    try {
      const data = await getAccount(
        authentication?.user?.profile.sub,
        authentication.user?.access_token,
      );
      router.invalidate();
      setAccountData(data);
      setAccount({
        ...data,
      });
    } catch (error) {
      console.error("Failed to fetch account data:", error);
    }
  };

  useEffect(() => {
    getAccountData();
  }, [authentication]);

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function

    return authentication.events.addAccessTokenExpiring(() => {
      // eslint-disable-next-line no-console
      console.log("AccessTokenExpiring: Refreshing token");
      authentication.signinSilent();
    });
  }, [authentication]);

  useEffect(() => {
    if (authentication.user?.expired) {
      // eslint-disable-next-line no-console
      console.log("AccessToken expired");
    }
  }, [authentication.user?.expired]);

  return (
    <RouterProvider
      router={router}
      context={{
        authentication,
        account: {
          ...account,
          ...(accountData ?? {}),
        },
      }}
    />
  );
}
