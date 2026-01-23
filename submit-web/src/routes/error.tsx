import { AppConfig } from "@/utils/config";
import {
  Container,
  Paper,
  Stack,
  Typography,
  Box,
  Button,
  Link as MuiLink,
} from "@mui/material";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/error")({
  component: ErrorPage,
  meta: () => [{ title: "Error" }],
});

function ErrorPage() {
  const { user } = useAuth();

  if (user?.expired) {
    return <Navigate to="/logout" />;
  }

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
        <Stack spacing={2}>
          <Typography variant="h4">
            Oops! Something unexpected happened.
          </Typography>
          <Box mx={4}>
            <Typography variant="body1">
              We encountered an error while processing your request. Please
              return to our home page and try again. If the problem persists,
              contact our support team at{" "}
              <MuiLink
                href={`mailto:${AppConfig.supportEmail}`}
                sx={{ ml: BCDesignTokens.layoutMarginXsmall }}
              >
                {AppConfig.supportEmail}
              </MuiLink>
            </Typography>
          </Box>
          <Stack direction="row" justifyContent="center" spacing={2}>
            <Link to="/oidc-callback">
              <Button sx={{ width: "fit-content" }}>Return to Home Page</Button>
            </Link>
            <Link to="/logout">
              <Button sx={{ width: "fit-content" }} color="secondary">
                Logout
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
