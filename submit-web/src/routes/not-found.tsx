import PageNotFound from "@/components/Shared/PageNotFound";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/not-found")({
  component: NotFound,
});

function NotFound() {
  return <PageNotFound />;
}
