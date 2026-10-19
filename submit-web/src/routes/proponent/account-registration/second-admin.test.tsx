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

// Stub the child form so the test focuses on the subtitle copy.
vi.mock("@/components/App/AccountRegistration/SecondAdminForm", () => ({
  default: () => <div data-testid="second-admin-form" />,
}));

// Import after mocks are registered so createFileRoute captures the component.
import "./second-admin";

const SecondAdmin = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

describe("SecondAdmin copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the invite-second-admin title", () => {
    render(<SecondAdmin />);
    expect(
      screen.getByText("Invite a second Administrator to your account"),
    ).toBeInTheDocument();
  });

  it("uses the pluralized 'Regulated Party Account Administrators' recommendation copy", () => {
    render(<SecondAdmin />);
    expect(
      screen.getByText(
        /at least two Regulated Party Account Administrators on your account/,
      ),
    ).toBeInTheDocument();
  });

  it("uses the pluralized 'add more' copy", () => {
    render(<SecondAdmin />);
    expect(
      screen.getByText(
        /add more Regulated Party Account Administrators to your account/,
      ),
    ).toBeInTheDocument();
  });

  it("does not contain the old singular wording", () => {
    render(<SecondAdmin />);
    expect(
      screen.queryByText(/Regulated Party Account Administrator on your account/),
    ).not.toBeInTheDocument();
  });
});
