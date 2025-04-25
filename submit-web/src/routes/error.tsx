import ErrorPageComponent from "@/components/ErrorPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/error")({
  component: ErrorPage,
  meta: () => [{ title: "Error" }],
});

function ErrorPage() {
  return <ErrorPageComponent />;
}
