import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  Link,
  Container,
  Stack,
} from "@mui/material";
import { useAuth } from "react-oidc-context";
import { PageLoader } from "@/components/Shared/PageLoader";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { OidcConfig, AppConfig } from "@/utils/config";
import { BCDesignTokens } from "epic.theme";
import { IDENTITY_PROVIDERS } from "@/models/User";
import { UserGuideButton } from "@/components/UserGuideButton";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading, signinRedirect } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/oidc-callback" />;
  }

  return (
    <Container maxWidth={"lg"} sx={{ mb: BCDesignTokens.layoutMarginXlarge }}>
      <Box
        p={3}
        pt={BCDesignTokens.layoutPaddingSmall}
        mt={BCDesignTokens.layoutMarginXxxlarge}
      >
        <Typography variant="h1" fontWeight="bold" gutterBottom>
          Welcome to EPIC.submit
        </Typography>
        <Typography variant="h6" gutterBottom fontWeight={400}>
          EPIC.submit currently supports the submission of Management Plans,
          Independent Environmental Monitor Terms of Engagement, and certain
          reports.
        </Typography>
      </Box>
      <Grid container spacing={4}>
        {/* Left Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <BarTitle title={"What is EPIC.submit"} />

            <Typography variant="body1" mt={BCDesignTokens.layoutMarginXlarge}>
              The Environmental Assessment Office (EAO) of British Columbia is
              developing a streamlined system to make document submissions and
              management more efficient for environmental assessment certificate
              holders.
            </Typography>
            <Typography variant="body1" mt={1}>
              EPIC.submit is a custom-built portal designed specifically for
              certificate holders to manage all documentation requirements in
              the post-decision phase of the environmental assessment process.
              It provides a centralized platform where users can submit
              management plans and reports, track submission status, and
              maintain document version control—all in one place.
            </Typography>

            <Typography variant="body1" mt={1}>
              This system is part of the larger epic ecosystem and has been
              developed to eliminate fragmented communication channels, and
              create a more transparent and efficient submission process for
              both certificate holders and EAO staff.
            </Typography>

            <Typography variant="h6" fontWeight="bold" mt={3}>
              What can I do in EPIC.submit?
            </Typography>
            <ul>
              <Typography component="li" variant="body1">
                Upload and submit management plans and reports require as part
                of your environmental assesment certificate conditions
              </Typography>
              <Typography component="li" variant="body1">
                Create complete submission packages with supporting
                documentation and forms
              </Typography>
              <Typography component="li" variant="body1">
                Track the status of submissions through visual status badges and
                notifications
              </Typography>
              <Typography component="li" variant="body1">
                Receive email confirmations when your submissions are received
              </Typography>
              <Typography component="li" variant="body1">
                View your submission history and access previous versions
              </Typography>
              <Typography component="li" variant="body1">
                Respond to update requests directly through the portal
              </Typography>
              <Typography component="li" variant="body1">
                Manage document versions efficiently without email
                back-and-forth
              </Typography>
              <Typography component="li" variant="body1">
                Stay connected with the EAO through a streamlined communication
                channel
              </Typography>
            </ul>
          </Paper>

          <Box sx={{ px: 3, py: 0 }} mb={BCDesignTokens.layoutMarginLarge}>
            <Typography variant="h6" fontWeight="bold">
              Who can use EPIC.submit?
            </Typography>
            <Typography variant="body1" mt={1}>
              Currently, EPIC.submit is available to certificate holders
              managing their post-decision documentation requirements. In the
              future, the system will be expanded to include proponents earlier
              in the environmental assessment process.
            </Typography>
            <Typography variant="body1" mt={1}>
              The portal is accessible to both certificate holders and EAO
              staff, creating a shared platform for document submission, review,
              and communication.
            </Typography>
          </Box>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={5}>
          <Box sx={{ p: 3, pb: 0 }}>
            <BarTitle title={"How do I get access?"} />
            <Stack
              p={2}
              my={BCDesignTokens.layoutMarginXlarge}
              spacing={2}
              sx={{ border: `1px solid ${BCDesignTokens.themeGray30}` }}
            >
              <Typography variant="h6">
                Login with your Business BCeID
              </Typography>
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
                <Link
                  href="https://www.id.gov.bc.ca"
                  target="_blank"
                  rel="noopener"
                >
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
          </Box>

          <Paper elevation={0} sx={{ p: 3, pt: 0 }}>
            <Typography variant="h6" fontWeight="bold">
              Getting Started with EPIC.submit
            </Typography>
            <Typography variant="body1" mt={1}>
              To begin using EPIC.submit, certificate holders will receive a
              login link and access instructions from the EAO. The intuitive
              interface guides users through the submission process, allowing
              for efficient document uploading, form completion, and submission
              tracking.
            </Typography>
            <Typography variant="body1" mt={1}>
              For assistance with EPIC.submit, please contact the EAO support
              team at{" "}
              <Link href={`mailto:${AppConfig.supportEmail}`}>
                {AppConfig.supportEmail}
              </Link>
            </Typography>
            <Box mt="24px">
              <UserGuideButton />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
