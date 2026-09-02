import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

// Capture the component passed to createFileRoute so we can render it directly.
// vi.hoisted keeps the holder available inside the hoisted vi.mock factory.
const routeHolder = vi.hoisted(() => ({
  component: undefined as (() => JSX.Element) | undefined,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => JSX.Element }) => {
    routeHolder.component = options.component;
    return {};
  },
}));

// Stub the child form + terms provider so the test focuses on the subtitle copy.
vi.mock(
  "@/components/App/AccountRegistration/ContactInformationForm",
  () => ({
    default: () => <div data-testid="contact-information-form" />,
  }),
);

vi.mock("@/components/Shared/TermsOfService", () => ({
  TermsOfServiceProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the form store so each test controls invitation + entityName.
const mockUseCreateAccountFormStore = vi.fn();
vi.mock("@/components/App/AccountRegistration/formStore", () => ({
  useCreateAccountFormStore: () => mockUseCreateAccountFormStore(),
}));

const ENTITY_NAME = "Acme Corp";

const setStore = (
  roleName?: USER_MANAGEMENT_ROLE,
  isFirstTime?: boolean,
  entityName: string | undefined = ENTITY_NAME,
) => {
  mockUseCreateAccountFormStore.mockReturnValue({
    entityName,
    invitation: roleName
      ? {
          is_first_time: isFirstTime,
          role: { role_name: roleName },
        }
      : undefined,
  });
};

// Import after mocks are registered so createFileRoute captures the component.
import "./create-account";

const CreateAccount = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

describe("CreateAccount subtitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always renders the shared page title", () => {
    setStore(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN, false);
    render(<CreateAccount />);
    expect(
      screen.getByText("First, create your account."),
    ).toBeInTheDocument();
  });

  it("shows the first-time Account Administrator copy", () => {
    setStore(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN, true);
    render(<CreateAccount />);
    expect(
      screen.getByText(
        /Thank you for taking a few minutes to set up the Acme Corp account\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /assign it only to people who should have account-owner control of Acme Corp\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/as a Regulated Party Account Administrator for Acme Corp/),
    ).toBeInTheDocument();
  });

  it("shows the returning Account Administrator copy without the set-up sentence", () => {
    setStore(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN, false);
    render(<CreateAccount />);
    expect(
      screen.getByText(/as a Regulated Party Account Administrator for Acme Corp/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Thank you for taking a few minutes/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/highly trusted role/),
    ).not.toBeInTheDocument();
  });

  it("shows Project Administrator copy for PROJECT_ADMIN", () => {
    setStore(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, false);
    render(<CreateAccount />);
    expect(
      screen.getByText(
        /as a Project Administrator for Acme Corp.*can manage users for those projects\./,
      ),
    ).toBeInTheDocument();
  });

  it("shows Project Administrator copy for SPECIFIC_PROJECT_ADMIN", () => {
    setStore(USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN, false);
    render(<CreateAccount />);
    expect(
      screen.getByText(/as a Project Administrator for Acme Corp/),
    ).toBeInTheDocument();
  });

  it("shows Collaborator copy for SUBMISSION_ADMIN", () => {
    setStore(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN, false);
    render(<CreateAccount />);
    expect(
      screen.getByText(
        /as a Collaborator for Acme Corp.*including uploading documents\./,
      ),
    ).toBeInTheDocument();
  });

  it("shows Collaborator copy for SPECIFIC_SUBMISSION_CONTRIBUTOR", () => {
    setStore(USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR, false);
    render(<CreateAccount />);
    expect(
      screen.getByText(/as a Collaborator for Acme Corp/),
    ).toBeInTheDocument();
  });

  it("falls back to Account Administrator copy when no invitation role is present", () => {
    setStore(undefined, undefined);
    render(<CreateAccount />);
    expect(
      screen.getByText(/as a Regulated Party Account Administrator for Acme Corp/),
    ).toBeInTheDocument();
  });
});
