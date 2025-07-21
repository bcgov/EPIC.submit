import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { OidcConfig } from "../../../../src/utils/config";
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
  mockConsultationRecord,
  mockSubmissionPackage,
  mockConsultationRecordItemPassed,
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
    [QUERY_KEY.SUBMISSION_ITEM, mockConsultationRecord.id],
    mockConsultationRecord,
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
    to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockConsultationRecord.id}`,
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
  });

  it("test page renders", () => {
    mountDefaultPage();

    cy.contains("Consultation Records Information").should("exist");
    cy.get("[data-testid='review-section']").should("be.visible");
  });

  it("test review section", () => {
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
      [QUERY_KEY.SUBMISSION_ITEM, mockConsultationRecordItemPassed.id],
      mockConsultationRecordItemPassed,
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
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockConsultationRecordItemPassed.id}`,
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

    cy.contains("Consultation Records Information").should("exist");
    cy.get("[data-testid='review-section']").should("be.visible");
    cy.get("[data-testid='review-completed-notification']").should("exist");
  });
});
