import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Table, TableBody } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DocumentTableRow from "./DocumentTableRow";
import { consultationRecordSchema } from "@/components/App/SubmissionItem/ConsultationRecord/constants";
import { managementPlanSubmissionSchema } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanProponentView/constants";
import { Submission } from "@/models/Submission";

const deleteDocument = vi.fn();
const deleteSubmission = vi.fn();
const removeFile = vi.fn();

vi.mock("@/hooks/api/useObjectStorage", () => ({
  deleteDocument: (...args: unknown[]) => deleteDocument(...args),
}));
vi.mock("@/hooks/api/useSubmissions", () => ({
  useDeleteSubmission: () => ({ mutateAsync: deleteSubmission }),
}));
vi.mock("@/store/fileStore", () => ({
  useFileStore: () => ({ removeFile }),
}));
vi.mock("@/components/Shared/GeoApprovedBadge", () => ({
  GeoApprovedBadge: () => null,
}));

const DOC_URL = "s3/folder/record.pdf";
const REQUIRED_MESSAGE = "Please upload at least one document.";

const documentItem = {
  id: 1,
  item_id: 10,
  submitted_by: "Proponent",
  version: 1,
  submitted_document: { name: "record.pdf", url: DOC_URL, folder: "x" },
} as unknown as Submission;

// The CR and MP forms validate only their document field here; the rest of
// each schema covers unrelated questions.
const cases = [
  {
    form: "Consultation Record",
    field: "consultationRecords",
    schema: consultationRecordSchema.pick(["consultationRecords"]),
  },
  {
    form: "Management Plan",
    field: "managementPlans",
    schema: managementPlanSubmissionSchema.pick(["managementPlans"]),
  },
];

function Harness({
  field,
  schema,
  initial,
}: Readonly<{
  field: string;
  schema: (typeof cases)[number]["schema"];
  initial: string[];
}>) {
  const methods = useForm({
    // Same setup as the proponent views.
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: { [field]: initial },
  });
  const error = methods.formState.errors[field]?.message;
  return (
    <FormProvider {...methods}>
      <Table>
        <TableBody>
          <DocumentTableRow documentItem={documentItem} formFieldName={field} />
        </TableBody>
      </Table>
      <button type="button" onClick={methods.handleSubmit(() => {})}>
        Save Completed Form
      </button>
      {error && <p role="alert">{String(error)}</p>}
      <output data-testid="value">{JSON.stringify(methods.watch(field))}</output>
    </FormProvider>
  );
}

const renderRow = (c: (typeof cases)[number], initial: string[]) =>
  render(<Harness field={c.field} schema={c.schema} initial={initial} />);

const clickRemove = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(removeFile).toHaveBeenCalledWith(1));
};

describe.each(cases)("DocumentTableRow in $form form", (c) => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteDocument.mockResolvedValue(undefined);
    deleteSubmission.mockResolvedValue(undefined);
  });

  it("removes the last document without showing the required error", async () => {
    renderRow(c, [DOC_URL]);

    await clickRemove();

    expect(deleteDocument).toHaveBeenCalledWith({ filepath: DOC_URL });
    expect(deleteSubmission).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(screen.getByTestId("value")).toHaveTextContent("[]"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the required error when Save Completed Form is clicked with no documents", async () => {
    renderRow(c, [DOC_URL]);
    await clickRemove();

    fireEvent.click(screen.getByRole("button", { name: "Save Completed Form" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(REQUIRED_MESSAGE);
  });

  it("re-validates on removal once the form has been submitted", async () => {
    renderRow(c, [DOC_URL]);
    fireEvent.click(screen.getByRole("button", { name: "Save Completed Form" }));
    // Valid submit: one document, no error.
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );

    await clickRemove();

    expect(await screen.findByRole("alert")).toHaveTextContent(REQUIRED_MESSAGE);
  });
});
