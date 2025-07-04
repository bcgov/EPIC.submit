import { mount } from "cypress/react18";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "react-oidc-context";
import { AppConfig, OidcConfig } from "../../../src/utils/config";
import { mockZustandStore, setupTokenStorage } from "../utils";
import { useAccount } from "../../../src/store/accountStore";
import { USER_TYPE } from "../../../src/models/User";
import { SubmissionPackage } from "../../../src/models/Package";
import { SUBMISSION_ITEM_STATUS } from "../../../src/models/Submission";
import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItemMethod,
} from "../../../src/models/SubmissionItem";
import { QUERY_KEY } from "../../../src/hooks/api/constants";
import { usePackageTableStore } from "../../../src/components/Submission/packageTableStore";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../../src/routeTree.gen";
import { EPIC_SUBMIT_ROLE } from "../../../src/models/Role";
import { AccountProject } from "../../../src/models/Project";

const mockSubmissionPackage1: SubmissionPackage = {
  account_project_id: 115,
  completed_on: undefined,
  id: 244,
  internal_staff_documents: [],
  items: [
    {
      id: 653,
      notes: [],
      package_id: 244,
      review: undefined,
      review_start_date: undefined,
      sort_order: 0,
      status: SUBMISSION_ITEM_STATUS.SUBMITTED.value,
      submissions: [],
      submitted_by: "",
      submitted_on: "",
      type: {
        id: 1,
        name: SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION,
        submission_method: SubmissionItemMethod.FORM_SUBMISSION,
      },
      type_id: 1,
      version: 1,
    },
    {
      id: 654,
      notes: [],
      package_id: 244,
      review: undefined,
      review_start_date: undefined,
      sort_order: 1,
      status: SUBMISSION_ITEM_STATUS.PASSED_CONSULTATION_CHECK.value,
      submissions: [],
      submitted_by: "",
      submitted_on: "",
      type: {
        id: 2,
        name: SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD,
        submission_method: SubmissionItemMethod.DOCUMENT_UPLOAD,
      },
      type_id: 2,
      version: 1,
    },
    {
      id: 655,
      notes: [],
      package_id: 244,
      review: undefined,
      review_start_date: undefined,
      sort_order: 2,
      status: SUBMISSION_ITEM_STATUS.UNDER_REVIEW.value,
      submissions: [],
      submitted_by: "",
      submitted_on: "",
      type: {
        id: 3,
        name: SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
        submission_method: SubmissionItemMethod.DOCUMENT_UPLOAD,
      },
      type_id: 3,
      version: 1,
    },
  ],
  meta: {
    main_condition: undefined,
    supporting_conditions: [],
  },
  name: "Construction Environmental Management Plan",
  review_status: undefined,
  status: [],
  submitted_by: "Eric Levasseur",
  submitted_on: undefined,
  type: {
    id: 1,
    name: "Management Plan",
  },
  type_id: 1,
  update_requests: [],
  version: {
    id: 234,
    is_approved: false,
    original_package_id: 195,
    version: 3,
    package_id: 244,
  },
};

const mockSubmissionPackage: SubmissionPackage = {
  account_project_id: 115,
  completed_on: undefined,
  id: 229,
  internal_staff_documents: [],
  items: [
    {
      id: 608,
      notes: [],
      package_id: 229,
      review: undefined,
      review_start_date: undefined,
      sort_order: 0,
      status: "SUBMITTED",
      submissions: [
        {
          created_date: "2025-06-16T21:22:35.475995",
          id: 849,
          item_id: 608,
          major_version: 1,
          minor_version: 1,
          status: "SUBMITTED",
          submitted_by: "Eric Levasseur",
          submitted_document: undefined,
          submitted_form: {
            id: 415,
            submission_json: {
              primaryContact: {
                company: "davidjnu",
                extensionNumber: "1232",
                givenName: "david",
                position: "david",
                surname: "david",
                workEmailAddress: "davidjnunezf@gmail.com",
                workPhoneNumber: "(321) 321-3232",
              },
              secondaryContact: {
                company: "tests",
                extensionNumber: "3213",
                givenName: "tet",
                position: "test",
                surname: "tet",
                workEmailAddress: "davidjnunezf@gmail.com",
                workPhoneNumber: "(132) 131-2321",
              },
            },
          },
          type: "FORM",
          version: "1.1",
        },
      ],
      submitted_by: "",
      submitted_on: "",
      type: {
        id: 1,
        name: SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION,
        submission_method: SubmissionItemMethod.FORM_SUBMISSION,
      },
      type_id: 1,
      version: 1,
    },
    {
      id: 609,
      notes: [],
      package_id: 229,
      review: {
        active: true,
        entries: [
          {
            entry: {
              passedConsultationCheck: "YES",
            },
            id: 243,
            review_id: 176,
            type: "MANAGER_CONFIRMATION",
            updated_by: "EAO TEST2",
            updated_date: "2025-06-17T21:41:17.783478",
          },
        ],
        id: 176,
        item_id: 609,
        status: "APPROVED",
      },
      review_start_date: "2025-06-17T21:36:22.304479",
      sort_order: 1,
      status: "PASSED_CONSULTATION_CHECK",
      submissions: [
        {
          id: 852,
          item_id: 609,
          major_version: 2,
          minor_version: 1,
          status: "APPROVED",
          submitted_by: "Eric Levasseur",
          created_date: "2025-06-17T21:36:22.304479",
          submitted_document: {
            folder: "consultation_records",
            id: 502,
            name: "Consultation_Record-10.pdf",
            url: "submissions/caribooGoldProject/consultation_records/e6973b44-1d66-4458-a693-f1a7885120c3.pdf",
          },
          submitted_form: undefined,
          type: "DOCUMENT",
          version: "2.1",
        },
        {
          id: 853,
          item_id: 609,
          major_version: 1,
          minor_version: 1,
          status: "APPROVED",
          submitted_by: "Eric Levasseur",
          created_date: "2025-06-17T21:36:22.304479",
          submitted_document: undefined,
          submitted_form: {
            id: 417,
            submission_json: {
              allPartiesConsulted: true,
              consultedParties: [],
              notes: "",
              planWasReviewed: true,
              writtenExplanationsProvidedToCommenters: true,
              writtenExplanationsProvidedToParties: true,
            },
          },
          type: "FORM",
          version: "1.1",
        },
        {
          created_date: "2025-06-17T21:37:14.655683",
          id: 858,
          item_id: 609,
          major_version: 2,
          minor_version: 2,
          status: "APPROVED",
          submitted_by: "Eric Levasseur",
          submitted_document: {
            folder: "consultation_records",
            id: 506,
            name: "Consultation_Record-4.pdf",
            url: "submissions/caribooGoldProject/consultation_records/9fc188a7-f265-4f9d-843a-7b1e5521d701.pdf",
          },
          submitted_form: undefined,
          type: "DOCUMENT",
          version: "2.2",
        },
      ],
      submitted_by: "Eric Levasseur",
      submitted_on: "2025-06-17T21:36:22.304479",
      type: {
        id: 2,
        name: SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD,
        submission_method: SubmissionItemMethod.FORM_SUBMISSION,
      },
      type_id: 2,
      version: 1,
    },
    {
      id: 610,
      notes: [],
      package_id: 229,
      review: undefined,
      review_start_date: "2025-06-17T21:41:17.847883",
      sort_order: 2,
      status: "UNDER_REVIEW",
      submissions: [
        {
          created_date: "2025-06-17T21:36:00.208263",
          id: 854,
          item_id: 610,
          major_version: 2,
          minor_version: 1,
          status: "SUBMITTED",
          submitted_by: "Eric Levasseur",
          submitted_document: {
            folder: "management_plans",
            id: 503,
            name: "MP2_ManagementPlan V1.7.pdf",
            url: "submissions/caribooGoldProject/management_plans/28a9ddd1-6265-4f07-9387-a7242bfc8e25.pdf",
          },
          submitted_form: undefined,
          type: "DOCUMENT",
          version: "2.1",
        },
        {
          created_date: "2025-06-17T21:36:07.415914",
          id: 855,
          item_id: 610,
          major_version: 2,
          minor_version: 1,
          status: "SUBMITTED",
          submitted_by: "Eric Levasseur",
          submitted_document: {
            folder: "supporting_documents",
            id: 504,
            name: "Supporting_Document.pdf",
            url: "submissions/caribooGoldProject/supporting_documents/b8f399a1-111a-4d0f-9619-717d06de24af.pdf",
          },
          submitted_form: undefined,
          type: "DOCUMENT",
          version: "2.1",
        },
        {
          created_date: "2025-06-17T21:36:13.191181",
          id: 856,
          item_id: 610,
          major_version: 2,
          minor_version: 1,
          status: "SUBMITTED",
          submitted_by: "Eric Levasseur",
          submitted_document: {
            folder: "supporting_documents",
            id: 505,
            name: "Supporting_Document.pdf",
            url: "submissions/caribooGoldProject/supporting_documents/ca7db716-d519-44d9-a632-e49f3c30ba68.pdf",
          },
          submitted_form: undefined,
          type: "DOCUMENT",
          version: "2.1",
        },
        {
          created_date: "2025-06-17T21:36:14.326029",
          id: 857,
          item_id: 610,
          major_version: 1,
          minor_version: 1,
          status: "SUBMITTED",
          submitted_by: "Eric Levasseur",
          submitted_document: undefined,
          submitted_form: {
            id: 418,
            submission_json: {
              allRequirementsAddressed: true,
              conditionSatisfied: true,
              informationAccurate: true,
              notes: "",
            },
          },
          type: "FORM",
          version: "1.1",
        },
      ],
      submitted_by: "Eric Levasseur",
      submitted_on: "2025-06-17T21:36:22.304479",
      type: {
        id: 3,
        name: SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
        submission_method: SubmissionItemMethod.DOCUMENT_UPLOAD,
      },
      type_id: 3,
      version: 1,
    },
  ],
  meta: {
    cc_completed_on: "2025-06-17T21:41:17.785085",
    cc_start_date: "2025-06-17T21:36:22.304479",
    condition: undefined,
    review_start_date: "2025-06-17T21:41:17.847883",
    supporting_conditions: [],
  },
  name: "Construction Environmental Management Plan",
  review_status: undefined,
  status: ["UNDER_REVIEW", "PASSED_CONSULTATION_CHECK"],
  submitted_by: "Eric Levasseur",
  submitted_on: "2025-06-17T21:37:23.266562",
  type: {
    id: 1,
    name: "Management Plan",
  },
  type_id: 1,
  update_requests: [
    {
      active: false,
      created_by: "EAO TEST2",
      created_date: "2025-06-17T21:36:39.362010",
      id: 217,
      note: "",
      reason: "bad",
      status: "ACCEPTED",
      submission_item_types: [2],
      submission_package_id: 229,
      type: "REVIEW",
    },
  ],
  version: {
    id: 219,
    package_id: 229,
    is_approved: false,
    original_package_id: 195,
    version: 2,
  },
};

const mockAccountProject: AccountProject = {
  account_id: 119,
  id: 115,
  packages: [mockSubmissionPackage],
  project: {
    ea_certificate: "M23-01",
    epic_guid: "5d40cc5b4cb2c7001b1336b8",
    id: 8501,
    name: "Cariboo Gold Project",
    proponent_id: 20,
    proponent_name: "Barkerville Gold Mines Ltd.",
  },
  project_id: 8501,
};

const mockAuthentication = {
  isAuthenticated: true,
  user: {
    profile: {
      name: "Test User",
      identity_provider: "idir",
      sub: "test-sub",
      iss: "https://test-issuer",
      aud: "test-audience",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    access_token: "test_access_token",
    session_state: "mock_session_state",
    token_type: "Bearer",
    state: {},
    expires_in: 3600,
    scope: "openid profile",
    id_token: "mock_id_token",
    refresh_token: "mock_refresh_token",
    expired: false,
    scopes: ["openid", "profile"],
    toStorageString: () => "",
  },
  signoutRedirect: () => Promise.resolve(),
  signinRedirect: () => Promise.resolve(),
  isLoading: false,
  // Mock required AuthContextProps properties
  settings: {
    authority: "https://test-issuer",
    client_id: "test-client-id",
    redirect_uri: "http://localhost/callback",
  },
  events: {} as any,
  clearStaleState: () => Promise.resolve(),
  removeUser: () => Promise.resolve(),
  signoutSilent: () => Promise.resolve(),
  signinSilent: () => Promise.resolve(null),
  signinPopup: () =>
    Promise.resolve({
      profile: { name: "Test User", identity_provider: "idir" },
      expired: false,
      scopes: ["openid", "profile"],
      toStorageString: () => "",
    } as any),
  signoutPopup: () => Promise.resolve(),
  startSilentRenew: () => Promise.resolve(),
  stopSilentRenew: () => Promise.resolve(),
  error: undefined,
  // Add missing AuthContextProps properties
  signinResourceOwnerCredentials: () =>
    Promise.resolve({
      profile: { name: "Test User", identity_provider: "idir" },
      expired: false,
      scopes: ["openid", "profile"],
      toStorageString: () => "",
    } as any),
  querySessionStatus: () => Promise.resolve(null),
  revokeTokens: () => Promise.resolve(),
};

const mockAccount = {
  isLoading: false,
  userType: USER_TYPE.STAFF,
  roles: [EPIC_SUBMIT_ROLE.eao_view],
};

describe("package table page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const router = createRouter({
    routeTree: routeTree,
    context: {
      authentication: mockAuthentication,
      queryClient: queryClient,
      account: mockAccount,
    },
  });

  beforeEach(() => {
    cy.viewport(1200, 800);
    mockZustandStore(useAccount, {
      userType: USER_TYPE.STAFF,
    });
    mockZustandStore(usePackageTableStore, {
      isValidating: false,
    });

    setupTokenStorage();
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/packages/244`, [
      mockSubmissionPackage,
    ]).as("getPackage");
    cy.intercept("GET", `${AppConfig.apiUrl}/staff/projects/115`, [
      mockAccountProject,
    ]).as("getAccountProject");
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/staff/documents/failed/items/*`,
      [],
    ).as("getFailedDocuments");
  });

  queryClient.setQueryData(
    [QUERY_KEY.SUBMISSION_PACKAGE, 244],
    mockSubmissionPackage,
  );
  queryClient.setQueryData(
    [QUERY_KEY.ACCOUNT_PROJECT, 115],
    mockAccountProject,
  );

  it("renders", () => {
    router.navigate({
      to: `/staff/projects/115/submission-packages/244`,
    });

    mount(
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...OidcConfig}>
          <RouterProvider
            router={router}
            context={{
              authentication: mockAuthentication,
              account: mockAccount,
            }}
          />
          ;
        </AuthProvider>
      </QueryClientProvider>,
    );

    cy.wait("@getPackage");
    cy.contains("Construction Environmental Management Plan");
  });
});
