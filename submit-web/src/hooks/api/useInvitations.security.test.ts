import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, ReactNode } from "react";
import { useGetInvitationProponent } from "./useInvitations";
import { publicRequest, submitRequest } from "@/utils/axiosUtils";

vi.mock("@/utils/axiosUtils", () => ({
  publicRequest: vi.fn(),
  submitRequest: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe("invitation-scoped registration lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads company details using the invitation before login", async () => {
    const details = { id: 7, name: "Company", eligibility_entries: [] };
    vi.mocked(publicRequest).mockResolvedValue(details);
    const { result } = renderHook(() => useGetInvitationProponent("invitation-token"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(publicRequest).toHaveBeenCalledWith({ url: "/invitations/invitation-token/proponent" });
    expect(submitRequest).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(details);
  });

  it("does not request company information without an invitation", () => {
    renderHook(() => useGetInvitationProponent(undefined), { wrapper });
    expect(publicRequest).not.toHaveBeenCalled();
  });
});
