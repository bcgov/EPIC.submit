import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/_allProjectsLayout"
)({
  component: ProjectsPage,
  meta: () => [{ title: "All Projects" }],
});

function ProjectsPage() {
  return <Outlet />;
}
