import {
  mockAccountProject,
  mockIEM,
  mockStaffAccount,
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
import { USER_TYPE } from "../../../../../src/models/User";

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
      accountProject: mockAccountProject,
      submissionItem: mockIEM,
    });

    const router = createTestRouter(queryClient, mockStaffAccount);

    router.navigate({
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockIEM.id}`,
    });

    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
      roles: [],
      reset: () => {},
    });
    mountPage({
      queryClient,
      router,
      roles: [],
    });

    cy.contains("Independent Environmental Monitor Terms of Engagement").should("exist");
    cy.get("[data-testid='review-section']").should("be.visible");
  });
});
