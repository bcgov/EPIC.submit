import { usePackageTableStore } from "../../../../../src/components/Submission/packageTableStore";
import { ACCOUNT_USER_PERMISSIONS } from "../../../../../src/models/Role";
import { useAccount } from "../../../../../src/store/accountStore";
import { AppConfig } from "../../../../../src/utils/config";
import {
  mockAccountUsers,
  mockProponentAccount,
} from "../../../../utils/mockConstants";
import { mountPage } from "../../../../utils/mountPage";
import {
  createTestQueryClient,
  createTestRouter,
  mockZustandStore,
  setupTokenStorage,
} from "../../../../utils/testUtils";

describe("Submission Item Consultation Record Page", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
      reset: () => {},
    });

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });
    setupTokenStorage();

    const searchParams = new URLSearchParams({
      include_invitees: "true",
      include_roles: "true",
    }).toString();

    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/accounts/${mockProponentAccount.accountId}/users?${searchParams}`,
      {
        body: mockAccountUsers,
      },
    ).as("getAccountUsers");
  });

  it("test page renders", () => {
    const queryClient = createTestQueryClient();

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/user-management`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    // Check that the number of trs under the tbody is equal to the number of users
    cy.get("tbody tr").should("have.length", mockAccountUsers.length);
  });

  it("test add user page renders", () => {
    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
      roles: [
        ACCOUNT_USER_PERMISSIONS.CREATE_PACKAGE,
        ACCOUNT_USER_PERMISSIONS.SUBMIT_PACKAGE,
        ACCOUNT_USER_PERMISSIONS.INVITE_USERS,
      ],
    });
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/accounts/${mockProponentAccount.accountId}/packages`,
      {
        body: [],
      },
    ).as("getAccountPackages");
    const queryClient = createTestQueryClient();

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/user-management`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    // Check that the number of trs under the tbody is equal to the number of users
    cy.get("[data-testid='add-user-button']").click();
    cy.contains("Add New User");
    cy.contains("Assign Application Access");
  });

  it("test unauthed user cannot access add user page", () => {
    const proponentAccount = {
      ...mockProponentAccount,
      roles: [],
    };
    mockZustandStore(useAccount, {
      reset: () => {},
      ...proponentAccount,
    });
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/accounts/${mockProponentAccount.accountId}/packages`,
      {
        body: [],
      },
    ).as("getAccountPackages");
    const queryClient = createTestQueryClient();

    const router = createTestRouter(queryClient, proponentAccount);

    router.navigate({
      to: `/proponent/user-management`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: proponentAccount,
    });

    cy.get("tbody tr").should("not.exist");
    cy.get("[data-testid='page-not-found']").should("exist");
  });
});
