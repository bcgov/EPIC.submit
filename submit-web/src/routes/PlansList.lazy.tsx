import { createLazyFileRoute } from "@tanstack/react-router";
import PlanListPage from "@/pages/Plans/PlanListPage";

export const Route = createLazyFileRoute("/PlansList")({
  component: PlanListPage,
});
