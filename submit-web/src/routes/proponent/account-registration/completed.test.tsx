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

// Stub the child form so the test focuses on the page title copy.
vi.mock(
  "@/components/App/AccountRegistration/RegistrationCompletedForm",
  () => ({
    default: () => <div data-testid="registration-completed-form" />,
  }),
);

// Stub the icon so the test does not load the full @mui/icons-material package.
vi.mock("@mui/icons-material", () => ({
  DoneRounded: () => <span data-testid="done-icon" />,
}));

// Import after mocks are registered so createFileRoute captures the component.
import "./completed";

const Completed = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

describe("Completed copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the corrected title with 'set up' and lowercase 'account'", () => {
    render(<Completed />);
    expect(
      screen.getByText("Your account is successfully set up"),
    ).toBeInTheDocument();
  });

  it("does not use the old 'set-up' / capitalized 'Account' wording", () => {
    render(<Completed />);
    expect(
      screen.queryByText("Your Account is successfully set-up"),
    ).not.toBeInTheDocument();
  });
});
