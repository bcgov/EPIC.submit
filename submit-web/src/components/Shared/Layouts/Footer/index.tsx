import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import EAOLogo from "@/assets/images/EAO_Logo.png";
import { COPYRIGHT_TEXT, FOOTER_COLORS, FOOTER_DESCRIPTION } from "./constants";
import { theme } from "@/styles/theme";
import { useAuth } from "react-oidc-context";
import { OidcConfig } from "@/utils/config";

const Footer = () => {
  const { signinRedirect, isAuthenticated } = useAuth();
  return (
    <Grid
      container
      spacing={0}
      sx={{
        justifyContent: "center",
        alignItems: "center"
      }}>
      <Grid
        size={12}
        sx={{
          padding: { xs: "2em 1em", md: "2em 6em" },
          backgroundColor: FOOTER_COLORS.BACKGROUND,
          borderTop: `6px solid ${FOOTER_COLORS.BORDER}`,
          borderBottom: `6px solid ${FOOTER_COLORS.BORDER}`
        }}>
        <Typography variant="body1" color="white">
          {FOOTER_DESCRIPTION}
        </Typography>
      </Grid>
      <Grid
        container
        rowSpacing={3}
        size={12}
        sx={{
          padding: { xs: "2em 1em", md: "2em 6em" },
          justifyContent: "flex-start",
          alignItems: "flex-start"
        }}>
        <Grid
          container
          rowSpacing={3}
          size={{
            xs: 12,
            md: 6
          }}
          sx={{
            justifyContent: "flex-start",
            alignItems: "flex-start"
          }}>
          <Grid size={12}>
            <Box>
              <img
                src={EAOLogo}
                alt="EAO Logo"
                style={{ height: "5em", width: "24em" }}
              />
            </Box>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Divider sx={{ borderColor: theme.palette.text.primary }} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6
          }}>
          <Typography variant="body1">{COPYRIGHT_TEXT}</Typography>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6
          }}>
          {!isAuthenticated && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end"
              }}>
              <Button
                color="secondary"
                onClick={() => {
                  signinRedirect({
                    redirect_uri: `${OidcConfig.redirect_uri}`,
                    extraQueryParams: {
                      kc_idp_hint: OidcConfig.kc_idp_hint,
                    },
                  });
                }}
              >
                Admin Login
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Footer;
