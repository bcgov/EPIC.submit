import { PageLoader } from "@/components/Shared/PageLoader";
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
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { OidcConfig } from "@/utils/config";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { BCDesignTokens } from "epic.theme";
import { IDENTITY_PROVIDERS } from "@/models/User";
import { useGetInvitation } from "@/hooks/api/useInvitations";
import { useCreateAccountForm } from "@/components/registration/formStore";
import { LoginOptions } from "@/components/Login/LoginOptions";

export const Route = createFileRoute("/proponent/registration/")({
  component: Registration,
});

function Registration() {
  const { token } = Route.useSearch<{ token: string }>();
  const auth = useAuth();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { setInvitation, invitation } = useCreateAccountForm();

  const {
    data: invitationData,
    isPending,
    isSuccess,
    isError,
    error,
  } = useGetInvitation(token, Boolean(token));

  useEffect(() => {
    if (!isPending) {
      if (error) {
        notify.error("Registration link is invalid");
      } else if (isSuccess && invitationData) {
        setInvitation(invitationData);
      }
    }
  }, [
    isPending,
    error,
    isSuccess,
    invitationData,
    setInvitation,
    isAuthenticated,
    isAuthLoading,
  ]);

  if (isPending) {
    return <PageLoader />;
  }

  if (isError || error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h4" color="error">
          Invalid Registration Link
        </Typography>
        <Typography variant="body1">
          The registration link is invalid or expired. Please check your email
          for a valid link.
        </Typography>
      </Container>
    );
  }

  if (!isAuthLoading && invitation && isAuthenticated) {
    return <Navigate to="/proponent/registration/create-account" />;
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
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={5}>
          <Box sx={{ p: 3, pb: 0 }}>
            <BarTitle title={"How do I get access?"} />
            <LoginOptions />
          </Box>

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
              <Link href="mailto:EAO.ManagementPlanSupport@gov.bc.ca">
                EAO.ManagementPlanSupport@gov.bc.ca
              </Link>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
