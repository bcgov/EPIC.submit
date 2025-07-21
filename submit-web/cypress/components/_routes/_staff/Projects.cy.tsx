import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../../utils";
import { useAccount } from "../../../../src/store/accountStore";
import { USER_TYPE } from "../../../../src/models/User";
import { QUERY_KEY } from "../../../../src/hooks/api/constants";
import { usePackageTableStore } from "../../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import {
  mockStaffAccount,
  mockAccountProject,
  mockAuthentication,
} from "../../utils/mockConstants";

describe("projects page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const mountDefaultPage = () => {
    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
        account: mockStaffAccount,
      },
    });

    router.navigate({
      to: `/staff/projects`,
    });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
              account: mockStaffAccount,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
      reset: () => {},
    });
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
      reset: () => {},
    });

    setupTokenStorage();
  });

  it("test page renders", () => {
    queryClient.clear();
    const mockAccountProjectOne = {
      ...mockAccountProject,
      id: "1",
      project: {
        ...mockAccountProject.project,
        name: "Test Project 1",
      },
    };
    const mockAccountProjectTwo = {
      ...mockAccountProject,
      id: "2",
      project: {
        ...mockAccountProject.project,
        name: "Test Project 2",
      },
      packages: [
        {
          ...mockAccountProject.packages[0],
          id: 2,
          name: "Test Package 2",
        },
      ],
    };
    const projectPage = {
      projects: [mockAccountProjectOne, mockAccountProjectTwo],
      next_cursor: null,
      total: 2,
    };

    cy.intercept("GET", `${AppConfig.apiUrl}/staff/projects*`, {
      body: projectPage,
    }).as("getAccountProject");

    queryClient.setQueryData([QUERY_KEY.ACCOUNT_PROJECTS], projectPage);
    mountDefaultPage();

    cy.contains(mockAccountProjectOne.project.name).should("exist");
    cy.contains(mockAccountProjectTwo.project.name).should("exist");
    cy.contains(mockAccountProjectOne.packages[0].name).should("exist");
    cy.contains(mockAccountProjectTwo.packages[0].name).should("exist");
  });
});
