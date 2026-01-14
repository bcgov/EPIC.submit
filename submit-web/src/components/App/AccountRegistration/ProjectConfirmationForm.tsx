import { useState } from "react";
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Alert,
} from "@mui/material";

export default function ProjectConfirmationForm() {
  const [isCorrect, setIsCorrect] = useState<string>("");

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
          Is this information correct?
        </FormLabel>
        <RadioGroup
          aria-label="is-correct"
          name="is-correct"
          value={isCorrect}
          onChange={(e) => setIsCorrect(e.target.value)}
          sx={{ mb: 2 }}
        >
          <FormControlLabel
            value="yes"
            control={<Radio />}
            label="Yes, this is correct"
          />
          <FormControlLabel
            value="no"
            control={<Radio />}
            label="No, this information is incorrect"
          />
        </RadioGroup>
      </FormControl>
      {isCorrect === "yes" && <Button color="primary">Next</Button>}
      {isCorrect === "no" && (
        <Alert severity="warning" sx={{ width: "100%" }}>
          Please contact EAO.
        </Alert>
      )}
    </Box>
  );
}
