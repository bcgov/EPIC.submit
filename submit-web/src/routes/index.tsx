import { createFileRoute } from "@tanstack/react-router";
import {
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  Link,
  Container,
  Toolbar,
  Stack,
} from "@mui/material";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { PageLoader } from "@/components/Shared/PageLoader";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { OidcConfig } from "@/utils/config";
import { BCDesignTokens } from "epic.theme";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const auth = useAuth();
  const { isAuthenticated, signoutSilent, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      signoutSilent();
    }
  }, [isAuthenticated, signoutSilent]);

  if (isAuthenticated || isLoading) {
    return <PageLoader />;
  }

  return (
    <Container maxWidth={"lg"} sx={{ mb: BCDesignTokens.layoutMarginXlarge }}>
      <Toolbar />
      <Box p={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
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

            <Typography variant="body2" mt={1}>
              The Environmental Assessment Office (EAO) of British Columbia is
              developing a streamlined system to make document submissions and
              management more efficient for certificate holders.
            </Typography>
            <Typography variant="body2" mt={1}>
              EPIC.submit is a custom-built portal designed specifically for
              certificate holders to manage all documentation requirements in
              the post-decision phase of the environmental assessment process.
              It provides a centralized platform where users can submit
              management plans and reports, track submission status, and
              maintain document version control—all in one place.
            </Typography>

            <Typography variant="body2" mt={1}>
              This system is part of the larger epic ecosystem and has been
              developed to eliminate fragmented communication channels and
              create a more transparent, efficient submission process for both
              certificate holders and EAO staff.
            </Typography>

            <Typography variant="h6" fontWeight="bold" mt={3}>
              What can I do in EPIC.submit?
            </Typography>
            <ul>
              <Typography component="li" variant="body2">
                Upload and submit management plans and reports require as part
                of your environmental assesment certificate conditions
              </Typography>
              <Typography component="li" variant="body2">
                Create complete submission packages with supporting
                documentation and forms
              </Typography>
              <Typography component="li" variant="body2">
                Track the status of submissions through visual status badges and
                notifications
              </Typography>
              <Typography component="li" variant="body2">
                Receive email confirmations when your submissions are received
              </Typography>
              <Typography component="li" variant="body2">
                View your submission history and access previous versions
              </Typography>
              <Typography component="li" variant="body2">
                Respond to update requests directly through the portal
              </Typography>
              <Typography component="li" variant="body2">
                Manage document versions efficiently without email
                back-and-forth
              </Typography>
              <Typography component="li" variant="body2">
                Stay connected with the EAO through a streamlined communication
                channel
              </Typography>
            </ul>
          </Paper>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <BarTitle title={"How do I get access?"} />
            <Stack
              mt={2}
              p={2}
              spacing={2}
              sx={{ border: `1px solid ${BCDesignTokens.themeGray30}` }}
            >
              <Typography variant="h6">
                Login with your Business BCeID
              </Typography>
              <Typography variant="body1">
                Business BCeID Lorem Ipsum
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() =>
                  auth.signinRedirect({
                    redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
                  })
                }
              >
                Login with Business BCeID
              </Button>
            </Stack>
            <Stack
              mt={2}
              p={2}
              spacing={2}
              sx={{ border: `1px solid ${BCDesignTokens.themeGray30}` }}
            >
              <Typography variant="h6">
                Login with your BC Services Card account
              </Typography>
              <Typography variant="body2" pb={4}>
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
                  auth.signinRedirect({
                    redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
                  })
                }
                sx={{ mt: 1 }}
              >
                Login with BC Services Card
              </Button>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Who can use EPIC.submit?
            </Typography>
            <Typography variant="body2" mt={1}>
              Currently, EPIC.submit is available to certificate holders
              managing their post-decision documentation requirements. In the
              future, the system will be expanded to include proponents earlier
              in the environmental assessment process.
            </Typography>
            <Typography variant="body2" mt={1}>
              The portal is accessible to both certificate holders and EAO
              staff, creating a shared platform for document submission, review,
              and communication.
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Getting Started with EPIC.submit
            </Typography>
            <Typography variant="body2" mt={1}>
              To begin using EPIC.submit, certificate holders will receive a
              login link and access instructions from the EAO. The intuitive
              interface guides users through the submission process, allowing
              for efficient document uploading, form completion, and submission
              tracking.
            </Typography>
            <Typography variant="body2" mt={1}>
              For assistance, contact the EAO support team at [contact
              information].
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
