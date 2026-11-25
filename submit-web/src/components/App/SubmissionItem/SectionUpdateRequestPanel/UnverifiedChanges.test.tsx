import { useState } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { SectionUpdateRequestPanel } from "./index";
import { useUpdateRequests } from "@/hooks/useUpdateRequests";
import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { Submission } from "@/models/Submission";
import { SubmissionItem, SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/hooks/api/usePackages", () => ({
  useCreatePackageUpdateRequest: () => ({ mutateAsync: send }),
  useAcceptUpdateRequest: () => ({ mutateAsync: vi.fn() }),
  useWithdrawUpdateRequest: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("./SentRequestCollapsible", () => ({
  SentRequestCollapsible: () => null,
}));
vi.mock("./PreviousRequestCollapsible", () => ({
  PreviousRequestCollapsible: () => null,
}));
vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({ userType: "STAFF" }),
}));

function document(id: number, overrides: Partial<Submission> = {}): Submission {
  return {
    id,
    type: "DOCUMENT",
    status: "SUBMITTED",
    is_updated: true,
    minor_version: 1,
    submitted_document: { name: `document-${id}.pdf` },
    ...overrides,
  } as Submission;
}
function packageWith(
  documents: Submission[],
  name = SubmissionPackageType.IPD,
): SubmissionPackage {
  return {
    id: 42,
    type: { name },
    update_requests: [],
    all_update_requests: [],
    items: documents.map(
      (submission, index) =>
        ({
          id: index + 1,
          type_id: index + 10,
          type: {
            id: index + 10,
            name:
              index === 0
                ? SUBMISSION_ITEM_TYPE.IPD
                : SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION,
          },
          submissions: [submission],
        }) as SubmissionItem,
    ),
  } as SubmissionPackage;
}
function Harness({ initialPackage }: { initialPackage: SubmissionPackage }) {
  const [submissionPackage, setPackage] = useState(initialPackage);
  const [queryClient] = useState(() => new QueryClient());
  const requests = useUpdateRequests({
    submissionPackage,
    submissionPackageId: 42,
    accountProjectId: 1,
    queryClient,
  });
  return (
    <>
      <button
        onClick={() =>
          requests.handleRequestUpdate(10, "Initial Project Description")
        }
      >
        Flag IPD
      </button>
      <button
        onClick={() =>
          requests.handleRequestUpdate(11, "Geospatial Information")
        }
      >
        Flag GIS
      </button>
      <button
        onClick={() =>
          setPackage((pkg) => ({
            ...pkg,
            items: pkg.items.map((item) => ({
              ...item,
              submissions: item.submissions.map((doc) =>
                doc.id === 1
                  ? { ...doc, is_updated: false, status: "VERIFIED" }
                  : doc,
              ),
            })),
          }))
        }
      >
        Verify first document
      </button>
      <SectionUpdateRequestPanel
        submissionPackage={submissionPackage}
        pendingRequests={requests.pendingRequests}
        sentRequests={requests.sentUpdateRequests}
        onRemoveFlag={requests.handleRemoveRequest}
        onUpdateNote={requests.handleUpdateNote}
        onSendRequests={requests.handleSendRequests}
        onAcceptUpdate={requests.handleAcceptUpdate}
        packageId={42}
      />
    </>
  );
}
function flagAndWriteNotes() {
  fireEvent.click(screen.getByText("Flag IPD"));
  fireEvent.click(screen.getByText("Flag GIS"));
  const notes = screen.getAllByRole("textbox");
  fireEvent.change(notes[0], { target: { value: "Keep this IPD note" } });
  fireEvent.change(notes[1], { target: { value: "Keep this GIS note" } });
}
function clickSend() {
  fireEvent.click(
    screen.getByRole("button", { name: "Send Request to Proponent" }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  send.mockResolvedValue({});
});

describe("warning before sending EA update requests", () => {
  it("lists all changed documents, preserves both drafts on Cancel, and sends the same notes after confirmation", async () => {
    render(
      <Harness
        initialPackage={packageWith([
          document(1),
          document(2, { minor_version: 2 }),
          document(3, { is_updated: false }),
        ])}
      />,
    );
    flagAndWriteNotes();
    clickSend();
    const dialog = screen.getByRole("dialog", { name: "Unverified Changes" });
    expect(
      within(dialog).getByText(/submitted 2 new or replaced documents/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Initial Project Description"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Geospatial Information"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("document-1.pdf")).toBeInTheDocument();
    expect(within(dialog).getByText("document-2.pdf")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("document-3.pdf"),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("New Document")).toBeInTheDocument();
    expect(within(dialog).getByText("New Version")).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByText("Cancel"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen
        .getAllByRole("textbox")
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(["Keep this IPD note", "Keep this GIS note"]);
    fireEvent.click(screen.getByText("Verify first document"));
    clickSend();
    const updatedDialog = screen.getByRole("dialog", {
      name: "Unverified Changes",
    });
    expect(
      within(updatedDialog).getByText(/submitted 1 new or replaced documents/),
    ).toBeInTheDocument();
    expect(
      within(updatedDialog).queryByText("document-1.pdf"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(updatedDialog).getByRole("button", {
        name: "Send Request",
        exact: true,
      }),
    );
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send).toHaveBeenNthCalledWith(1, {
      packageId: 42,
      data: { submission_item_types: [10], reason: "Keep this IPD note" },
    });
    expect(send).toHaveBeenNthCalledWith(2, {
      packageId: 42,
      data: { submission_item_types: [11], reason: "Keep this GIS note" },
    });
  });

  it("sends without another modal after all changed documents are verified", async () => {
    render(<Harness initialPackage={packageWith([document(1)])} />);
    flagAndWriteNotes();
    clickSend();
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Cancel"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Verify first document"));
    clickSend();
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates notes before opening the warning", () => {
    render(<Harness initialPackage={packageWith([document(1)])} />);
    fireEvent.click(screen.getByText("Flag IPD"));
    clickSend();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Please enter a note before sending your update request",
      ),
    ).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it.each([SubmissionPackageType.MANAGEMENT_PLAN, SubmissionPackageType.IEM])(
    "keeps %s sending unchanged",
    async (name) => {
      render(<Harness initialPackage={packageWith([document(1)], name)} />);
      flagAndWriteNotes();
      clickSend();
      await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it("also warns for DPD", () => {
    render(
      <Harness
        initialPackage={packageWith([document(1)], SubmissionPackageType.DPD)}
      />,
    );
    flagAndWriteNotes();
    clickSend();
    expect(
      screen.getByRole("dialog", { name: "Unverified Changes" }),
    ).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });
});
