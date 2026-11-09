import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDocumentSubmission } from "./useSubmissions";
import { submitRequest } from "@/utils/axiosUtils";
import {
  DOCUMENT_UPLOAD_CONFIG,
  UploadDestination,
} from "@/models/documentUploadConfig";

vi.mock("@/utils/axiosUtils", () => ({ submitRequest: vi.fn() }));

describe("document submission requests", () => {
  beforeEach(() => vi.clearAllMocks());

  // Exercise the request boundary shared by generic, update, and report uploads.
  it.each(Object.entries(DOCUMENT_UPLOAD_CONFIG))(
    "sends the configured folder and priority for %s",
    async (_key, destination) => {
      const saved = { id: 42 };
      vi.mocked(submitRequest).mockResolvedValueOnce(saved);
      const result = await createDocumentSubmission(12, destination, {
        name: "document.pdf",
        url: "storage/project/document.pdf",
      });
      expect(submitRequest).toHaveBeenCalledExactlyOnceWith({
        url: "/submissions/items/12",
        method: "post",
        data: {
          type: "DOCUMENT",
          sort_order: destination.sortOrder,
          data: {
            name: "document.pdf",
            url: "storage/project/document.pdf",
            folder: destination.value,
          },
        },
      });
      expect(result).toBe(saved);
    },
  );

  it("supports future priority groups without changing the request code", async () => {
    const destination: UploadDestination = {
      value: "future_appendices",
      label: "Appendices",
      sortOrder: 2,
    };
    await createDocumentSubmission(12, destination, {
      name: "appendix.pdf",
      url: "appendix.pdf",
    });
    expect(submitRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sort_order: 2,
          data: expect.objectContaining({ folder: "future_appendices" }),
        }),
      }),
    );
  });

  it("propagates failures so upload flows can show an error", async () => {
    const error = new Error("Submission could not be saved");
    vi.mocked(submitRequest).mockRejectedValueOnce(error);
    await expect(
      createDocumentSubmission(12, DOCUMENT_UPLOAD_CONFIG.IPDS, {
        name: "ipd.pdf",
        url: "ipd.pdf",
      }),
    ).rejects.toBe(error);
  });
});
