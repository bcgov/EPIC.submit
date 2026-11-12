import { describe, it, expect, vi, beforeEach } from "vitest";
import { addEaoReportDocuments } from "./useAddEaoReportDocuments";
import { saveObject } from "./useObjectStorage";
import {
  createEaoDocumentSubmission,
  deleteSubmission,
} from "./useSubmissions";

vi.mock("./useObjectStorage", () => ({ saveObject: vi.fn() }));
vi.mock("./useSubmissions", () => ({
  createEaoDocumentSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
}));
vi.mock("@/components/Shared/Table/utils", () => ({
  getSubmissionFolderName: ({
    projectName,
    sectionName,
  }: {
    projectName: string;
    sectionName: string;
  }) => `${projectName}/${sectionName}`,
}));

const staged = (id: string, name: string) => ({
  id,
  file: new File(["x"], name, { type: "application/pdf" }),
});

const params = {
  itemId: 9,
  projectName: "carribooGold",
  receivedDate: "2026-10-09",
  primaryFiles: [staged("1", "report.pdf")],
  supportingFiles: [staged("2", "appendix.pdf"), staged("3", "table.pdf")],
};

describe("addEaoReportDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveObject).mockImplementation(
      async ({ file }: { file: File }) => `s3/${file.name}`,
    );
    let nextId = 100;
    vi.mocked(createEaoDocumentSubmission).mockImplementation(
      async () => ({ id: (nextId += 1) }) as never,
    );
    vi.mocked(deleteSubmission).mockResolvedValue({} as never);
  });

  it("uploads every file and creates one EAO record per file with the same date", async () => {
    const ids = await addEaoReportDocuments(params);

    expect(saveObject).toHaveBeenCalledTimes(3);
    expect(createEaoDocumentSubmission).toHaveBeenCalledTimes(3);
    for (const call of vi.mocked(createEaoDocumentSubmission).mock.calls) {
      expect(call[0]).toBe(9);
      expect(call[3]).toBe("2026-10-09");
    }
    expect(ids).toEqual([101, 102, 103]);
    expect(deleteSubmission).not.toHaveBeenCalled();
  });

  it("saves the main report to the reports folder and attachments to the supporting folder", async () => {
    await addEaoReportDocuments(params);

    const calls = vi.mocked(createEaoDocumentSubmission).mock.calls;
    expect(calls[0][1].value).toBe("reports");
    expect(calls[0][2]).toEqual({ name: "report.pdf", url: "s3/report.pdf" });
    expect(calls[1][1].value).toBe("report_supporting_documents");
    expect(calls[2][1].value).toBe("report_supporting_documents");
  });

  it("works with only a main report", async () => {
    const ids = await addEaoReportDocuments({ ...params, supportingFiles: [] });

    expect(ids).toHaveLength(1);
  });

  it("deletes the records already created when a later one fails, then rethrows", async () => {
    const failure = new Error("boom");
    vi.mocked(createEaoDocumentSubmission)
      .mockResolvedValueOnce({ id: 11 } as never)
      .mockResolvedValueOnce({ id: 12 } as never)
      .mockRejectedValueOnce(failure);

    await expect(addEaoReportDocuments(params)).rejects.toBe(failure);

    expect(deleteSubmission).toHaveBeenCalledTimes(2);
    expect(deleteSubmission).toHaveBeenCalledWith(11);
    expect(deleteSubmission).toHaveBeenCalledWith(12);
  });

  it("still rethrows the original error when a rollback delete fails", async () => {
    const failure = new Error("boom");
    vi.mocked(createEaoDocumentSubmission)
      .mockResolvedValueOnce({ id: 11 } as never)
      .mockRejectedValueOnce(failure);
    vi.mocked(deleteSubmission).mockRejectedValue(new Error("delete failed"));

    await expect(addEaoReportDocuments(params)).rejects.toBe(failure);
  });

  it("creates nothing when a storage upload fails", async () => {
    vi.mocked(saveObject)
      .mockResolvedValueOnce("s3/report.pdf")
      .mockRejectedValueOnce(new Error("s3 down"));

    await expect(addEaoReportDocuments(params)).rejects.toThrow("s3 down");

    expect(createEaoDocumentSubmission).not.toHaveBeenCalled();
    expect(deleteSubmission).not.toHaveBeenCalled();
  });
});
