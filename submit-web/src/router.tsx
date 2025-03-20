import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { useAuth } from "react-oidc-context";
import { QueryClient } from "@tanstack/react-query";
import { useAccount } from "./store/accountStore";

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
  const account = useAccount();
  console.log("account A", account);
  return (
    <RouterProvider router={router} context={{ authentication, account }} />
  );
}
