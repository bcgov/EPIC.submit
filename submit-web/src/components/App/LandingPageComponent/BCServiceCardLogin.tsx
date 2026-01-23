import { IDENTITY_PROVIDERS } from "@/models/User";
import { OidcConfig } from "@/utils/config";
import { Stack, Typography, Link, Button } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useAuth } from "react-oidc-context";

export const BCServiceCardLogin = () => {
  const { signinRedirect } = useAuth();

  return (
    <Stack
      p={2}
      mb={BCDesignTokens.layoutMarginLarge}
      spacing={2}
      sx={{ border: `1px solid ${BCDesignTokens.themeGray30}` }}
    >
      <Typography variant="h6">
        Login with your BC Services Card account
      </Typography>
      <Typography variant="body1" pb={4}>
        For more information on how to use or set up a BC Services Card account,
        visit{" "}
        <Link href="https://www.id.gov.bc.ca" target="_blank" rel="noopener">
          www.id.gov.bc.ca
        </Link>
      </Typography>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={() =>
          signinRedirect({
            redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
            extraQueryParams: {
              kc_idp_hint: IDENTITY_PROVIDERS.BCSC,
            },
          })
        }
        sx={{ mt: 1 }}
      >
        Login with BC Services Card
      </Button>
    </Stack>
  );
};
