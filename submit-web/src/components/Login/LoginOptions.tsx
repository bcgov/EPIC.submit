import { Button, Link, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useAuth } from "react-oidc-context";
import { OidcConfig } from "@/utils/config";
import { IDENTITY_PROVIDERS } from "@/models/User";

export const LoginOptions = () => {
  const auth = useAuth();
  return (
    <>
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
            auth.signinRedirect({
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
          For more information on how to use or set up a BC Services Card
          account, visit{" "}
          <Link href="https://www.id.gov.bc.ca" target="_blank" rel="noopener">
            www.id.gov.bc.ca
          </Link>
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() =>
            auth.signinRedirect({
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
    </>
  );
};
