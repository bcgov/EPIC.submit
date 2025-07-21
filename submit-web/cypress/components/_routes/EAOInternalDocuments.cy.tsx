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
  mockStaffAccount,
  mockAccountProject,
  mockActivityLogs,
  mockAuthentication,
  mockInternalStaffDocuments,
  mockManagementPlan,
  mockSubmissionPackage,
} from "../utils/mockConstants";
import { InternalStaffDocument } from "../../../src/models/SubmissionItem";
import { USER_MANAGEMENT_ROLE } from "../../../src/models/Role";

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
    mockSubmissionPackage,
  );
  queryClient.setQueryData(
    [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
    mockAccountProject,
  );
  queryClient.setQueryData(
    [
      QUERY_KEY.ACTIVITY_LOGS,
      mockSubmissionPackage.version.original_package_id,
      ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
    ],
    mockActivityLogs,
  );

  const router = createRouter({
    routeTree: routeTree,
    context: {
      authentication: mockAuthentication,
      queryClient: queryClient,
      account: mockStaffAccount,
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
            account: mockStaffAccount,
          }}
        />
        ;
      </AuthProvider>
    </QueryClientProvider>,
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
      },
    ).as("getPackage");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/projects/${mockAccountProject.id}`,
      {
        body: mockAccountProject,
      },
    ).as("getAccountProject");
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/documents/failed/items/*`, {
      body: [],
    }).as("getFailedDocuments");

    cy.intercept(
      "POST",
      `${AppConfig.apiUrl}/staff/internal-staff-documents/packages/${mockSubmissionPackage.id}`,
      (req) => {
        const newDoc: InternalStaffDocument = {
          id: 999,
          name: "Mock Added Doc",
          url: "https://mock.link",
          type: "LINK",
          item_id: 101,
          created_by: "Jane Doe",
          created_date: "2025-05-02T09:30:00.000Z",
          created_by_user: {
            id: 1,
            auth_guid: "staff-user-guid-1",
            type: "STAFF",
            account_user: {
              id: 11,
              account_id: 201,
              first_name: "Jane",
              last_name: "Doe",
              full_name: "Jane Doe",
              position: "Environmental Analyst",
              work_email_address: "jane.doe@example.com",
              work_contact_number: "123-456-7890",
              account: {
                id: 201,
                proponent_id: 88,
              },
              role: {
                account_project_id: null,
                account_user_id: 11,
                package_ids: [],
                original_package_ids: [],
                package_names: [],
                role_id: 1,
                role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
                permissions: ["read", "write"],
              },
              has_agreed_to_terms: true,
            },
            staff_user: {
              id: 31,
              first_name: "Jane",
              last_name: "Doe",
              work_email_address: "jane.doe@example.com",
              user_id: 1,
            },
          },
        };

        // Simulate optimistic update in mock data
        mockSubmissionPackage.internal_staff_documents?.push(newDoc);

        req.reply({
          statusCode: 200,
          body: newDoc,
        });
      },
    ).as("createInternalDoc");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.version.original_package_id}/versions`,
      {
        body: [],
      },
    ).as("getPackageVersions");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/activity-logs/PACKAGE/${mockSubmissionPackage.version.original_package_id}`,
      {
        body: mockActivityLogs,
      },
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
          doc.created_by_user.staff_user.last_name,
      ).should("exist");
    });
  });

  it("should allow user to add a document link and refresh the view", () => {
    const testName = "Mock Added Doc";
    const testLink = "https://mock.link";

    // Mount the page as normal
    mountDefaultPage();

    // Fill out the form and submit
    cy.get('[data-cy="add-link-section"]').within(() => {
      cy.get('input[name="link"]').type(testLink);
      cy.get('input[name="documentName"]').type(testName);
      cy.contains("button", "Save Link").click();
    });

    // Wait for the mutation to complete
    cy.wait("@createInternalDoc").then(() => {
      // Refresh QueryClient with updated mock
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      queryClient.setQueryData(
        [QUERY_KEY.SUBMISSION_PACKAGE, mockSubmissionPackage.id],
        { ...mockSubmissionPackage },
      );

      queryClient.setQueryData(
        [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
        mockAccountProject,
      );

      queryClient.setQueryData(
        [
          QUERY_KEY.ACTIVITY_LOGS,
          mockSubmissionPackage.version.original_package_id,
          ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
        ],
        mockActivityLogs,
      );

      const router = createRouter({
        routeTree,
        context: {
          authentication: mockAuthentication,
          queryClient,
          account: mockStaffAccount,
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
                account: mockStaffAccount,
              }}
            />
          </AuthProvider>
        </QueryClientProvider>,
      );

      // Assert new document is now visible
      cy.contains(testName).should("exist");

      // Optional: check Remove button
      cy.contains(testName)
        .parents("tr")
        .within(() => {
          cy.get('[data-cy="remove-button"]').should("exist");
        });
    });
  });
  it("test Close button functionality", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      [QUERY_KEY.SUBMISSION_PACKAGE, mockSubmissionPackage.id],
      mockSubmissionPackage,
    );
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );

    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
        account: mockStaffAccount,
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
              account: mockStaffAccount,
            }}
          />
        </AuthProvider>
      </QueryClientProvider>,
    );

    cy.contains("button", "Close").should("be.visible").click();
    cy.get("@navigateSpy").should("have.been.calledWith", {
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}`,
    });
  });
});
