import {
  Box,
  Link,
  Stack,
  Toolbar,
  Container,
  Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { YellowBar } from "@/components/Shared/YellowBar";
import { AppConfig } from "@/utils/config";

export const Route = createFileRoute("/need-access")({
  component: NeedAccess,
});

function NeedAccess() {
  return (
    <Container
      maxWidth={"md"}
      sx={{
        mb: BCDesignTokens.layoutMarginXlarge,
        display: "flex",
        justifyContent: "left",
        alignItems: "left",
        flexDirection: "column",
      }}
    >
      <Toolbar />
      <Box sx={{ mt: BCDesignTokens.layoutMarginMedium }}>
        <YellowBar />
        <Typography variant="h1" fontWeight="bold" gutterBottom>
          Need Access to EPIC.submit?
        </Typography>
      </Box>
      <Stack gap={BCDesignTokens.layoutMarginSmall}>
        <p>
          It appears you've arrived at EPIC.submit without a direct access link
          or previous registration
        </p>
        <p>
          EPIC.submit is available to certificate and exemption holders managing
          their post-decision documentation requirements.
        </p>
        <p>
          If you believe you should have access to EPIC.submit , please contact{" "}
          the Environmental Assessment Office at{" "}
          <Link href={`mailto:${AppConfig.epicSystemEmail}`}>
            {AppConfig.epicSystemEmail}
          </Link>
          .
        </p>
      </Stack>
    </Container>
  );
}
