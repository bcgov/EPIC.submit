import { usePackageTableStore } from "../../../../src/components/Submission/packageTableStore";
import { QUERY_KEY } from "../../../../src/hooks/api/constants";
import { PACKAGE_STATUS } from "../../../../src/models/Package";
import { useAccount } from "../../../../src/store/accountStore";
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
});
