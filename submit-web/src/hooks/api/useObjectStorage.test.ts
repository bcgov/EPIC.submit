import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveObject,
  getJsonObject,
  downloadObject,
  deleteDocument,
  copyObject,
  S3_FOLDER,
  NEW_PACKAGE_TYPE_S3_FOLDER_MAP,
} from "./useObjectStorage";
import { SubmissionPackageType } from "@/models/Package";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

vi.mock("@/utils/axiosUtils", () => ({
  documentRequest: vi.fn(),
  requestAxios: vi.fn(),
}));

import { documentRequest, requestAxios } from "@/utils/axiosUtils";

const mockDocumentRequest = vi.mocked(documentRequest);
const mockRequestAxios = vi.mocked(requestAxios);

describe("useObjectStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("saveObject", () => {
    it("requests a PUT presigned url, uploads the file and returns the relative url", async () => {
      mockDocumentRequest.mockResolvedValue({
        presigned_url: "https://s3/put",
        relative_url: "folder/file.txt",
      });
      mockRequestAxios.mockResolvedValue({});
      const file = new File(["x"], "file.txt");

      const result = await saveObject({
        file,
        fileDetails: { filename: "file.txt", folder: "folder" },
      });

      expect(mockDocumentRequest).toHaveBeenCalledWith({
        url: "/storage-operations/presigned-urls",
        params: { "public-read": false },
        method: "post",
        data: { relative_url: "folder/file.txt", action: "PUT" },
      });
      expect(mockRequestAxios).toHaveBeenCalledWith({
        url: "https://s3/put",
        method: "put",
        data: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      expect(result).toBe("folder/file.txt");
    });

    it("throws and does not upload when no presigned url is returned", async () => {
      mockDocumentRequest.mockResolvedValue({});

      await expect(
        saveObject({
          file: new File(["x"], "file.txt"),
          fileDetails: { filename: "file.txt", folder: "folder" },
        }),
      ).rejects.toThrow("Failed to fetch pre-signed URL");
      expect(mockRequestAxios).not.toHaveBeenCalled();
    });

    it("throws when the presigned response is undefined", async () => {
      mockDocumentRequest.mockResolvedValue(undefined);

      await expect(
        saveObject({
          file: new File(["x"], "file.txt"),
          fileDetails: { filename: "file.txt", folder: "folder" },
        }),
      ).rejects.toThrow("Failed to fetch pre-signed URL");
    });
  });

  describe("getJsonObject", () => {
    it("returns parsed json for ok responses", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ a: 1 }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await getJsonObject("https://s3/get");

      expect(fetchMock).toHaveBeenCalledWith("https://s3/get");
      expect(result).toEqual({ a: 1 });
    });

    it("throws with the status for non-ok responses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );

      await expect(getJsonObject("https://s3/get")).rejects.toThrow(
        "Failed to fetch JSON data: 404",
      );
    });
  });

  describe("downloadObject", () => {
    it("requests a GET presigned url and downloads as blob", async () => {
      mockDocumentRequest.mockResolvedValue({ presigned_url: "https://s3/get" });
      const blob = new Blob(["x"]);
      mockRequestAxios.mockResolvedValue(blob);

      const result = await downloadObject({
        filename: "f.txt",
        s3sourceuri: "folder/f.txt",
      });

      expect(mockDocumentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { relative_url: "folder/f.txt", action: "GET" },
        }),
      );
      expect(mockRequestAxios).toHaveBeenCalledWith({
        url: "https://s3/get",
        method: "get",
        responseType: "blob",
      });
      expect(result).toBe(blob);
    });

    it("propagates presign failures", async () => {
      mockDocumentRequest.mockResolvedValue({});

      await expect(
        downloadObject({ filename: "f.txt", s3sourceuri: "x" }),
      ).rejects.toThrow("Failed to fetch pre-signed URL");
      expect(mockRequestAxios).not.toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("requests a DELETE presigned url and deletes the object", async () => {
      mockDocumentRequest.mockResolvedValue({ presigned_url: "https://s3/del" });
      mockRequestAxios.mockResolvedValue({ status: 204 });

      await deleteDocument({ filepath: "folder/f.txt" });

      expect(mockDocumentRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { relative_url: "folder/f.txt", action: "DELETE" },
        }),
      );
      expect(mockRequestAxios).toHaveBeenCalledWith({
        url: "https://s3/del",
        method: "delete",
      });
    });

    it("propagates presign failures", async () => {
      mockDocumentRequest.mockResolvedValue(null);

      await expect(deleteDocument({ filepath: "x" })).rejects.toThrow(
        "Failed to fetch pre-signed URL",
      );
    });
  });

  describe("copyObject", () => {
    it("posts a copy action with the destination", async () => {
      const response = { message: "ok", status: "success" };
      mockDocumentRequest.mockResolvedValue(response);

      const result = await copyObject({
        relativeUrl: "a/b.txt",
        destinationFolder: "dest",
        filename: "b.txt",
      });

      expect(mockDocumentRequest).toHaveBeenCalledWith({
        url: "/storage-operations/objects",
        method: "post",
        headers: { "Content-Type": "application/json" },
        data: {
          action: "copy",
          relative_url: "a/b.txt",
          destination_folder: "dest",
          filename: "b.txt",
        },
      });
      expect(result).toBe(response);
    });
  });

  describe("constants", () => {
    it("maps management plan items to their folders", () => {
      const map = NEW_PACKAGE_TYPE_S3_FOLDER_MAP[
        SubmissionPackageType.MANAGEMENT_PLAN
      ];
      expect(map?.[SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]).toEqual([
        S3_FOLDER.MANAGEMENT_PLANS,
        S3_FOLDER.SUPPORTING_DOCUMENTS,
      ]);
      expect(map?.[SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]).toEqual([
        S3_FOLDER.CONSULTATION_RECORDS,
      ]);
    });

    it("maps IEM items to their folders", () => {
      const map = NEW_PACKAGE_TYPE_S3_FOLDER_MAP[SubmissionPackageType.IEM];
      expect(map?.[SUBMISSION_ITEM_TYPE.IEM]).toEqual([
        S3_FOLDER.IEMS,
        S3_FOLDER.SUPPORTING_DOCUMENTS,
      ]);
    });
  });
});
