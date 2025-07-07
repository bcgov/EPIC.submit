import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../utils";
import { useAccount } from "../../../src/store/accountStore";
import { USER_TYPE } from "../../../src/models/User";
import { QUERY_KEY } from "../../../src/hooks/api/constants";
import { usePackageTableStore } from "../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../src/routeTree.gen";
import {
  mockAccount,
  mockAccountProject,
  mockAuthentication,
  mockConsultationrecord,
  mockContactInformation,
  mockManagementPlan,
  mockSubmissionPackage,
} from "../utils/mockConstants";

describe("package table page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const router = createRouter({
    routeTree: routeTree,
    context: {
      authentication: mockAuthentication,
      queryClient: queryClient,
      account: mockAccount,
    },
  });

  beforeEach(() => {
    cy.viewport(1200, 800);
    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
    });
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
    });

    setupTokenStorage();
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/packages/244`, [
      mockSubmissionPackage,
    ]).as("getPackage");
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/projects/115`, [
      mockAccountProject,
    ]).as("getAccountProject");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/documents/failed/items/*`,
      [],
    ).as("getFailedDocuments");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/244/versions`,
      [],
    ).as("getPackageVersions");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/activity-logs/PACKAGE/244`,
      [],
    ).as("getActivityLogs");
  });

  queryClient.setQueryData(
    [QUERY_KEY.SUBMISSION_PACKAGE, 244],
    mockSubmissionPackage,
  );
  queryClient.setQueryData(
    [QUERY_KEY.ACCOUNT_PROJECT, 115],
    mockAccountProject,
  );

  it("renders", () => {
    router.navigate({
      to: `/staff/projects/115/submission-packages/244`,
    });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
              account: mockAccount,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );

    cy.contains(mockSubmissionPackage.name).should("exist");
    cy.contains(mockConsultationrecord.type.name).should("exist");
    cy.contains(mockManagementPlan.type.name).should("exist");
    cy.contains(mockContactInformation.type.name).should("exist");
    cy.contains("EAO Internal Documents").should("exist");
  });
});
