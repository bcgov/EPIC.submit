import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import RevisionRequiredWidget from "./RevisionRequiredWidget";

const CC_TYPE_ID = 2;

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
        { type_id: CC_TYPE_ID, type: { name: "Consultation Record(s)" } },
        { type_id: 3, type: { name: "Management Plan" } },
      ],
    }),
  }),
}));

vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: () => ({ queryKey: ["packages", 1] }),
}));

const captured: { notes?: unknown } = {};

function Capture() {
  const { getValues } = useFormContext();
  return (
    <button
      type="button"
      onClick={() => {
        captured.notes = getValues("update_request.section_notes");
      }}
    >
      capture
    </button>
  );
}

function Wrapper() {
  const methods = useForm({
    mode: "onChange",
    defaultValues: { staff: { passedConsultationCheck: "NO" } },
  });
  return (
    <FormProvider {...methods}>
      <RevisionRequiredWidget />
      <Capture />
    </FormProvider>
  );
}

describe("RevisionRequiredWidget stores section_notes as an object", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.notes = undefined;
  });

  it("keeps section_notes as an object (not an array) after typing a note", () => {
    render(<Wrapper />);
    const note = screen.getByPlaceholderText(
      "Describe what needs to be updated or added for Consultation Check...",
    );
    fireEvent.change(note, { target: { value: "please revise" } });
    fireEvent.click(screen.getByText("capture"));

    expect(Array.isArray(captured.notes)).toBe(false);
    expect(captured.notes).toEqual({ [String(CC_TYPE_ID)]: "please revise" });
  });

  it("reflects the typed value back into the field", () => {
    render(<Wrapper />);
    const note = screen.getByPlaceholderText(
      "Describe what needs to be updated or added for Consultation Check...",
    ) as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "hello" } });
    expect(note.value).toBe("hello");
  });
});
