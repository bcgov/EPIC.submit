import { useCallback, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Button,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import * as yup from "yup";
import { useAccount } from "@/store/accountStore";
import { useGetAccountProjectsByUserId } from "@/hooks/api/useProjects";
import {
  useCreateInvitationToExistingProject,
} from "@/hooks/api/useInvitations";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";

const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Please enter an email address"),
});

export default function SecondAdminForm() {
  const [inviteAdmin, setInviteAdmin] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const navigate = useNavigate();
  const { accountId, proponentId, userId } = useAccount();
  const { invitation } = useCreateAccountFormStore();

  const { data: accountProjects } = useGetAccountProjectsByUserId({
    userId,
  });

  const filteredAccountProjects = useMemo(() => {
    if (!accountProjects || !invitation?.project_ids || invitation.project_ids.length === 0) {
      return [];
    }
    return accountProjects.filter((ap) =>
      invitation.project_ids.includes(ap.project_id)
    );
  }, [accountProjects, invitation?.project_ids]);

  const { mutate: createInvitation, isPending: isSendingInvite } =
    useCreateInvitationToExistingProject({
      onSuccess: () => {
        notify.success("Invitation sent successfully");
        setEmail("");
        navigateToNextStep();
      },
      onError: (error?: Error) => {
        notify.error(error?.message || "Failed to send invitation");
      },
    });

  const navigateToNextStep = useCallback(() => {
    navigate({ to: "/proponent/account-registration/confirm-projects" });
  }, [navigate]);

  const validateEmail = async (emailValue: string): Promise<boolean> => {
    try {
      await emailSchema.validate({ email: emailValue }, { abortEarly: false });
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setEmailError(error.errors[0] || "Please enter a valid email address");
      }
      return false;
    }
  };

  const onSendInvite = useCallback(async () => {
    const isValid = await validateEmail(email);
    if (!isValid) {
      return;
    }

    if (!accountId || !proponentId) {
      notify.error("Account information is missing");
      return;
    }

    const account_project_ids = filteredAccountProjects.map((ap) => ap.id);

    if (account_project_ids.length === 0) {
      notify.error("No account projects found matching the invitation");
      return;
    }

    createInvitation({
      account_id: accountId,
      proponent_id: proponentId,
      role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
      email,
      account_project_ids: account_project_ids,
    });
  }, [
    email,
    accountId,
    proponentId,
    filteredAccountProjects,
    createInvitation,
  ]);

  const onNext = useCallback(() => {
    navigateToNextStep();
  }, [navigateToNextStep]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <FormControl component="fieldset" sx={{ mb: 1 }}>
        <FormLabel component="legend" sx={{ fontWeight: 700, mb: 0.5 }}>
          Would you like to invite another Regulated Party Account Administrator now?
        </FormLabel>
        <RadioGroup
          aria-label="invite-admin"
          name="invite-admin"
          value={inviteAdmin}
          onChange={(e) => setInviteAdmin(e.target.value)}
          sx={{ mb: 2 }}
        >
          <FormControlLabel
            value="yes"
            control={<Radio />}
            label="Yes, I would like to invite another Regulated Party Account Administrator now"
          />
          <FormControlLabel
            value="no"
            control={<Radio />}
            label="No, I don’t want to invite a second Regulated Party Account Administrator now"
          />
        </RadioGroup>
      </FormControl>
      {inviteAdmin === "yes" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="body1" fontWeight={700}>
            Enter the new Regulated Party Account Administrator's email address.
          </Typography>
          <Typography variant="body1" color={BCDesignTokens.themeGray70}>
            The user will receive an email invitation to join your account.
          </Typography>
          <TextField
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) {
                setEmailError("");
              }
            }}
            error={!!emailError}
            helperText={emailError}
            disabled={isSendingInvite}
            sx={{ mb: 2 }}
          />
          <LoadingButton
            color="primary"
            onClick={onSendInvite}
            disabled={!email}
            loading={isSendingInvite}
          >
            Send Invite
          </LoadingButton>
        </Box>
      )}
      {inviteAdmin === "no" && (
        <Button color="primary" onClick={onNext}>
          Next
        </Button>
      )}
    </Box>
  );
}
