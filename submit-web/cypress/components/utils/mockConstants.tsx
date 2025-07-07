import { SubmissionPackage } from "../../../src/models/Package";
import { AccountProject } from "../../../src/models/Project";
import { EPIC_SUBMIT_ROLE } from "../../../src/models/Role";
import {
  Submission,
  SUBMISSION_ITEM_STATUS,
} from "../../../src/models/Submission";
import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItemMethod,
} from "../../../src/models/SubmissionItem";
import { USER_TYPE } from "../../../src/models/User";

export const mockConsultationRecordDocument: Submission = {
  created_date: "2025-04-29T14:24:36.093429",
  id: 726,
  item_id: 555,
  major_version: 1,
  minor_version: 1,
  status: "SUBMITTED",
  submitted_by: "David d",
  submitted_document: {
    folder: "consultation_records",
    id: 417,
    name: "consultation_record.pdf",
    url: "folder/consultation_record.pdf",
  },
  type: "DOCUMENT",
  version: "1.1",
};

export const mockManagementPlanDocument: Submission = {
  created_date: "2025-05-01T10:15:20.123456",
  id: 727,
  item_id: 655,
  major_version: 1,
  minor_version: 0,
  status: "SUBMITTED",
  submitted_by: "Alice A",
  submitted_document: {
    folder: "management_plans",
    id: 418,
    name: "management_plan.pdf",
    url: "management_plans/management_plan.pdf",
  },
  type: "DOCUMENT",
  version: "1.0",
};

export const mockSupportingDocument: Submission = {
  created_date: "2025-05-02T09:30:00.000000",
  id: 728,
  item_id: 656,
  major_version: 1,
  minor_version: 0,
  status: "SUBMITTED",
  submitted_by: "Bob B",
  submitted_document: {
    folder: "supporting_documents",
    id: 419,
    name: "supporting_document.pdf",
    url: "supporting_documents/supporting_document.pdf",
  },
  type: "DOCUMENT",
  version: "1.0",
};

export const mockContactInformation = {
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
};

export const mockConsultationRecord = {
  id: 654,
  notes: [],
  package_id: 244,
  review: undefined,
  review_start_date: undefined,
  sort_order: 1,
  status: SUBMISSION_ITEM_STATUS.PASSED_CONSULTATION_CHECK.value,
  submissions: [mockConsultationRecordDocument],
  submitted_by: "",
  submitted_on: "",
  type: {
    id: 2,
    name: SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD,
    submission_method: SubmissionItemMethod.DOCUMENT_UPLOAD,
  },
  type_id: 2,
  version: 1,
};

export const mockManagementPlan = {
  id: 655,
  notes: [],
  package_id: 244,
  review: undefined,
  review_start_date: undefined,
  sort_order: 2,
  status: SUBMISSION_ITEM_STATUS.UNDER_REVIEW.value,
  submissions: [mockManagementPlanDocument, mockSupportingDocument],
  submitted_by: "",
  submitted_on: "",
  type: {
    id: 3,
    name: SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
    submission_method: SubmissionItemMethod.DOCUMENT_UPLOAD,
  },
  type_id: 3,
  version: 1,
};

export const mockSubmissionPackage: SubmissionPackage = {
  account_project_id: 115,
  completed_on: undefined,
  id: 244,
  internal_staff_documents: [],
  items: [mockContactInformation, mockConsultationRecord, mockManagementPlan],
  meta: {
    main_condition: undefined,
    supporting_conditions: [],
  },
  name: "Construction Environmental Management Plan",
  review_status: undefined,
  status: [],
  submitted_by: "Eric Levasseur",
  submitted_on: "2025-05-01T10:15:20.123456",
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

export const mockAccountProject: AccountProject = {
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

export const mockAuthentication = {
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

export const mockAccount = {
  isLoading: false,
  userType: USER_TYPE.STAFF,
  roles: [EPIC_SUBMIT_ROLE.eao_view],
};
