import { describe, it, expect, vi } from "vitest";

// Capture the options passed to createFileRoute so we can call head() directly.
const routeHolder = vi.hoisted(() => ({
  options: undefined as
    | {
        head: (ctx: {
          loaderData?: unknown;
          params: { projectId: string; submissionPackageId: string };
        }) => { meta: Array<{ title?: string; path?: string }> };
      }
    | undefined,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: typeof routeHolder.options) => {
    routeHolder.options = options;
    return {};
  },
  Navigate: () => null,
  notFound: () => new Error("not found"),
  Outlet: () => null,
  redirect: vi.fn(),
  useParams: vi.fn(),
}));

await import("./_submissionLayout");

describe("proponent submission layout breadcrumb", () => {
  const head = (loaderData: unknown) =>
    routeHolder.options!.head({
      loaderData,
      params: { projectId: "7", submissionPackageId: "42" },
    });

  it("links the submission-package crumb to the package page", () => {
    const { meta } = head({ name: "Annual Report 2026", project_report: null });

    expect(meta).toEqual([
      {
        title: "Annual Report 2026",
        path: "/proponent/projects/7/submission-packages/42",
      },
    ]);
  });
});
