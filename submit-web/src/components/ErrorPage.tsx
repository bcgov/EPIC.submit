import { Paper, Container, Stack, Button } from "@mui/material";
import { Link } from "@tanstack/react-router";

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
        <Stack>
          <p>Oops! something wrong happened.</p>
          <Link to="/oidc-callback">
            <Button sx={{ width: "fit-content" }}>Go to Home</Button>
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
