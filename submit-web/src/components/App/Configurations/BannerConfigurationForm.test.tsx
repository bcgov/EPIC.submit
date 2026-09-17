import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BannerConfigurationForm } from "./BannerConfigurationForm";
import {
  useCreateBannerConfiguration,
  useGetBannerConfigurations,
  useUpdateBannerConfiguration,
} from "@/hooks/api/useBannerConfigurations";

vi.mock("@/hooks/api/useBannerConfigurations", () => ({
  useGetBannerConfigurations: vi.fn(),
  useCreateBannerConfiguration: vi.fn(),
  useUpdateBannerConfiguration: vi.fn(),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

// Mock the Lexical editor: expose a button that fires onChange with fixed HTML.
vi.mock("@/components/Shared/LexicalEditor/LexicalEditor", () => ({
  default: ({
    onChange,
    defaultHtml,
    errorMsg,
  }: {
    onChange: (state: unknown, editor: unknown) => void;
    defaultHtml?: string;
    errorMsg?: string;
  }) => (
    <div>
      <div data-testid="editor-default">{defaultHtml}</div>
      {errorMsg && <div data-testid="editor-error">{errorMsg}</div>}
      <button
        type="button"
        onClick={() =>
          onChange(
            {},
            { read: (fn: () => void) => fn() } as unknown as Record<
              string,
              unknown
            >,
          )
        }
      >
        edit-content
      </button>
    </div>
  ),
}));

vi.mock("@lexical/html", () => ({
  $generateHtmlFromNodes: () => "<p>Typed banner content</p>",
}));

const mockGet = vi.mocked(useGetBannerConfigurations);
const mockCreate = vi.mocked(useCreateBannerConfiguration);
const mockUpdate = vi.mocked(useUpdateBannerConfiguration);

const createMutate = vi.fn();
const updateMutate = vi.fn();

describe("BannerConfigurationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate.mockReturnValue({ mutate: createMutate } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockReturnValue({ mutate: updateMutate } as any);
  });

  it("renders the type dropdown, content editor and enable toggle", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("edit-content")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("prefills content from the active banner", () => {
    mockGet.mockReturnValue({
      data: [
        {
          id: 7,
          banner_type: "Warning",
          content: "<p>Existing</p>",
          is_active: true,
        },
      ],
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<BannerConfigurationForm />);

    expect(screen.getByTestId("editor-default")).toHaveTextContent(
      "Existing",
    );
  });

  it("creates a new banner when none exists", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByText("edit-content"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalled();
    });
    const [payloadArg] = createMutate.mock.calls[0];
    expect(payloadArg.data.content).toBe("<p>Typed banner content</p>");
    expect(payloadArg.data.banner_type).toBe("Info");
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("updates the existing banner when one is active", async () => {
    mockGet.mockReturnValue({
      data: [
        {
          id: 7,
          banner_type: "Info",
          content: "<p>Existing</p>",
          is_active: true,
        },
      ],
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByText("edit-content"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalled();
    });
    const [args] = updateMutate.mock.calls[0];
    expect(args.bannerId).toBe(7);
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("blocks submission when content is empty", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Content is required.")).toBeInTheDocument();
    });
    expect(createMutate).not.toHaveBeenCalled();
  });
});
