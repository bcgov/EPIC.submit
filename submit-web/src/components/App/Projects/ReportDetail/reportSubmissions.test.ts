import { describe, it, expect } from "vitest";
import { Submission } from "@/models/Submission";
import { ProjectReport } from "@/models/Package";
import {
  getDocumentStatusLabel,
  getDocumentStatusTheme,
  isComplianceSelfReport,
  isDocumentVerifiable,
  isEaoUploaded,
  isMainReportDocument,
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
    ...overrides,
  }) as Submission;

describe("document status mapping", () => {
  it("labels SUBMITTED/VERIFIED/ACKNOWLEDGED correctly", () => {
    expect(getDocumentStatusLabel("SUBMITTED")).toBe("Submitted");
    expect(getDocumentStatusLabel("VERIFIED")).toBe("Verified");
    expect(getDocumentStatusLabel("ACKNOWLEDGED")).toBe("Acknowledged");
  });

  it("falls back to Submitted for unknown or missing status", () => {
    expect(getDocumentStatusLabel(undefined)).toBe("Submitted");
    expect(getDocumentStatusLabel("MYSTERY")).toBe("Submitted");
  });

  it("themes VERIFIED/ACKNOWLEDGED as success and SUBMITTED as info", () => {
    expect(getDocumentStatusTheme("VERIFIED")).toBe("success");
    expect(getDocumentStatusTheme("ACKNOWLEDGED")).toBe("success");
    expect(getDocumentStatusTheme("SUBMITTED")).toBe("info");
    expect(getDocumentStatusTheme(undefined)).toBe("info");
  });
});

describe("isComplianceSelfReport", () => {
  it("is true only for the Compliance Self-Report report type", () => {
    expect(
      isComplianceSelfReport({
        report_type: "Compliance Self-Report",
      } as ProjectReport),
    ).toBe(true);
    expect(
      isComplianceSelfReport({ report_type: "Annual Report" } as ProjectReport),
    ).toBe(false);
    expect(isComplianceSelfReport(null)).toBe(false);
  });
});

describe("isMainReportDocument", () => {
  it("is true for documents in the reports folder", () => {
    expect(isMainReportDocument(makeSubmission())).toBe(true);
  });

  it("is false for supporting documents", () => {
    expect(
      isMainReportDocument(
        makeSubmission({
          submitted_document: {
            id: 2,
            name: "appendix.xlsx",
            url: "s3/appendix.xlsx",
            folder: "report_supporting_documents",
            is_virus_rejected: false,
          },
        }),
      ),
    ).toBe(false);
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
