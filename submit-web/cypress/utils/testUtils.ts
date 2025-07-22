import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { QUERY_KEY } from "../../src/hooks/api/constants";
import { routeTree } from "../../src/routeTree.gen";
import { useAccount } from "../../src/store/accountStore";
import { USER_TYPE } from "../../src/models/User";
import { OidcConfig } from "../../src/utils/config";
import { mockAuthentication } from "./mockConstants";

export const mockZustandStore = (storeModule, initialState) => {
  const storeResetFn = storeModule.getState().reset;

  storeModule.setState(initialState, true); // Reset the store state to initialState

  // Clean up the mock after each test
  return () => {
    storeResetFn();
  };
};

export const setupTokenStorage = () => {
  sessionStorage.setItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
    JSON.stringify({
      access_token:
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImUtYzVzRWxUZFduVjZRQ3Z0dmw3VllHV3F5Z3U4LVRDTm9kcm93VncyUWsifQ.eyJleHAiOjE3NTE2Njk5MjUsImlhdCI6MTc1MTY2NjMyNSwiYXV0aF90aW1lIjoxNzUxNjY2MzI1LCJqdGkiOiIiLCJpc3MiOiJodHRwczovL3Rlc3QtaXNzdWVyIiwiYXVkIjpbImVwaWMtc3VibWl0IiwiYWNjb3VudCJdLCJzdWIiOiJ0ZXN0LXN1YiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImVwaWMtc3VibWl0Iiwic2lkIjoiIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6W10sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJlYW9fdmlldyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImVwaWMtc3VibWl0Ijp7InJvbGVzIjpbImVhb19lZGl0IiwiZXh0ZW5kZWRfZWFvX2VkaXQiLCJlYW9fY3JlYXRlIiwiZWFvX3ZpZXciXX0sImFjY291bnQiOnsicm9sZXMiOlsidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImlkZW50aXR5X3Byb3ZpZGVyIjoiaWRpciIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6IkVBTyBURVNUMiIsImdyb3VwcyI6WyIvU1VCTUlUL0VBT19NQU5BR0VSIl0sInByZWZlcnJlZF91c2VybmFtZSI6IkFAaWRpciIsImdpdmVuX25hbWUiOiJFQU8iLCJmYW1pbHlfbmFtZSI6IlRFU1QyIn0.3HfGfRnoNZPVqP51WeecJw7rf-NcUu-LUUlbD_eoG3MMHheD9Ea-mSbHcFRa-3r6YIEm316lTjnAqVi8eHLhETqkZ7z-PITo_MzMNqYRX2fZbbRiC_fzn0tAzZ7AB_ff2pYt3nLSSfk32rNUzxxq1Ktp9ZYIdRgLu6Twzxyd-dw2meaDPl3AqI2TlCEzGibFgvZ0lQqw4QzIHEWpLcdkwdZENwK9uZB3_8Maz7ZsDXLmBdwlLku5WMWvTle-749EqhW-TwFnvV3A_Csd105oEjo8f8LTvA1DfK4j9lfz-EhHy88SHjeDXVd719dg1Qh-oBCB4GajNNbAxsLxewjMxA",
    }),
  );
};

export const createTestQueryClient = (mockData) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  if (mockData.submissionPackage)
    queryClient.setQueryData(
      [QUERY_KEY.SUBMISSION_PACKAGE, mockData.submissionPackage.id],
      mockData.submissionPackage,
    );

  if (mockData.accountProject)
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockData.accountProject.id],
      mockData.accountProject,
    );

  if (mockData.submissionItem)
    queryClient.setQueryData(
      [QUERY_KEY.SUBMISSION_ITEM, mockData.submissionItem.id],
      mockData.submissionItem,
    );

  return queryClient;
};

export const createTestRouter = (queryClient, mockAccount?: any) =>
  createRouter({
    routeTree,
    context: {
      authentication: mockAuthentication,
      queryClient,
      account: mockAccount,
    },
  });

export const prepareAccountStore = (roles = []) => {
  mockZustandStore(useAccount, {
    userType: USER_TYPE.STAFF,
    roles,
    reset: () => {},
  });
};
