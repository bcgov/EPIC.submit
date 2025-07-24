import {
  mockAccountProject,
  mockManagementPlan,
  mockProponentAccount,
  mockSubmissionPackage,
} from "../../../../utils/mockConstants";
import { mountPage } from "../../../../utils/mountPage";
import {
  createTestQueryClient,
  createTestRouter,
  mockZustandStore,
  setupTokenStorage,
} from "../../../../utils/testUtils";
import { usePackageTableStore } from "../../../../../src/components/Submission/packageTableStore";
import { useAccount } from "../../../../../src/store/accountStore";

describe("Submission Item Management Plan Page", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
      reset: () => {},
    });
    setupTokenStorage();
  });

  it("test page renders", () => {
    const queryClient = createTestQueryClient({
      submissionPackage: mockSubmissionPackage,
      submissionItem: mockManagementPlan,
      accountProject: mockAccountProject,
    });

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockManagementPlan.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains("Management Plan").should("exist");
  });
});
