import { Paper, Container } from "@mui/material";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function ErrorPage() {
  const { signoutRedirect } = useAuth();

  useEffect(() => {
    signoutRedirect();
  }, [signoutRedirect]);

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
        <p>You will be signed out.</p>
      </Paper>
    </Container>
  );
}
