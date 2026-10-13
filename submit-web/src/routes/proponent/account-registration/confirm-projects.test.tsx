import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Capture the component passed to createFileRoute so we can render it directly.
const routeHolder = vi.hoisted(() => ({
  component: undefined as (() => JSX.Element) | undefined,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => JSX.Element }) => {
    routeHolder.component = options.component;
    return {};
  },
}));

// Mock the form store so each test controls entityName + invitation.
const mockUseCreateAccountFormStore = vi.fn();
vi.mock("@/components/App/AccountRegistration/formStore", () => ({
  useCreateAccountFormStore: () => mockUseCreateAccountFormStore(),
}));

// Mock the proponent hook so no network/eligibility data is needed.
const mockUseGetProponent = vi.fn();
vi.mock("@/hooks/api/useProponents", () => ({
  useGetProponent: (...args: unknown[]) => mockUseGetProponent(...args),
}));

// Stub child components so the test focuses on the heading + body copy.
vi.mock(
  "@/components/App/AccountRegistration/EligibilityEntryCard",
  () => ({
    EligibilityEntryCard: () => <div data-testid="eligibility-entry-card" />,
  }),
);
vi.mock(
  "@/components/App/AccountRegistration/ProjectConfirmationForm",
  () => ({
    default: () => <div data-testid="project-confirmation-form" />,
  }),
);

// Import after mocks are registered so createFileRoute captures the component.
import "./confirm-projects";

const ENTITY_NAME = "Acme Corp";

const ConfirmProjects = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

describe("ConfirmProjects copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateAccountFormStore.mockReturnValue({
      entityName: ENTITY_NAME,
      invitation: { proponent_id: 1, eligible_entries: [] },
    });
    mockUseGetProponent.mockReturnValue({ data: undefined });
  });

  it("renders the Project Account(s) heading", () => {
    render(<ConfirmProjects />);
    expect(screen.getByText("Project Account(s)")).toBeInTheDocument();
  });

  it("scopes the body to the account being set up and references entityName", () => {
    render(<ConfirmProjects />);
    expect(
      screen.getByText(
        `We found the following Project(s)/Work(s) associated with ${ENTITY_NAME}.`,
      ),
    ).toBeInTheDocument();
  });
});
