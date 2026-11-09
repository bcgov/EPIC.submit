import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FoldersList } from "./FoldersList";
import { Submission } from "@/models/Submission";
import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { NEW_PACKAGE_TYPE_S3_FOLDER_MAP } from "@/hooks/api/useObjectStorage";

const { request, copyObject, close } = vi.hoisted(() => ({
  request: vi.fn().mockResolvedValue({}),
  copyObject: vi
    .fn()
    .mockResolvedValue({ status: "success", new_relative_url: "moved.pdf" }),
  close: vi.fn(),
}));
vi.mock("@/utils/axiosUtils", () => ({ submitRequest: request }));
vi.mock("@/hooks/api/useObjectStorage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/api/useObjectStorage")>()),
  copyObject,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ refetch: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: ({
    mutationFn,
  }: {
    mutationFn: (...args: unknown[]) => unknown;
  }) => ({ mutateAsync: mutationFn }),
}));
vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: () => ({}),
}));
vi.mock("@/components/Shared/Table/utils", () => ({
  getSubmissionFolderName: () => "destination",
}));
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setClose: close }),
}));
vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("moving between document sections", () => {
  it.each([
    { source: 0, destination: "supporting_documents", expected: 1 },
    { source: 1, destination: "management_plans", expected: 0 },
  ])(
    "sends destination priority $expected when source priority is $source",
    async ({ source, destination, expected }) => {
      const config =
        NEW_PACKAGE_TYPE_S3_FOLDER_MAP[SubmissionPackageType.MANAGEMENT_PLAN]!;
      const folder = Object.values(config)
        .flat()
        .find(({ value }) => value === destination)!;
      render(
        <FoldersList
          folders={[folder]}
          submissionToMove={
            {
              id: 9,
              sort_order: source,
              submitted_document: { url: "source.pdf", name: "plan.pdf" },
            } as Submission
          }
          submissionPackage={
            {
              id: 1,
              type: { name: SubmissionPackageType.MANAGEMENT_PLAN },
              items: [{ id: 7, type: { name: "Management Plan" } }],
            } as SubmissionPackage
          }
        />,
      );
      await userEvent.click(screen.getByText("Move"));
      await waitFor(() =>
        expect(request).toHaveBeenCalledWith(
          expect.objectContaining({
            url: "/submissions/9/document/move",
            data: {
              type: "DOCUMENT",
              data: expect.objectContaining({
                destination_item_id: 7,
                destination_folder: destination,
                destination_sort_order: expected,
              }),
            },
          }),
        ),
      );
      expect(close).toHaveBeenCalled();
    },
  );
});
