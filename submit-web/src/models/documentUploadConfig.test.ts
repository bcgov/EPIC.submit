import { describe, expect, it } from "vitest";
import { DOCUMENT_UPLOAD_CONFIG } from "./documentUploadConfig";
import { SUBMISSION_SORT_ORDER } from "./Submission";
import {
  NEW_PACKAGE_TYPE_S3_FOLDER_MAP,
  S3_FOLDER,
} from "@/models/documentUploadConfig";
import { SubmissionPackageType } from "./Package";
import { SUBMISSION_ITEM_TYPE } from "./SubmissionItem";

describe("document upload destinations", () => {
  it.each([
    "MANAGEMENT_PLANS",
    "CONSULTATION_RECORDS",
    "IEMS",
    "IPDS",
    "ENGAGEMENT_PLANS",
    "GEOSPATIAL",
    "UPLOAD_DOCUMENTS",
    "REPORTS",
  ] as const)("treats %s as a main upload", (key) => {
    expect(DOCUMENT_UPLOAD_CONFIG[key].sortOrder).toBe(
      SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
    );
  });

  it.each([
    "SUPPORTING_DOCUMENTS",
    "IPD_SUPPORTING_DOCUMENTS",
    "ENGAGEMENT_PLAN_SUPPORTING_DOCUMENTS",
    "REPORT_SUPPORTING_DOCUMENTS",
  ] as const)("does not let %s satisfy main-file validation", (key) => {
    expect(DOCUMENT_UPLOAD_CONFIG[key].sortOrder).toBe(
      SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
    );
  });

  it("keeps storage folder identifiers unique", () => {
    const folders = Object.values(DOCUMENT_UPLOAD_CONFIG).map(
      ({ value }) => value,
    );
    expect(new Set(folders).size).toBe(folders.length);
  });

  it("keeps storage-only folders outside submission validation", () => {
    expect(S3_FOLDER.SUBMISSIONS).not.toHaveProperty("sortOrder");
    expect(S3_FOLDER.INTERNAL_STAFF_DOCUMENTS).not.toHaveProperty("sortOrder");
    expect(S3_FOLDER.IPDS).toBe(DOCUMENT_UPLOAD_CONFIG.IPDS);
  });

  it.each([
    [
      SubmissionPackageType.MANAGEMENT_PLAN,
      SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
      "MANAGEMENT_PLANS",
    ],
    [SubmissionPackageType.IEM, SUBMISSION_ITEM_TYPE.IEM, "IEMS"],
  ] as const)(
    "uses shared priorities when organizing %s files",
    (packageType, itemType, main) => {
      const folders = NEW_PACKAGE_TYPE_S3_FOLDER_MAP[packageType]![itemType];
      expect(folders[0]).toBe(DOCUMENT_UPLOAD_CONFIG[main]);
      expect(folders[1]).toBe(DOCUMENT_UPLOAD_CONFIG.SUPPORTING_DOCUMENTS);
      expect(
        NEW_PACKAGE_TYPE_S3_FOLDER_MAP[packageType]![
          SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD
        ][0],
      ).toBe(DOCUMENT_UPLOAD_CONFIG.CONSULTATION_RECORDS);
    },
  );
});
