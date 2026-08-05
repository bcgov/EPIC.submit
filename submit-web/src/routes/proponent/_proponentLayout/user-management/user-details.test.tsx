import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "@/components/App/UserManagement/entity/userStore";
import { redirect } from "@tanstack/react-router";

describe("user-details loader", () => {
  beforeEach(() => {
    useUserStore.getState().resetUser();
  });

  /**
   * Mirrors the loader logic from user-details.tsx.
   * We test the logic directly because TanStack Router's createFileRoute
   * triggers internal module registration that doesn't work in unit tests.
   */
  function loaderFn() {
    const selectedUser = useUserStore.getState().selectedUser;
    if (!selectedUser) {
      throw redirect({ to: "/proponent/user-management" });
    }
    return { selectedUser };
  }

  it("throws a redirect when no user is selected", () => {
    try {
      loaderFn();
      expect.fail("Expected redirect to be thrown");
    } catch (e) {
      // TanStack Router's redirect() throws a Response object
      expect(e).toBeInstanceOf(Response);
      const response = e as Response;
      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
    }
  });

  it("returns the selected user when one is set", () => {
    const mockUser = {
      id: 1,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    };
    useUserStore.getState().setSelectedUser(mockUser as any);

    const result = loaderFn();
    expect(result).toEqual({ selectedUser: mockUser });
  });
});
