import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DOMPurify from "dompurify";
import { BannerRenderer } from "./BannerRenderer";
import { useGetActiveBanner } from "@/hooks/api/useBannerConfigurations";

vi.mock("@/hooks/api/useBannerConfigurations", () => ({
  useGetActiveBanner: vi.fn(),
}));

const mockUseGetActiveBanner = vi.mocked(useGetActiveBanner);

const mockBanner = (overrides = {}) => ({
  data: {
    id: 1,
    banner_type: "Info",
    content: "<p>Scheduled maintenance tonight</p>",
    is_active: true,
    ...overrides,
  },
});

describe("BannerRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there is no active banner", () => {
    mockUseGetActiveBanner.mockReturnValue({ data: null } as any);
    const { container } = render(<BannerRenderer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the sanitized banner content", () => {
    mockUseGetActiveBanner.mockReturnValue(mockBanner() as any);
    render(<BannerRenderer />);
    expect(
      screen.getByText("Scheduled maintenance tonight"),
    ).toBeInTheDocument();
  });

  it("sanitizes the content through DOMPurify before rendering", () => {
    const sanitizeSpy = vi.spyOn(DOMPurify, "sanitize");
    const dirty = "<p>Safe text</p><script>alert('x')</script>";
    mockUseGetActiveBanner.mockReturnValue(mockBanner({ content: dirty }) as any);

    render(<BannerRenderer />);

    expect(sanitizeSpy).toHaveBeenCalledWith(dirty);
    expect(screen.getByText("Safe text")).toBeInTheDocument();
    sanitizeSpy.mockRestore();
  });

  it("uses the status role for informational banners", () => {
    mockUseGetActiveBanner.mockReturnValue(mockBanner() as any);
    render(<BannerRenderer />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uses the alert role for warning banners", () => {
    mockUseGetActiveBanner.mockReturnValue(
      mockBanner({ banner_type: "Warning" }) as any,
    );
    render(<BannerRenderer />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders nothing when the active banner has empty content", () => {
    mockUseGetActiveBanner.mockReturnValue(
      mockBanner({ content: "" }) as any,
    );
    const { container } = render(<BannerRenderer />);
    expect(container).toBeEmptyDOMElement();
  });
});
