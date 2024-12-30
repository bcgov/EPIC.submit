import { createLazyFileRoute } from "@tanstack/react-router";
import { AppConfig } from "@/utils/config";

export const Route = createLazyFileRoute("/proponent/_proponentLayout/aboutpage")({
  component: About,
  meta: () => [{ title: "About" }],
});

function About() {
  return (
    <>
      <h3>About Page of {AppConfig.appTitle}</h3>
    </>
  );
}
