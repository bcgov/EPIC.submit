import { useCallback, useState } from "react";
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
} from "@mui/material";
import { useCreateAccountFormStore } from "./formStore";

export default function RegistrationCompletedForm() {
  const [isCompleted, setIsCompleted] = useState<string>("");
  const { setCompleted } = useCreateAccountFormStore();

  const navigateToNextStep = useCallback(() => {
    setCompleted(isCompleted);
  }, [isCompleted, setCompleted]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        mb: 6,
      }}
    >
      <FormControl component="fieldset" sx={{ mb: 1 }}>
        <FormLabel component="legend" sx={{ fontWeight: 700, mb: 0.5 }}>
          What would you like to do now?
        </FormLabel>
        <RadioGroup
          aria-label="is-completed"
          name="is-completed"
          value={isCompleted}
          onChange={(e) => setIsCompleted(e.target.value)}
          sx={{ mb: 2 }}
        >
          <FormControlLabel
            value="home"
            control={<Radio />}
            label="Go to the home page"
          />
          <FormControlLabel
            value="user-management"
            control={<Radio />}
            label="Go to the User Management page to add other users to the account"
          />
        </RadioGroup>
      </FormControl>
      {!!isCompleted && (
        <Button color="primary" onClick={navigateToNextStep}>
          Go
        </Button>
      )}
    </Box>
  );
}
