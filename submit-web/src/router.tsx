import {
  createRouter,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { useAuth } from "react-oidc-context";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useAccount } from "./store/accountStore";
import { useEffect } from "react";
import { getAccountQueryOptions } from "./hooks/api/useAccounts";

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
  }, [authentication.events, authentication.signinSilent]);

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
