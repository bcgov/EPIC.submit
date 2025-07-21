import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../../utils";
import { useAccount } from "../../../../src/store/accountStore";
import { USER_TYPE } from "../../../../src/models/User";
import { ACTIVITY_LOG_ENTITY_TYPE } from "../../../../src/models/ActivityLog";
import { QUERY_KEY } from "../../../../src/hooks/api/constants";
import { usePackageTableStore } from "../../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../../src/routeTree.gen";
import {
  mockStaffAccount,
  mockAccountProject,
  mockActivityLogs,
  mockAuthentication,
  mockConsultationRecord,
  mockConsultationRecordDocument,
  mockContactInformation,
  mockManagementPlan,
  mockManagementPlanDocument,
  mockSubmissionPackage,
  mockSupportingDocument,
} from "../../utils/mockConstants";

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
    to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}`,
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
    cy.contains(mockConsultationRecord.type.name).should("exist");
    cy.contains(mockManagementPlan.type.name).should("exist");
    cy.contains("tr", mockConsultationRecord.type.name);
    cy.contains("tr", mockManagementPlan.type.name);

    cy.contains(mockContactInformation.type.name).should("exist");
    cy.contains("EAO Internal Documents").should("exist");
  });

  it("test document rendering", () => {
    mountDefaultPage();
    // Find the row for the consultation record
    cy.contains("tr", mockConsultationRecord.type.name)
      .parent()
      .within(() => {
        // There should be one document under the consultation record
        cy.contains(
          String(mockConsultationRecordDocument.submitted_document?.name),
        ).should("exist");
      });

    // Find the row for the management plan
    cy.contains("tr", mockManagementPlan.type.name)
      .parent() // get the tbody or table section
      .within(() => {
        // The next two rows should be the management plan document and the supporting document
        cy.contains(
          String(mockManagementPlanDocument.submitted_document?.name),
        ).should("exist");
        cy.contains(
          String(mockSupportingDocument.submitted_document?.name),
        ).should("exist");
      });
  });

  it("test activity logs rendering", () => {
    mountDefaultPage();

    cy.contains("Submission History").should("exist").click();
    cy.get("[data-testid='history-table']").within(() => {
      cy.get("tbody tr").should("have.length", mockActivityLogs.length);
    });
  });

  it("should display SuccessBox when the package is the latest approved version", () => {
    const approvedPackage = {
      ...mockSubmissionPackage,
      version: {
        ...mockSubmissionPackage.version,
        is_approved: true,
        version: 2,
      },
    };
    const packageVersions = [
      { package_id: 1, version: 1, is_approved: true, name: "v1" },
      {
        package_id: mockSubmissionPackage.id,
        version: 2,
        is_approved: true,
        name: "v2",
      },
    ];

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.id}`,
      {
        body: approvedPackage,
      },
    ).as("getApprovedPackage");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.version.original_package_id}/versions`,
      {
        body: packageVersions,
      },
    ).as("getApprovedPackageVersions");

    // Custom mount for this specific scenario
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      // Seed the specific package
      [QUERY_KEY.SUBMISSION_PACKAGE, approvedPackage.id],
      approvedPackage,
    );
    queryClient.setQueryData(
      // Seed account project
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );
    queryClient.setQueryData(
      // Seed activity logs
      [
        QUERY_KEY.ACTIVITY_LOGS,
        approvedPackage.version.original_package_id,
        ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
      ],
      mockActivityLogs,
    );
    queryClient.setQueryData(
      [QUERY_KEY.PACKAGE_VERSIONS, approvedPackage.version.original_package_id],
      packageVersions,
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
      // Navigate to the correct package ID
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${approvedPackage.id}`,
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

    cy.contains(
      "This submission is the version the EAO has finalized for implementation.",
    ).should("be.visible");
    cy.contains(
      "Please Note: This submission is still pending EAO review.",
    ).should("not.exist");
  });

  it("should display WarningBox when the package is newer than last approved but not approved", () => {
    const newerUnapprovedPackage = {
      ...mockSubmissionPackage,
      id: 27, // different id for this specific test case if needed
      version: {
        ...mockSubmissionPackage.version,
        is_approved: false,
        version: 3, // Newer version
      },
    };

    const packageVersions = [
      { package_id: 1, version: 1, is_approved: true, name: "v1" },
      { package_id: 2, version: 2, is_approved: true, name: "v2" }, // Last approved is v2
      {
        package_id: 27,
        version: 3,
        is_approved: false,
        name: "v3",
      },
    ];

    // Update intercepts for this specific package ID and original_package_id if they differ
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${newerUnapprovedPackage.id}`,
      {
        body: newerUnapprovedPackage,
      },
    ).as("getNewerUnapprovedPackage");

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${newerUnapprovedPackage.version.original_package_id}/versions`,
      {
        body: packageVersions,
      },
    ).as("getMixedPackageVersions");

    // Adjust mountDefaultPage or how queryClient is pre-filled if packageId changes for the route
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      [QUERY_KEY.SUBMISSION_PACKAGE, newerUnapprovedPackage.id],
      newerUnapprovedPackage,
    );
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );
    queryClient.setQueryData(
      [
        QUERY_KEY.ACTIVITY_LOGS,
        newerUnapprovedPackage.version.original_package_id,
        ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
      ],
      mockActivityLogs,
    );
    queryClient.setQueryData(
      [
        QUERY_KEY.PACKAGE_VERSIONS,
        newerUnapprovedPackage.version.original_package_id,
      ],
      packageVersions,
    );

    const router = createRouter({
      routeTree: routeTree,
      context: {
        authentication: mockAuthentication,
        queryClient: queryClient,
        account: mockStaffAccount,
      },
    });

    // Navigate to the page with the ID of the newerUnapprovedPackage
    router.navigate({
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${newerUnapprovedPackage.id}`,
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

    cy.contains(
      "Please Note: This submission is still pending EAO review.",
    ).should("be.visible");
    cy.contains(
      "This submission is the version the EAO has finalized for implementation.",
    ).should("not.exist");
  });

  it("should not display SuccessBox or WarningBox for a package that is old or first unapproved", () => {
    const oldUnapprovedPackage = {
      ...mockSubmissionPackage, // Use the default mock ID
      version: {
        ...mockSubmissionPackage.version,
        is_approved: false,
        version: 1, // Assuming this is the first version or an old one
      },
    };
    const packageVersions = [
      // Only this version exists, or others are newer but this isn't special
      {
        package_id: mockSubmissionPackage.id,
        version: 1,
        is_approved: false,
        name: "v1",
      },
    ];
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.id}`,
      {
        body: oldUnapprovedPackage,
      },
    ).as("getOldPackage");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/packages/${mockSubmissionPackage.version.original_package_id}/versions`,
      {
        body: packageVersions,
      },
    ).as("getOldPackageVersions");

    // Custom mount for this specific scenario
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      // Seed the specific package
      [QUERY_KEY.SUBMISSION_PACKAGE, oldUnapprovedPackage.id],
      oldUnapprovedPackage,
    );
    queryClient.setQueryData(
      // Seed account project
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );
    queryClient.setQueryData(
      // Seed activity logs
      [
        QUERY_KEY.ACTIVITY_LOGS,
        oldUnapprovedPackage.version.original_package_id,
        ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
      ],
      mockActivityLogs,
    );
    queryClient.setQueryData(
      [
        QUERY_KEY.PACKAGE_VERSIONS,
        oldUnapprovedPackage.version.original_package_id,
      ],
      packageVersions,
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
      // Navigate to the correct package ID
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${oldUnapprovedPackage.id}`,
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

    cy.contains(
      "This submission is the version the EAO has finalized for implementation.",
    ).should("not.exist");
    cy.contains(
      "Please Note: This submission is still pending EAO review.",
    ).should("not.exist");
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
      // history: Cypress.routerHistory, // Removed: Not needed, router will use memory history
    });

    // Spy on navigate AFTER router creation but BEFORE initial navigation for the test
    cy.spy(router, "navigate").as("navigateSpy");

    router.navigate({
      // This is the initial navigation to the page under test
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}`,
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
      to: `/staff/projects/${mockAccountProject.id}`,
    });
  });

  it("renders UpdateRequestWidget", () => {
    mountDefaultPage();
    // Assuming UpdateRequestWidget has a distinct element or data-testid
    // For now, let's check for a known text/element if possible, or its container
    // This might need adjustment based on UpdateRequestWidget's actual content
    cy.get("[data-testid='update-request-accordion']").should("be.visible");
  });
});
