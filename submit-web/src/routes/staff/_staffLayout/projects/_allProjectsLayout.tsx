import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/_allProjectsLayout"
)({
  component: ProjectsPage,
  meta: () => [{ title: "All Projects" }],
});

function ProjectsPage() {
  return <Outlet />;
}
