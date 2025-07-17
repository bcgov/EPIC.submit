import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../utils";
import { useAccount } from "../../../src/store/accountStore";
import { USER_TYPE } from "../../../src/models/User";
import { ACTIVITY_LOG_ENTITY_TYPE } from "../../../src/models/ActivityLog";
import { QUERY_KEY } from "../../../src/hooks/api/constants";
import { usePackageTableStore } from "../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../src/routeTree.gen";
import {
  mockAccount,
  mockAccountProject,
  mockActivityLogs,
  mockAuthentication,
  mockConsultationRecord,
  mockConsultationRecordDocument,
  mockInternalStaffDocuments,
  mockManagementPlan,
  mockManagementPlanDocument,
  mockSubmissionPackage,
  mockSupportingDocument,
} from "../utils/mockConstants";

const mountDefaultPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  queryClient.setQueryData(
    [QUERY_KEY.SUBMISSION_PACKAGE, mockSubmissionPackage.id],
    mockSubmissionPackage
  );
  queryClient.setQueryData(
    [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
    mockAccountProject
  );
  queryClient.setQueryData(
    [
      QUERY_KEY.ACTIVITY_LOGS,
      mockSubmissionPackage.version.original_package_id,
      ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
    ],
    mockActivityLogs
  );

  const router = createRouter({
    routeTree: routeTree,
    context: {
      authentication: mockAuthentication,
      queryClient: queryClient,
      account: mockAccount,
    },
  });

  router.navigate({
    to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/internal-documents/`,
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
    </QueryClientProvider>
  );
};

describe("package table page", () => {
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
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.id}`,
      {
        body: mockSubmissionPackage,
      }
    ).as("getPackage");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/projects/${mockAccountProject.id}`,
      {
        body: mockAccountProject,
      }
    ).as("getAccountProject");
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/documents/failed/items/*`, {
      body: [],
    }).as("getFailedDocuments");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.version.original_package_id}/versions`,
      {
        body: [],
      }
    ).as("getPackageVersions");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/activity-logs/PACKAGE/${mockSubmissionPackage.version.original_package_id}`,
      {
        body: mockActivityLogs,
      }
    ).as("getActivityLogs");
  });

  it("test page renders", () => {
    mountDefaultPage();

    cy.contains(mockSubmissionPackage.name).should("exist");
    cy.contains(mockManagementPlan.type.name).should("exist");
    cy.contains("tr", "EAO Internal Documents");
    cy.contains("EAO Internal Documents").should("exist");
    cy.get('[data-cy="uploader"]').should("exist").and("be.visible");
    cy.get('[data-cy="add-link-section"]').should("exist").and("be.visible");
  });

  it("test document rendering", () => {
    mountDefaultPage();
    mockInternalStaffDocuments.forEach((doc) => {
      cy.contains(doc.name)
        .should("exist")
        .parents("tr")
        .find('[data-cy="remove-button"]')
        .should("exist");

      cy.contains(
        doc.created_by_user.staff_user.first_name +
          " " +
          doc.created_by_user.staff_user.last_name
      ).should("exist");
    });
  });

  it("test Close button functionality", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      [QUERY_KEY.SUBMISSION_PACKAGE, mockSubmissionPackage.id],
      mockSubmissionPackage
    );
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject
    );

    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
        account: mockAccount,
      },
    });

    // Spy on navigate AFTER router creation but BEFORE initial navigation for the test
    cy.spy(router, "navigate").as("navigateSpy");

    router.navigate({
      // This is the initial navigation to the page under test
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/internal-documents`,
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
        </AuthProvider>
      </QueryClientProvider>
    );

    cy.contains("button", "Close").should("be.visible").click();
    cy.get("@navigateSpy").should("have.been.calledWith", {
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}`,
    });
  });
});
