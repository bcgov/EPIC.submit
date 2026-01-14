import { useState } from "react";
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

export default function SecondAdminForm() {
  const [inviteAdmin, setInviteAdmin] = useState<string>("");

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
          Would you like to invite another Account Administrator now?
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
            label="Yes, I would like to invite another Account Administrator now"
          />
          <FormControlLabel
            value="no"
            control={<Radio />}
            label="No, I don’t want to invite a second Account Administrator now"
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
            Enter the new Account Administrator's email address.
          </Typography>
          <Typography variant="body1" color={BCDesignTokens.themeGray70}>
            The user will receive an email invitation to join your account.
          </Typography>
          <TextField type="email" variant="outlined" fullWidth sx={{ mb: 2 }} />
          <Button color="primary">
            Send Invite
          </Button>
        </Box>
      )}
      {inviteAdmin === "no" && <Button color="primary">Next</Button>}
    </Box>
  );
}
