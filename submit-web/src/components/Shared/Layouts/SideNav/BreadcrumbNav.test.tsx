import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BreadcrumbNav from "./BreadcrumbNav";

// ── Module mocks ────────────────────────────────────────────────────────────

const mockUseRouterState = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouterState: (...args: unknown[]) => mockUseRouterState(...args),
  // Render Link as a plain anchor so we can assert on links vs plain text.
  Link: ({ to, children }: { to?: string; children: React.ReactNode }) => (
    <a href={to} data-testid="breadcrumb-link">
      {children}
    </a>
  ),
}));

vi.mock("@/styles/theme", () => ({
  theme: {
    spacing: (n: number) => `${n * 8}px`,
    palette: { primary: { dark: "#000" } },
  },
}));

type Meta = { title?: string; path?: string };

const renderWithMatches = (matches: Array<{ pathname: string; meta?: Meta[] }>) => {
  // useRouterState is called with a `select` fn that picks `s.matches`.
  mockUseRouterState.mockImplementation(
    ({ select }: { select: (s: { matches: unknown }) => unknown }) =>
      select({ matches }),
  );
  return render(<BreadcrumbNav />);
};

describe("BreadcrumbNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders intermediate crumbs with a path as links", () => {
    renderWithMatches([
      {
        pathname: "/proponent/projects/1",
        meta: [
          { title: "All Projects", path: "/proponent/projects/" },
          { title: "Mine Project", path: "/proponent/projects/1" },
        ],
      },
      {
        pathname: "/proponent/projects/1/submission-packages/10",
        meta: [{ title: "Compliance Self-Report: Construction" }],
      },
    ]);

    const allProjects = screen.getByText("All Projects");
    expect(allProjects.closest("a")).toHaveAttribute(
      "href",
      "/proponent/projects/",
    );

    const projectName = screen.getByText("Mine Project");
    expect(projectName.closest("a")).toHaveAttribute(
      "href",
      "/proponent/projects/1",
    );
  });

  it("renders the current (last) crumb as plain text with no link", () => {
    renderWithMatches([
      {
        pathname: "/proponent/projects/1",
        meta: [
          { title: "All Projects", path: "/proponent/projects/" },
          { title: "Mine Project", path: "/proponent/projects/1" },
        ],
      },
      {
        pathname: "/proponent/projects/1/submission-packages/10",
        meta: [{ title: "Compliance Self-Report: Construction" }],
      },
    ]);

    const current = screen.getByText("Compliance Self-Report: Construction");
    expect(current.closest("a")).toBeNull();
  });

  it("does not fall back to the page pathname for a path-less crumb (no self-link)", () => {
    renderWithMatches([
      {
        pathname: "/proponent/projects/1",
        meta: [{ title: "All Projects", path: "/proponent/projects/" }],
      },
      {
        pathname: "/proponent/projects/1/submission-packages/10",
        meta: [{ title: "Compliance Self-Report: Construction" }],
      },
    ]);

    // Only "All Projects" has a path, so it should be the sole link.
    const links = screen.getAllByTestId("breadcrumb-link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/proponent/projects/");
  });

  it("filters out crumbs with empty or missing titles", () => {
    renderWithMatches([
      {
        pathname: "/proponent/projects/1",
        meta: [
          { title: "All Projects", path: "/proponent/projects/" },
          { title: "", path: "/proponent/projects/1" },
        ],
      },
      {
        pathname: "/proponent/projects/1/submission-packages/10",
        meta: [{ title: "Compliance Self-Report: Construction" }],
      },
    ]);

    // The empty-title crumb must not render at all.
    expect(screen.queryByText("", { selector: "a" })).toBeNull();
    // "Compliance Self-Report: Construction" is now the last crumb -> plain text.
    const current = screen.getByText("Compliance Self-Report: Construction");
    expect(current.closest("a")).toBeNull();
  });
});
