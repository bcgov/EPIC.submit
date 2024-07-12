import { createLazyFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";

export const Route = createLazyFileRoute("/About")({
  component: () => <About />,
});
