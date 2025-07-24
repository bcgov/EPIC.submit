import {
  mockAccountProject,
  mockConsultationRecord,
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
import { QUERY_KEY } from "../../../../../src/hooks/api/constants";
import { SUBMISSION_TYPE } from "../../../../../src/models/Submission";

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
    const mockPackage = {
      ...mockSubmissionPackage,
      submitted_on: undefined,
    };
    const queryClient = createTestQueryClient({
      submissionPackage: mockPackage,
      submissionItem: mockConsultationRecord,
    });

    queryClient.setQueryData(
      [QUERY_KEY.ACCOUNT_PROJECT, mockAccountProject.id],
      mockAccountProject,
    );
    mockZustandStore(useAccount, {
      reset: () => {},
      ...mockProponentAccount,
    });

    const router = createTestRouter(queryClient, mockProponentAccount);

    router.navigate({
      to: `/proponent/projects/${mockAccountProject.id}/submission-packages/${mockPackage.id}/submissions/${mockConsultationRecord.id}`,
    });

    mountPage({
      queryClient,
      router,
      mockAccount: mockProponentAccount,
    });

    cy.contains("Consultation Records Information").should("exist");

    const documents = mockConsultationRecord.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    );
    cy.get("[data-testid='document-table']")
      .find("tbody tr")
      .should("have.length", documents.length + 1)
      .and("contain.text", "consultation_record.pdf");
  });
});
