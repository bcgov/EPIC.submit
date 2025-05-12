import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { useAuth } from "react-oidc-context";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useAccount } from "./store/accountStore";
import { useEffect, useState } from "react";
import { getAccountQueryOptions } from "./hooks/api/useAccounts";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { useRecordUserTermsOfService } from "@/hooks/api/useAccountUsers";
import { USER_TYPE } from "@/models/User";

const queryClient = new QueryClient();
// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    // authentication will initially be undefined
    // We'll be passing down the authentication state from within a React component
    authentication: undefined!,
    account: undefined!,
    queryClient,
  },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function RouterProviderWithAuthContext() {
  const authentication = useAuth();
  const { data, isFetched } = useQuery(
    getAccountQueryOptions({
      guid: authentication?.user?.profile.sub,
      accessToken: authentication.user?.access_token,
    }),
  );

  const account = useAccount();
  const { setAccount } = account;

  const [termsAccepted, setTermsAccepted] = useState(false);
  const hasValidAccountData = !!data?.userId;
  const needsTermsAgreement =
    isFetched &&
    hasValidAccountData &&
    !data.agreedTerms &&
    !termsAccepted &&
    data.userType !== USER_TYPE.STAFF;

  const { mutate: recordTermsOfService } = useRecordUserTermsOfService(
    () => {
      setTermsAccepted(true);
    },
    (error) => {
      console.error("Failed to record terms of service:", error);
    },
  );

  useEffect(() => {
    if (isFetched) {
      router.invalidate();
      setAccount({
        ...data,
      });
    }
  }, [isFetched, data, setAccount]);

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
  }, [authentication]);

  const handleAgree = (termsId: number | null) => {
    if (!data?.userManagementRole?.account_user_id || !termsId) return;

    recordTermsOfService({
      account_user_id: data.userManagementRole.account_user_id,
      agreed_terms_of_service_id: termsId,
      agreed_terms: true,
    });
  };

  return (
    <>
      {needsTermsAgreement && (
        <TermsModal
          open
          onClose={() => {}}
          onAgreeConfirmed={handleAgree}
        />
      )}
      {!needsTermsAgreement && (
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
      )}
    </>
  );
}
