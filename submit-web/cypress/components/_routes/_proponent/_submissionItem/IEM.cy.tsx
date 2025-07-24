import {
  mockAccountProject,
  mockIEM,
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

describe("Submission Item IEM Page", () => {
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
      submissionItem: mockIEM,
      accountProject: mockAccountProject,
    });

    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockIEM.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains("Independent Environmental Monitor Terms of Engagement").should(
      "exist",
    );
  });
});
