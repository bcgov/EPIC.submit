import { usePackageTableStore } from "../../../../src/components/Submission/packageTableStore";
import { QUERY_KEY } from "../../../../src/hooks/api/constants";
import { PACKAGE_STATUS } from "../../../../src/models/Package";
import { useAccount } from "../../../../src/store/accountStore";
import { AppConfig } from "../../../../src/utils/config";
import {
  mockAccountProject,
  mockProponentAccount,
  mockSubmissionPackage,
} from "../../../utils/mockConstants";
import { mountPage } from "../../../utils/mountPage";
import {
  createTestQueryClient,
  createTestRouter,
  mockZustandStore,
  setupTokenStorage,
} from "../../../utils/testUtils";

describe("Submission Item Consultation Record Page", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
      reset: () => {},
    });
    setupTokenStorage();
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/projects/accounts/${mockProponentAccount.accountId}?search_text=&submitted_on_start=&submitted_on_end=`,
      {
        body: [mockAccountProject],
      },
    ).as("getAccountProjects");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/packages/${mockSubmissionPackage.id}`,
      {
        body: mockSubmissionPackage,
      },
    ).as("getSubmissionPackages");
  });

  it("test page renders", () => {
    const queryClient = createTestQueryClient();

    const mockPackageOne = {
      ...mockSubmissionPackage,
      name: "Test Package One",
    };

    const mockPackageTwo = {
      ...mockSubmissionPackage,
      name: "Test Package Two",
    };

    const mockPackageThree = {
      ...mockSubmissionPackage,
      name: "Test Package Three",
    };

    const mockPackageFour = {
      ...mockSubmissionPackage,
      name: "Test Package Four",
      completed_on: "2023-10-01T00:00:00Z",
      status: [PACKAGE_STATUS.SATISFIED],
    };

    const mockAccountProjectOne = {
      ...mockAccountProject,
      packages: [
        mockPackageOne,
        mockPackageTwo,
        mockPackageThree,
        mockPackageFour,
      ],
    };
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProjectOne.id],
      mockAccountProjectOne,
    );

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/projects/${mockAccountProjectOne.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains(mockAccountProjectOne.project.name).should("exist");

    cy.contains("p", "Active Submissions")
      .parents("div")
      .first()
      .within(() => {
        cy.contains(mockPackageOne.name).should("exist");
        cy.contains(mockPackageTwo.name).should("exist");
        cy.contains(mockPackageThree.name).should("exist");
        cy.contains(mockPackageFour.name).should("exist");
      });
    cy.contains("p", "Past Submissions")
      .parents("div")
      .first()
      .within(() => {
        cy.contains(mockPackageFour.name).should("exist");
      });
  });

  it("test clicking on a submission package navigates to the correct submission package page", () => {
    const queryClient = createTestQueryClient();

    const mockPackageOne = {
      ...mockSubmissionPackage,
      name: "Test Package One",
    };

    const mockAccountProjectOne = {
      ...mockAccountProject,
      packages: [mockPackageOne],
    };
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProjectOne.id],
      mockAccountProjectOne,
    );

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);
    cy.spy(router, "navigate").as("navigateSpy");

    router.navigate({
      to: `/proponent/projects/${mockAccountProjectOne.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains(mockPackageOne.name).click();
    cy.get("@navigateSpy").should("have.been.calledWith", {
      to: `/proponent/projects/${mockAccountProjectOne.id}/submission-packages/${mockPackageOne.id}`,
    });
  });

  it("test new submission button navigates to the correct page", () => {
    const queryClient = createTestQueryClient();

    const mockAccountProjectOne = {
      ...mockAccountProject,
      packages: [],
    };
    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProjectOne.id],
      mockAccountProjectOne,
    );

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);
    cy.spy(router, "navigate").as("navigateSpy");

    router.navigate({
      to: `/proponent/projects/${mockAccountProjectOne.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains("New Submission").click();
    cy.get("@navigateSpy").should("have.been.calledWith", {
      to: `/proponent/projects/${mockAccountProjectOne.id}/new-submission`,
    });
  });
});
