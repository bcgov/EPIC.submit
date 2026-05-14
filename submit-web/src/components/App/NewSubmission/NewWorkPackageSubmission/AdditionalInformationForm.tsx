import {
  Grid,
  Typography,
} from "@mui/material";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";

export const AdditionalInformationForm = () => {

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="body1" fontWeight={"bold"}>
          Enter the name of your submission
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <ControlledTextField
          name="name"
          fullWidth
          placeholder="example: Blueprint for Proposed Changes of Surface Infrastructure"
          sx={{
            '& .MuiInputBase-input::placeholder': {
              fontStyle: 'italic',
            },
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body1" fontWeight={"bold"}>
          Enter the a brief description of your submission{" "}
          <Typography component="span" variant="body1" color="text.secondary">
            (optional)
          </Typography>
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <ControlledTextField
          name="description"
          fullWidth
          multiline
          rows={4}
          placeholder="example: Copy of our most recent blueprint, including a shapefile, as per our last discussion with Megan Smith."
          maxLength={500}
          sx={{
            '& .MuiInputBase-input::placeholder': {
              fontStyle: 'italic',
            },
          }}
        />
      </Grid>
    </Grid>
  );
};
