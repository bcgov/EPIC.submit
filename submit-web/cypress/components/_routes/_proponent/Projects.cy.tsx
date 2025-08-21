import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../../utils";
import { useAccount } from "../../../../src/store/accountStore";
import { usePackageTableStore } from "../../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import {
  mockAccountProject,
  mockAuthentication,
  mockProponentAccount,
} from "../../../utils/mockConstants";
import { QUERY_KEY } from "../../../../src/hooks/api/constants";

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
        account: mockProponentAccount,
      },
    });

    router.navigate({
      to: `/proponent/projects`,
    });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
              account: mockProponentAccount,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
    mockZustandStore(useAccount, mockProponentAccount);
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
      reset: () => {},
    });

    setupTokenStorage();
  });

  it("test page renders", () => {
    queryClient.clear();
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/projects/accounts/${mockProponentAccount.accountId}?search_text=&submitted_on_start=&submitted_on_end= `,
      {
        body: [mockAccountProject],
      },
    ).as("getAccountProjects");

    mountDefaultPage();

    cy.contains(mockAccountProject.project.name).should("exist");
    cy.contains(mockAccountProject.packages[0].name).should("exist");
  });

  it("test clicking on a project navigates to the correct project page", () => {
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/projects/accounts/${mockProponentAccount.accountId}?search_text=&submitted_on_start=&submitted_on_end= `,
      {
        body: [mockAccountProject],
      },
    ).as("getAccountProjects");

    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
        account: mockProponentAccount,
      },
    });

    router.navigate({
      to: `/proponent/projects`,
    });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
              account: mockProponentAccount,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );

    cy.get("body").debug();
    cy.get("li").contains(mockAccountProject.project.name).click();
    cy.url().should("include", `/proponent/projects/${mockAccountProject.id}`);
  });
});
