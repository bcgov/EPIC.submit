import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { useFormContext } from "react-hook-form";

// Capture the component passed to createFileRoute so we can render it directly.
const routeHolder = vi.hoisted(() => ({
  component: undefined as (() => JSX.Element) | undefined,
}));

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => JSX.Element }) => {
    routeHolder.component = options.component;
    return {};
  },
  useNavigate: () => mockNavigate,
  useParams: () => ({ projectId: "7", reportPackageId: "42" }),
  Navigate: () => <div data-testid="navigate-error" />,
  notFound: () => new Error("not found"),
}));

const mockUseSuspenseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: (options: unknown) => mockUseSuspenseQuery(options),
}));
vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: () => ({ key: "package" }),
}));
vi.mock("@/hooks/api/useProjects", () => ({
  getAccountProjectForStaffQueryOptions: () => ({ key: "project" }),
}));

vi.mock("react-oidc-context", () => ({
  useAuth: () => ({ user: { profile: { preferred_username: "jlee@idir" } } }),
}));
vi.mock("@/hooks/api/useAccounts", () => ({
  useGetUserByGuid: () => ({
    data: { staff_user: { first_name: "Jordan", last_name: "Lee" } },
  }),
}));

const addDocuments = vi.fn();
vi.mock("@/hooks/api/useAddEaoReportDocuments", () => ({
  useAddEaoReportDocuments: () => ({ addDocuments }),
}));

const notifySuccess = vi.fn();
const notifyError = vi.fn();
vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: {
    success: (...args: unknown[]) => notifySuccess(...args),
    error: (...args: unknown[]) => notifyError(...args),
  },
}));

// Light page chrome and upload sections.
vi.mock("@/components/Shared/PageGrid", () => ({
  PageGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Shared/Layouts/ContentBox", () => ({
  ContentBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton", () => ({
  ContentBoxSkeleton: () => <div />,
}));
vi.mock("@/components/App/Submission/SubmissionTitle", () => ({
  SubmissionTitle: () => <div />,
}));
vi.mock(
  "@/components/App/Projects/ReportDetail/upload/ReportUploadSection",
  () => ({
    ReportUploadSection: ({
      heading,
      files,
      onAddFiles,
      uploadedByName,
      error,
    }: {
      heading: string;
      files: { id: string; file: File }[];
      onAddFiles: (files: File[]) => void;
      uploadedByName: string;
      error?: boolean;
    }) => (
      <section aria-label={heading}>
        <button
          onClick={() =>
            onAddFiles([new File(["x"], `${heading}.pdf`, { type: "application/pdf" })])
          }
        >
          add to {heading}
        </button>
        {files.map((staged) => (
          <div key={staged.id}>
            {staged.file.name} uploaded by {uploadedByName}
          </div>
        ))}
        {error && <p>Please upload a document.</p>}
      </section>
    ),
  }),
);

// Stand-in for the date picker: registers the same form field the real one uses.
vi.mock(
  "@/components/App/Projects/ReportDetail/upload/DateReceivedField",
  () => ({
    DateReceivedField: () => {
      const {
        register,
        setValue,
        formState: { errors },
      } = useFormContext();
      const { ref, ...rest } = register("receivedDate");
      return (
        <div>
          <input aria-label="Date Received" ref={ref} {...rest} />
          <button onClick={() => setValue("receivedDate", dayjs().subtract(3, "day"))}>
            set past date
          </button>
          <button onClick={() => setValue("receivedDate", dayjs().add(3, "day"))}>
            set future date
          </button>
          {errors.receivedDate && <p>{String(errors.receivedDate.message)}</p>}
        </div>
      );
    },
  }),
);

const ACCOUNT_PROJECT = {
  id: 7,
  project: {
    name: "Cariboo Gold Project",
    proponent: { name: "Osisko Development Corp." },
    ea_certificate: "E23-01",
  },
};

const REPORT_PACKAGE = {
  id: 42,
  items: [{ id: 99 }],
  project_report: {
    display_name: "Compliance Self-Report",
    report_type: "Compliance Self-Report",
    phase: "Construction",
  },
};

const setQueries = (accountProject: unknown, reportPackage: unknown) => {
  mockUseSuspenseQuery.mockImplementation((options: { key: string }) => {
    if (options.key === "project") return { data: accountProject };
    return { data: reportPackage };
  });
};

import "./add-document";

const Page = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

const DATE_REQUIRED = "Please enter the date the EAO received the document.";
const DATE_FUTURE = "The date received cannot be in the future.";

describe("Staff add-document page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDocuments.mockResolvedValue([1]);
    setQueries(ACCOUNT_PROJECT, REPORT_PACKAGE);
  });

  it("ends with an 'Add Documents' button instead of 'Submit to EAO'", () => {
    render(<Page />);
    expect(screen.getByRole("button", { name: "Add Documents" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit to EAO" })).not.toBeInTheDocument();
  });

  it("lists staged files as uploaded by the signed-in staff member", async () => {
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));

    expect(screen.getByText(/Upload Report.pdf uploaded by Jordan Lee/)).toBeInTheDocument();
  });

  it("shows the date message, focuses the field and saves nothing when no date is entered", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    expect(await screen.findByText(DATE_REQUIRED)).toBeInTheDocument();
    expect(screen.getByLabelText("Date Received")).toHaveFocus();
    expect(addDocuments).not.toHaveBeenCalled();
  });

  it("rejects a date in the future", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(screen.getByRole("button", { name: "set future date" }));

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    expect(await screen.findByText(DATE_FUTURE)).toBeInTheDocument();
    expect(addDocuments).not.toHaveBeenCalled();
  });

  it("asks for a document when a valid date is entered but no file is added", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "set past date" }));

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    expect(screen.getByText("Please upload a document.")).toBeInTheDocument();
    expect(addDocuments).not.toHaveBeenCalled();
  });

  it("saves every file with the date received, then shows the toast and returns to the report", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(
      screen.getByRole("button", { name: "add to Upload Supporting Documents" }),
    );
    await user.click(screen.getByRole("button", { name: "set past date" }));

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    await waitFor(() => expect(addDocuments).toHaveBeenCalledTimes(1));
    const args = addDocuments.mock.calls[0][0];
    expect(args.itemId).toBe(99);
    expect(args.receivedDate).toBe(dayjs().subtract(3, "day").format("YYYY-MM-DD"));
    expect(args.primaryFiles).toHaveLength(1);
    expect(args.supportingFiles).toHaveLength(1);
    expect(notifySuccess).toHaveBeenCalledWith("Documents added successfully", 15000);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/staff/projects/$projectId/reports/$reportPackageId",
      params: { projectId: "7", reportPackageId: "42" },
    });
  });

  it("stays on the page with the files listed and shows an error when saving fails", async () => {
    const user = userEvent.setup();
    addDocuments.mockRejectedValue(new Error("boom"));
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(screen.getByRole("button", { name: "set past date" }));

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    await waitFor(() => expect(notifyError).toHaveBeenCalledTimes(1));
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText(/Upload Report.pdf uploaded by/)).toBeInTheDocument();
  });

  it("returns to the report on Cancel without saving", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(addDocuments).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/staff/projects/$projectId/reports/$reportPackageId",
      params: { projectId: "7", reportPackageId: "42" },
    });
  });

  it("redirects to the error page when the report obligation is missing", () => {
    setQueries(ACCOUNT_PROJECT, { id: 42, items: [], project_report: null });
    render(<Page />);
    expect(screen.getByTestId("navigate-error")).toBeInTheDocument();
  });
});
