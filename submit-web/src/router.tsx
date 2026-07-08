import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { AccountStoreState, useAccount } from "./store/accountStore";
import { useCallback, useEffect, useState } from "react";
import { getAccount } from "./hooks/api/useAccounts";
import { notify } from "./components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import { trackAnalytics } from "@epic/centre-analytics";
import { AppConfig } from "./utils/config";

type RouterProviderWithAuthContextProps = Readonly<{
  router: any;
}>;
export default function RouterProviderWithAuthContext({
  router,
}: RouterProviderWithAuthContextProps) {
  const authentication = useAuth();

  // Record user login analytics
  trackAnalytics({
    appName: 'epic_submit',
    centreApiUrl: AppConfig.centreApiUrl,
    enabled: authentication.isAuthenticated && !!authentication.user,
  });

  const account = useAccount();
  const { setAccount } = account;
  const [accountData, setAccountData] = useState<Partial<AccountStoreState>>(
    {},
  );

  const getAccountData = useCallback(async () => {
    try {
      const data = await getAccount(
        authentication?.user?.profile.preferred_username,
        authentication.user?.access_token,
      );
      router.invalidate();
      setAccountData(data);
      setAccount({
        ...data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : "Unknown error";
      notify.error(`Failed to load account data: ${errorMessage}`);
      setAccount({ isLoading: false });
    }
  }, [authentication, router, setAccount]);

  useEffect(() => {
    getAccountData();
  }, [authentication, getAccountData]);

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
          ...(accountData ?? {}),
        },
      }}
    />
  );
}
