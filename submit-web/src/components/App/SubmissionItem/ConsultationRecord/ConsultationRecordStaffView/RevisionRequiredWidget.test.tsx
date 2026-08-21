import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RevisionRequiredWidget from "./RevisionRequiredWidget";
import { FormProvider, useForm } from "react-hook-form";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({
    submissionPackageId: "1",
    submissionId: "10",
    projectId: "5",
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    getQueryData: () => ({
      items: [
        { type_id: 2, type: { name: "Consultation Record(s)" } },
        { type_id: 3, type: { name: "Management Plan" } },
      ],
    }),
  }),
}));

vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: () => ({ queryKey: ["packages", 1] }),
}));

function Wrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: object }) {
  const FormWrapper = () => {
    const methods = useForm({
      defaultValues: {
        update_request: {
          section_notes: { "2": "" },
          submission_item_types: [2],
        },
        ...defaultValues,
      },
    });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  return <FormWrapper />;
}

describe("RevisionRequiredWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with Consultation Check section expanded", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    expect(screen.getByText("Revision Required for")).toBeInTheDocument();
    expect(screen.getByText("Consultation Check")).toBeInTheDocument();
    expect(screen.getByText("Request Note")).toBeInTheDocument();
    expect(
      screen.getByText("This note will be shared with the proponent."),
    ).toBeInTheDocument();
  });

  it("renders the add Management Plan section link", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    expect(
      screen.getByText("+ Add Management Plan section"),
    ).toBeInTheDocument();
  });

  it("adds Management Plan section when link is clicked", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    const addLink = screen.getByText("+ Add Management Plan section");
    fireEvent.click(addLink);

    expect(screen.getByText("Management Plan")).toBeInTheDocument();
    // Link should be removed after adding
    expect(
      screen.queryByText("+ Add Management Plan section"),
    ).not.toBeInTheDocument();
  });

  it("shows Remove link on Management Plan section after adding", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    fireEvent.click(screen.getByText("+ Add Management Plan section"));

    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("removes MP section and restores add link when Remove is clicked", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    fireEvent.click(screen.getByText("+ Add Management Plan section"));
    expect(screen.getByText("Management Plan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Remove"));

    expect(screen.queryByText("Management Plan")).not.toBeInTheDocument();
    expect(
      screen.getByText("+ Add Management Plan section"),
    ).toBeInTheDocument();
  });

  it("renders the warning notice inside the widget", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    expect(
      screen.getByText(
        "This request, including the EAO Comment, will be sent to the holder after a Manager confirms the decision.",
      ),
    ).toBeInTheDocument();
  });

  it("renders placeholder text for note field", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    expect(
      screen.getByPlaceholderText(
        "Describe what needs to be updated or added for Consultation Check...",
      ),
    ).toBeInTheDocument();
  });

  it("disables fields when disabled prop is true", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget disabled />
      </Wrapper>,
    );

    const textarea = screen.getByPlaceholderText(
      "Describe what needs to be updated or added for Consultation Check...",
    );
    expect(textarea).toBeDisabled();
  });

  it("does not show Remove link on Consultation Check section", () => {
    render(
      <Wrapper>
        <RevisionRequiredWidget />
      </Wrapper>,
    );

    // Consultation Check should not have a Remove link
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});
