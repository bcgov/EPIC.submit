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

const generateHtml = vi.fn(() => "<p>Typed banner content</p>");

vi.mock("@lexical/html", () => ({
  $generateHtmlFromNodes: () => generateHtml(),
}));

const mockGet = vi.mocked(useGetBannerConfigurations);
const mockCreate = vi.mocked(useCreateBannerConfiguration);
const mockUpdate = vi.mocked(useUpdateBannerConfiguration);

const createMutate = vi.fn();
const updateMutate = vi.fn();

describe("BannerConfigurationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateHtml.mockReturnValue("<p>Typed banner content</p>");
    mockCreate.mockReturnValue({ mutate: createMutate } as any);
    mockUpdate.mockReturnValue({ mutate: updateMutate } as any);
  });

  it("renders the type dropdown, content editor and enable toggle", () => {
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
    } as any);
    render(<BannerConfigurationForm />);

    expect(screen.getByTestId("editor-default")).toHaveTextContent(
      "Existing",
    );
  });

  it("creates a new banner when none exists", async () => {
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
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Content is required.")).toBeInTheDocument();
    });
    expect(createMutate).not.toHaveBeenCalled();
  });

  it.each([
    ["empty paragraph", "<p></p>"],
    ["paragraph with only a line break", "<p><br></p>"],
    ["markup with no visible text", "<p>   </p>"],
  ])(
    "treats %s as empty content and blocks submission",
    async (_label, html) => {
      generateHtml.mockReturnValue(html);
      mockGet.mockReturnValue({ data: [], isLoading: false } as any);
      render(<BannerConfigurationForm />);

      fireEvent.click(screen.getByText("edit-content"));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByText("Content is required.")).toBeInTheDocument();
      });
      expect(createMutate).not.toHaveBeenCalled();
    },
  );

  it("does not let a crafted nested tag reconstruct into markup that reads as text", async () => {
    // A single-pass regex tag strip (/<[^>]*>/g) would turn this into
    // "<script>alert(1)</script>", leaving visible text and passing the
    // emptiness check with unsafe content. The DOM parser reads only real
    // text, so the crafted string is correctly seen as non-empty and stored
    // verbatim for the render-time sanitizer to handle.
    generateHtml.mockReturnValue("<scr<p></p>ipt>alert(1)</script>");
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByText("edit-content"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalled();
    });
    const [payloadArg] = createMutate.mock.calls[0];
    expect(payloadArg.data.content).toBe("<scr<p></p>ipt>alert(1)</script>");
  });

  it("keeps normal typed content and submits it unchanged", async () => {
    generateHtml.mockReturnValue("<p>Hello world</p>");
    mockGet.mockReturnValue({ data: [], isLoading: false } as any);
    render(<BannerConfigurationForm />);

    fireEvent.click(screen.getByText("edit-content"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalled();
    });
    const [payloadArg] = createMutate.mock.calls[0];
    expect(payloadArg.data.content).toBe("<p>Hello world</p>");
  });
});
