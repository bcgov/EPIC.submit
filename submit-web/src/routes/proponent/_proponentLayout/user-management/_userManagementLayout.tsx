import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/_userManagementLayout"
)({
  meta: () => [{ title: "User Management" }],
  component: () => <Outlet />,
});
