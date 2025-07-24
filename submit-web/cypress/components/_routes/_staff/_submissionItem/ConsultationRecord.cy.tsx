import {
  mockAccountProject,
  mockConsultationRecord,
  mockConsultationRecordItemPassed,
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
import { EPIC_SUBMIT_ROLE } from "../../../../../src/models/Role";
import { useAccount } from "../../../../../src/store/accountStore";
import { USER_TYPE } from "../../../../../src/models/User";

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
    const queryClient = createTestQueryClient({
      submissionPackage: mockSubmissionPackage,
      accountProject: mockAccountProject,
      submissionItem: mockConsultationRecord,
    });

    const router = createTestRouter(queryClient, mockStaffAccount);

    router.navigate({
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockConsultationRecord.id}`,
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

    cy.contains("Consultation Records Information").should("exist");
    cy.get("[data-testid='review-section']").should("be.visible");
  });

  it("test review section - manager", () => {
    const queryClient = createTestQueryClient({
      submissionPackage: mockSubmissionPackage,
      accountProject: mockAccountProject,
      submissionItem: mockConsultationRecordItemPassed,
    });

    const router = createTestRouter(queryClient, mockStaffAccount);

    router.navigate({
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockConsultationRecordItemPassed.id}`,
    });

    const roles = [
      EPIC_SUBMIT_ROLE.extended_eao_edit,
      EPIC_SUBMIT_ROLE.eao_create,
      EPIC_SUBMIT_ROLE.eao_edit,
      EPIC_SUBMIT_ROLE.eao_view,
    ];
    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
      roles,
      reset: () => {},
    });
    mountPage({
      queryClient,
      router,
      roles: [
        EPIC_SUBMIT_ROLE.extended_eao_edit,
        EPIC_SUBMIT_ROLE.eao_create,
        EPIC_SUBMIT_ROLE.eao_edit,
        EPIC_SUBMIT_ROLE.eao_view,
      ],
    });

    cy.get("[data-testid='review-section']")
      .find("input[type='radio'][value='YES']")
      .should("have.length", 2)
      .each(($radio) => cy.wrap($radio).should("be.checked"));

    cy.get("[data-testid='review-completed-notification']").should("exist");
  });

  it("test review section - staff", () => {
    const queryClient = createTestQueryClient({
      submissionPackage: mockSubmissionPackage,
      accountProject: mockAccountProject,
      submissionItem: mockConsultationRecordItemPassed,
    });

    const router = createTestRouter(queryClient, mockStaffAccount);

    router.navigate({
      to: `/staff/projects/${mockAccountProject.id}/submission-packages/${mockSubmissionPackage.id}/submissions/${mockConsultationRecordItemPassed.id}`,
    });

    const roles = [
      EPIC_SUBMIT_ROLE.eao_create,
      EPIC_SUBMIT_ROLE.eao_edit,
      EPIC_SUBMIT_ROLE.eao_view,
    ];

    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
      roles,
      reset: () => {},
    });

    mountPage({
      queryClient,
      router,
      roles: [
        EPIC_SUBMIT_ROLE.eao_create,
        EPIC_SUBMIT_ROLE.eao_edit,
        EPIC_SUBMIT_ROLE.eao_view,
      ],
    });

    cy.get("[data-testid='review-section']")
      .find("input[type='radio'][value='YES']")
      .should("have.length", 1)
      .each(($radio) => cy.wrap($radio).should("be.checked"));

    cy.get("[data-testid='review-completed-notification']").should("exist");
  });
});
