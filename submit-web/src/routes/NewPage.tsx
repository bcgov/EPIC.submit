import { Container } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/NewPage")({
  component: NewPage,
});

function NewPage() {
  return (
    <Container>
      <h2>New Page</h2>
      <h3 className="p-2">File based routing - Auto Creation!</h3>
    </Container>
  );
}