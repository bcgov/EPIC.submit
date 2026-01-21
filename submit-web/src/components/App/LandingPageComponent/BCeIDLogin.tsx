import { IDENTITY_PROVIDERS } from "@/models/User";
import { OidcConfig } from "@/utils/config";
import { Stack, Typography, Link, Button } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useAuth } from "react-oidc-context";

export const BCeIDLogin = () => {
  const { signinRedirect } = useAuth();

  return (
    <Stack
      p={2}
      my={BCDesignTokens.layoutMarginXlarge}
      spacing={2}
      sx={{ border: `1px solid ${BCDesignTokens.themeGray30}` }}
    >
      <Typography variant="h6">Login with your Business BCeID</Typography>
      <Typography variant="body1">
        For more information on registering for a Business BCeID, visit{" "}
        <Link
          href="https://www.bceid.ca/register/business/getting_started/getting_started.aspx"
          target="_blank"
          rel="noopener"
        >
          https://www.bceid.ca/register
        </Link>
      </Typography>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1 }}
        onClick={() =>
          signinRedirect({
            redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
            extraQueryParams: {
              kc_idp_hint: IDENTITY_PROVIDERS.BCEID,
            },
          })
        }
      >
        Login with Business BCeID
      </Button>
    </Stack>
  );
};
