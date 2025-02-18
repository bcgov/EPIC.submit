import { Paper, Container } from "@mui/material";

export default function ErrorPage() {
  return (
    <Container id="Error">
      <Paper
        elevation={3}
        sx={{
          padding: "1rem",
          marginTop: "2rem",
          textAlign: "center",
        }}
      >
        <p>Oops! something wrong happened.</p>
      </Paper>
    </Container>
  );
}
