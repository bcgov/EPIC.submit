import { describe, it, expect } from "vitest";
import {
  Submission,
  SUBMISSION_SORT_ORDER,
} from "@/models/Submission";
import { SubmissionPackage } from "@/models/Package";
import {
  getDocumentStatusLabel,
  getDocumentStatusTheme,
  getReportDocumentSubmissions,
  isDocumentVerifiable,
  isEaoUploaded,
} from "./reportSubmissions";

const makeSubmission = (overrides: Partial<Submission> = {}): Submission =>
  ({
    id: 1,
    item_id: 1,
    version: "1",
    minor_version: 1,
    major_version: 1,
    type: "DOCUMENT",
    submitted_document: {
      id: 1,
      name: "report.pdf",
      url: "s3/report.pdf",
      folder: "reports",
      is_virus_rejected: false,
    },
    created_date: "2026-06-01T00:00:00Z",
    submitted_by: "Jane Doe",
    status: "SUBMITTED",
    is_updated: false,
    sort_order: 0,
    ...overrides,
  }) as Submission;

const makeReportPackage = (submissions: Submission[]) =>
  ({ items: [{ submissions }] }) as unknown as SubmissionPackage;

describe("document status mapping", () => {
  it("labels SUBMITTED/VERIFIED/ACKNOWLEDGED correctly", () => {
    expect(getDocumentStatusLabel(makeSubmission({ status: "SUBMITTED" }))).toBe(
      "Submitted",
    );
    expect(getDocumentStatusLabel(makeSubmission({ status: "VERIFIED" }))).toBe(
      "Verified",
    );
    expect(
      getDocumentStatusLabel(makeSubmission({ status: "ACKNOWLEDGED" })),
    ).toBe("Acknowledged");
  });

  it("falls back to Submitted for unknown or missing status", () => {
    expect(getDocumentStatusLabel(undefined)).toBe("Submitted");
    expect(
      getDocumentStatusLabel(
        makeSubmission({ status: "MYSTERY" as Submission["status"] }),
      ),
    ).toBe("Submitted");
  });

  it("themes VERIFIED/ACKNOWLEDGED as success and SUBMITTED as info", () => {
    expect(getDocumentStatusTheme(makeSubmission({ status: "VERIFIED" }))).toBe(
      "success",
    );
    expect(
      getDocumentStatusTheme(makeSubmission({ status: "ACKNOWLEDGED" })),
    ).toBe("success");
    expect(getDocumentStatusTheme(makeSubmission({ status: "SUBMITTED" }))).toBe(
      "info",
    );
    expect(getDocumentStatusTheme(undefined)).toBe("info");
  });

  it("shows a grey 'Uploaded by EAO' badge for EAO-uploaded docs regardless of status", () => {
    const eaoDoc = makeSubmission({
      status: "VERIFIED",
      is_eao_uploaded: true,
    });
    expect(getDocumentStatusLabel(eaoDoc)).toBe("Uploaded by EAO");
    expect(getDocumentStatusTheme(eaoDoc)).toBe("neutral");
  });
});

describe("getReportDocumentSubmissions", () => {
  it("puts main documents first, then sorts each priority newest first", () => {
    const main = makeSubmission({
      id: 1,
      sort_order: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
      created_date: "2026-01-01T00:00:00Z",
    });
    const oldSupporting = makeSubmission({
      id: 2,
      sort_order: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
      created_date: "2026-01-01T00:00:00Z",
    });
    const newSupporting = makeSubmission({
      id: 3,
      sort_order: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
      created_date: "2026-02-01T00:00:00Z",
    });

    const result = getReportDocumentSubmissions(
      makeReportPackage([oldSupporting, main, newSupporting]),
    );

    expect(result.map(({ id }) => id)).toEqual([1, 3, 2]);
  });

  it("treats an absent priority as supporting and tolerates invalid dates", () => {
    const main = makeSubmission({ sort_order: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT });
    const legacyDocument = makeSubmission({
      id: 2,
      sort_order: undefined as unknown as number,
      created_date: "not-a-date",
    });
    const supportingDocument = makeSubmission({
      id: 3,
      sort_order: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
      created_date: "also-not-a-date",
    });

    const result = getReportDocumentSubmissions(
      makeReportPackage([legacyDocument, main, supportingDocument]),
    );

    expect(result.map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});

describe("isEaoUploaded", () => {
  it("is true only when the signal is explicitly set", () => {
    expect(isEaoUploaded(makeSubmission({ is_eao_uploaded: true }))).toBe(true);
    expect(isEaoUploaded(makeSubmission({ is_eao_uploaded: false }))).toBe(
      false,
    );
    // Absent signal (SUBMIT-1041 not populated) => treated as Regulated Party.
    expect(isEaoUploaded(makeSubmission())).toBe(false);
  });
});

describe("isDocumentVerifiable", () => {
  it("is true for a Regulated-Party document still in SUBMITTED", () => {
    expect(isDocumentVerifiable(makeSubmission())).toBe(true);
  });

  it("is false once verified", () => {
    expect(isDocumentVerifiable(makeSubmission({ status: "VERIFIED" }))).toBe(
      false,
    );
  });

  it("is false for EAO-uploaded documents", () => {
    expect(
      isDocumentVerifiable(makeSubmission({ is_eao_uploaded: true })),
    ).toBe(false);
  });
});
